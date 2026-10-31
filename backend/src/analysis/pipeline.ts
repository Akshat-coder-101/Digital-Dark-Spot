import { IngestedSource, SourceInput } from '../ingestion/types.js';
import { ingestSources } from '../ingestion/fetcher.js';
import { extractClaimsAndAttributes, deriveExpectedAttributesForQuestion } from './extraction.js';
import { formatAttributeLabel, detectGaps } from './gaps.js';
import { detectConflicts } from './conflicts.js';
import { auditFreshness } from './freshness.js';
import { buildCoverageMatrix } from './matrix.js';
import { buildPrioritizedChecklist } from './checklist.js';
import { runSecondPassTargetedGapSearch } from '../search/secondPass.js';
import { FullAnalysisReport, JobProgress, AnalysisStage, PotentialGap, ChecklistItem } from './types.js';
import { LLMCache, llmCache } from '../llm/cache.js';
import { normalizeAttributeName, areAttributesMatching } from './canonicalization.js';
import { isOfficialDomain } from '../search/adapters/tavily.js';
import { persistentStore } from '../store/persistentStore.js';
import crypto from 'crypto';

export type ProgressCallback = (progress: JobProgress) => void;

export class AnalysisPipeline {
  private activeJobs: Map<string, JobProgress> = new Map();
  private reports: Map<string, FullAnalysisReport> = new Map();

  public getJob(id: string): JobProgress | undefined {
    return this.activeJobs.get(id);
  }

  public getReport(id: string): FullAnalysisReport | undefined {
    let report = this.reports.get(id);
    if (!report) {
      report = persistentStore.getReport(id) || persistentStore.getDemoSnapshot(id) || undefined;
      if (report) {
        this.reports.set(id, report);
      }
    }
    return report;
  }

  public setReport(report: FullAnalysisReport): void {
    this.reports.set(report.id, report);
    persistentStore.saveReport(report);
  }

  private updateProgress(
    jobId: string,
    stage: AnalysisStage,
    stageIndex: number,
    progressPercent: number,
    currentAction: string,
    sourcesStatus: JobProgress['sourcesStatus'],
    onProgress?: ProgressCallback,
    reportId?: string,
    error?: string
  ): void {
    const job: JobProgress = {
      id: jobId,
      stage,
      stageIndex,
      totalStages: 5,
      progressPercent,
      currentAction,
      sourcesStatus,
      reportId,
      error
    };
    this.activeJobs.set(jobId, job);
    if (onProgress) onProgress(job);
  }

  public async run(
    jobId: string,
    question: string,
    sourceInputs: SourceInput[],
    forceRerun: boolean = false,
    onProgress?: ProgressCallback,
    customExpectedAttributes?: string[]
  ): Promise<FullAnalysisReport> {
    // If no sources are provided, execute the honest AI-suggested fallback flow
    if (!sourceInputs || sourceInputs.length === 0) {
      return this.runHonestFallback(jobId, question, onProgress, customExpectedAttributes);
    }

    const initialChips: Array<{ id: string; title: string; status: 'pending' | 'ready' | 'error'; reason?: string }> = sourceInputs.map((s, idx) => ({
      id: s.id || `src-${idx + 1}`,
      title: s.title || (s.type === 'url' ? s.value : `Pasted Note ${idx + 1}`),
      status: 'pending' as const
    }));

    let currentChips = [...initialChips];

    try {
      // STAGE 1: Fetching (Ingestion & SSRF)
      this.updateProgress(
        jobId,
        'Fetching',
        1,
        20,
        'Retrieving source content & verifying security policy...',
        initialChips,
        onProgress
      );

      const ingestedSources = await ingestSources(sourceInputs);
      const updatedChips = ingestedSources.map(s => ({
        id: s.id,
        title: s.title,
        status: s.status === 'ready' ? ('ready' as const) : ('error' as const),
        reason: s.status === 'ready' ? undefined : (s.errorMessage || 'blocked or timed out')
      }));
      currentChips = updatedChips;

      const readySources = ingestedSources.filter(s => s.status === 'ready');
      if (readySources.length === 0) {
        throw new Error(
          'This site blocked automated access or took too long. Paste the page text instead.'
        );
      }

      // Check Cache
      const cacheKey = LLMCache.computeHash(
        question,
        readySources.map(s => s.cleanedText)
      );

      let extractionData: any;
      let usedProvider = 'Google Gemini';
      let usedModel = 'gemini-1.5-flash';
      let isCached = false;

      if (!forceRerun) {
        const cached = llmCache.get(cacheKey);
        if (cached) {
          extractionData = cached.data;
          usedProvider = cached.provider;
          usedModel = cached.model;
          isCached = true;
        }
      }

      // STAGE 2: Reading (AI Extraction & Verbatim Verification)
      this.updateProgress(
        jobId,
        'Reading',
        2,
        45,
        isCached ? 'Loading cached extraction results...' : 'Extracting claims and verifying exact verbatim quotes...',
        updatedChips,
        onProgress
      );

      if (!extractionData) {
        extractionData = await extractClaimsAndAttributes(question, readySources, customExpectedAttributes);
        usedProvider = extractionData.provider;
        usedModel = extractionData.model;
        llmCache.set(cacheKey, extractionData, usedProvider, usedModel);
      } else if (customExpectedAttributes && customExpectedAttributes.length > 0) {
        extractionData.expected_attributes = customExpectedAttributes.map(normalizeAttributeName);
      }

      // Auto-recognize official portal sources (.gov, .gov.in, .nic.in, etc.) for portal-related attributes
      const portalAttrs = (extractionData.expected_attributes || []).filter((a: string) =>
        a.includes('portal') || a.includes('website') || a.includes('link')
      );
      if (portalAttrs.length > 0) {
        for (const source of readySources) {
          const isGov = isOfficialDomain(source.domain) ||
                        source.domain.endsWith('.gov') ||
                        source.domain.includes('.gov.') ||
                        source.domain.endsWith('.nic.in') ||
                        source.domain.includes('.nic.');
          const isReferencedInClaims = extractionData.verified_claims.some((c: any) =>
            c.value.toLowerCase().includes(source.domain.toLowerCase()) ||
            (source.url && c.value.toLowerCase().includes(source.url.toLowerCase()))
          );
          if (isGov || isReferencedInClaims) {
            for (const pAttr of portalAttrs) {
              const hasClaim = extractionData.verified_claims.some((c: any) =>
                c.source_id === source.id && areAttributesMatching(c.attribute, pAttr)
              );
              if (!hasClaim) {
                extractionData.verified_claims.push({
                  id: `claim-portal-${source.id}`,
                  source_id: source.id,
                  source_title: source.title,
                  source_domain: source.domain,
                  attribute: pAttr,
                  original_attribute: pAttr,
                  value: source.url || `https://${source.domain}`,
                  quote: source.cleanedText.slice(0, 100) || source.title,
                  verified: true,
                  charOffset: 0
                });
              }
            }
          }
        }
      }

      // Update source usefulness stats
      for (const source of readySources) {
        const claimsForSrc = (extractionData.verified_claims || []).filter((c: any) => c.source_id === source.id);
        source.claimsExtracted = claimsForSrc.length;
        if (source.claimsExtracted === 0 && source.wordCount > 50) {
          source.usefulnessStatus = 'NEEDS_ATTENTION';
        }
      }

      // STAGE 3: Comparing (Deterministic Gaps & Conflicts)
      this.updateProgress(
        jobId,
        'Comparing',
        3,
        65,
        'Running deterministic gap & cross-source conflict calculations...',
        updatedChips,
        onProgress
      );

      const gaps = detectGaps(
        extractionData.expected_attributes,
        extractionData.verified_claims,
        readySources.length,
        extractionData.question_derived_needs
      );

      const conflicts = detectConflicts(
        extractionData.verified_claims,
        readySources
      );

      // STAGE 4: Checking dates (Temporal & Freshness Audit)
      this.updateProgress(
        jobId,
        'Checking dates',
        4,
        80,
        'Auditing source dates, cycles, and staleness parameters...',
        updatedChips,
        onProgress
      );

      const freshness = auditFreshness(readySources, extractionData.verified_claims);
      const sourceOutdatedCount = readySources.filter(s => s.isStale).length;
      const sourceUndatedCount = readySources.filter(s => s.isUndated).length;
      const deadlinePassedClaims = extractionData.verified_claims.filter(c => c.isDeadlinePassed).length;

      const outdatedCount = sourceOutdatedCount + deadlinePassedClaims;
      const undatedCount = sourceUndatedCount;

      // STAGE 5: Building checklist (Matrix & Prioritized Action Items)
      this.updateProgress(
        jobId,
        'Building checklist',
        5,
        95,
        'Compiling coverage matrix and generating prioritized checklist...',
        updatedChips,
        onProgress
      );

      const matrix = buildCoverageMatrix(
        extractionData.expected_attributes,
        readySources,
        extractionData.verified_claims,
        conflicts
      );

      const checklist = buildPrioritizedChecklist(
        gaps,
        conflicts,
        freshness,
        extractionData.open_questions || []
      );

      // Final report assembly
      const reportId = `rep-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
      let report: FullAnalysisReport = {
        id: reportId,
        question: question.trim(),
        summary: extractionData.summary || 'Summary synthesized from reviewed sources.',
        analyzedWith: {
          provider: usedProvider,
          model: usedModel,
          cached: isCached
        },
        metrics: {
          sourcesCount: readySources.length,
          gapsCount: gaps.length,
          conflictsCount: conflicts.length,
          staleCount: freshness.length,
          outdatedCount,
          undatedCount,
          claimsCount: extractionData.verified_claims.length,
          discardedClaimsCount: extractionData.discarded_claims_count || 0
        },
        expectedAttributes: extractionData.expected_attributes,
        questionDerivedNeeds: extractionData.question_derived_needs,
        extraParameters: extractionData.extra_parameters,
        otherDetailsCount: extractionData.other_details_count,
        cycleNotice: freshness.find(w => w.warningType === 'earlier_cycle')?.detectedCycle
          ? `The reviewed sources refer to the "${freshness.find(w => w.warningType === 'earlier_cycle')!.detectedCycle}" cycle, which precedes the current decision period. Treat dates and values as potentially outdated.`
          : undefined,
        sources: ingestedSources,
        claims: extractionData.verified_claims,
        gaps,
        conflicts,
        freshnessWarnings: freshness,
        coverageMatrix: matrix,
        checklist,
        openQuestions: extractionData.open_questions || [],
        createdAt: new Date().toISOString()
      };

      // STEP 3B: Second Pass Targeted Search on High-Priority Gaps
      try {
        report = await runSecondPassTargetedGapSearch(report);
      } catch (secPassErr) {
        console.warn('[Pipeline] Second pass targeted gap search skipped:', secPassErr);
      }

      this.setReport(report);

      this.updateProgress(
        jobId,
        'Done',
        5,
        100,
        'Analysis complete! Ready to view findings.',
        updatedChips,
        onProgress,
        reportId
      );

      return report;
    } catch (err: any) {
      console.error(`[Pipeline] Analysis Job ${jobId} failed:`, err);
      // Ensure all source chips are updated and never left as "pending" / "Processing"
      const failedChips = currentChips.map(c => ({
        ...c,
        status: (c.status === 'ready' ? 'ready' : 'error') as 'ready' | 'error',
        reason: c.status === 'ready' ? undefined : (c.reason || 'blocked or timed out')
      }));

      const rawMsg = String(err.message || err || '');
      let friendlyError = rawMsg;
      if (
        rawMsg.toLowerCase().includes('all llm providers failed') ||
        rawMsg.includes('503') ||
        rawMsg.includes('429') ||
        rawMsg.includes('413') ||
        rawMsg.toLowerCase().includes('busy') ||
        rawMsg.toLowerCase().includes('overloaded') ||
        rawMsg.toLowerCase().includes('rate limit') ||
        rawMsg.toLowerCase().includes('quota')
      ) {
        friendlyError = 'The AI service is busy. Retry in a minute.';
      } else if (rawMsg.includes('blocked by') || rawMsg.includes('SSRF')) {
        friendlyError = 'This site blocked automated access or took too long. Paste the page text instead.';
      }

      this.updateProgress(
        jobId,
        'Error',
        1,
        0,
        friendlyError,
        failedChips,
        onProgress,
        undefined,
        friendlyError
      );
      throw new Error(friendlyError);
    }
  }

  public async runHonestFallback(
    jobId: string,
    question: string,
    onProgress?: ProgressCallback,
    customExpectedAttributes?: string[]
  ): Promise<FullAnalysisReport> {
    const reportId = `rep-fallback-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;

    this.updateProgress(
      jobId,
      'Fetching',
      1,
      25,
      'No sources available. Initiating AI-suggested verification guidance...',
      [],
      onProgress
    );

    let expectedAttrs = customExpectedAttributes || [];
    if (expectedAttrs.length === 0) {
      expectedAttrs = await deriveExpectedAttributesForQuestion(question);
    }

    this.updateProgress(
      jobId,
      'Reading',
      2,
      50,
      'Formulating unverified potential gaps and decision parameters...',
      [],
      onProgress
    );

    const gaps: PotentialGap[] = expectedAttrs.map(attr => {
      const label = formatAttributeLabel(attr);
      return {
        id: `gap-${attr}`,
        attribute: attr,
        title: `Potential gap: ${label} not found in the sources reviewed`,
        description: `No sources were reviewed for this investigation. "${label}" is an essential decision parameter that must be independently verified with primary documentation.`,
        type: 'total_gap',
        sourceCount: 0,
        supportingSourceIds: [],
        suggestedAction: `Consult authoritative primary source documentation specifically for "${label}".`,
        statusLabel: 'Potential gap',
        signalTag: 'AI-suggested'
      };
    });

    this.updateProgress(
      jobId,
      'Building checklist',
      5,
      80,
      'Compiling prioritized verification checklist...',
      [],
      onProgress
    );

    const checklist: ChecklistItem[] = buildPrioritizedChecklist(
      gaps,
      [],
      [],
      [
        `What primary official documents or specifications govern "${question}"?`,
        `Are there recent policy or version changes in the current year?`,
        `What mandatory technical or qualifying requirements apply to this decision?`
      ]
    );

    const report: FullAnalysisReport = {
      id: reportId,
      question,
      summary: 'No sources reviewed. AI-suggested: no sources could be retrieved for this question. These are verification suggestions, not source-backed findings.',
      analyzedWith: {
        provider: 'Digital Dark Spot Fallback Engine',
        model: 'AI-suggested (unverified)',
        cached: false
      },
      metrics: {
        sourcesCount: 0,
        gapsCount: gaps.length,
        conflictsCount: 0,
        staleCount: 0,
        claimsCount: 0,
        discardedClaimsCount: 0
      },
      expectedAttributes: expectedAttrs,
      sources: [],
      claims: [],
      gaps,
      conflicts: [],
      freshnessWarnings: [],
      coverageMatrix: [],
      checklist,
      openQuestions: [
        `What primary official documents or specifications govern "${question}"?`,
        `Are there recent policy or version changes in the current year?`,
        `What mandatory technical or qualifying requirements apply to this decision?`
      ],
      createdAt: new Date().toISOString()
    };

    this.setReport(report);

    this.updateProgress(
      jobId,
      'Done',
      5,
      100,
      'Analysis complete! Showing AI-suggested verification guidance (no sources reviewed).',
      [],
      onProgress,
      reportId
    );

    return report;
  }
}

export const analysisPipeline = new AnalysisPipeline();

