import fs from 'fs';
import path from 'path';
import { IngestedSource } from '../ingestion/types.js';
import { RawLLMExtraction, FullAnalysisReport } from '../analysis/types.js';
import { verifyClaimsVerbatim } from '../analysis/verifier.js';
import { detectGaps } from '../analysis/gaps.js';
import { detectConflicts } from '../analysis/conflicts.js';
import { auditFreshness } from '../analysis/freshness.js';
import { computeParameterStatuses } from '../analysis/parameterStatus.js';
import { buildCoverageMatrix } from '../analysis/matrix.js';
import { buildPrioritizedChecklist } from '../analysis/checklist.js';
import { detectTemporalMetadata } from '../ingestion/metadata.js';

export interface FixtureScenarioData {
  id: string;
  name: string;
  question: string;
  sources: IngestedSource[];
  report: FullAnalysisReport;
}

function getFixturesDir(): string {
  const candidates = [
    path.resolve(process.cwd(), 'fixtures'),
    path.resolve(process.cwd(), '../fixtures'),
    path.resolve(process.cwd(), '../../fixtures')
  ];
  for (const c of candidates) {
    if (fs.existsSync(path.join(c, 'scenario-a-aurora'))) return c;
  }
  return path.resolve(process.cwd(), 'fixtures');
}

const FIXTURES_DIR = getFixturesDir();

export function loadFixtureScenario(scenarioId: string = 'scenario-a-aurora'): FixtureScenarioData {
  let targetDir = path.join(FIXTURES_DIR, scenarioId);

  // Fallback aliases
  if (!fs.existsSync(targetDir)) {
    if (scenarioId.includes('solar') || scenarioId === 'scenario-b') {
      targetDir = path.join(FIXTURES_DIR, 'scenario-b-solarbridge');
    } else if (scenarioId.includes('nimbus') || scenarioId === 'scenario-c') {
      targetDir = path.join(FIXTURES_DIR, 'scenario-c-nimbus-air');
    } else {
      targetDir = path.join(FIXTURES_DIR, 'scenario-a-aurora');
    }
  }

  const scenarioFile = path.join(targetDir, 'scenario.json');
  const expectedFile = path.join(targetDir, 'expected.json');

  if (!fs.existsSync(scenarioFile) || !fs.existsSync(expectedFile)) {
    throw new Error(`Fixture files not found in ${targetDir}`);
  }

  const scenario = JSON.parse(fs.readFileSync(scenarioFile, 'utf8'));
  const expected = JSON.parse(fs.readFileSync(expectedFile, 'utf8'));

  const ingestedSources: IngestedSource[] = scenario.sources.map((s: any) => {
    const temporal = detectTemporalMetadata(s.cleanedText, s.title);
    return {
      id: s.id,
      type: 'text',
      url: s.url,
      domain: s.domain,
      title: s.title,
      rawText: s.rawText || s.cleanedText,
      cleanedText: s.cleanedText,
      wordCount: s.cleanedText.split(/\s+/).filter(Boolean).length,
      textCharacterCount: s.cleanedText.length,
      claimsExtracted: 0,
      claimsDiscarded: 0,
      usefulnessStatus: 'READY',
      credibilityHint: s.domain.includes('.gov') || s.domain.includes('official') ? 'institutional' : 'general',
      detectedDate: temporal.detectedDate,
      detectedCycle: temporal.detectedCycle,
      isStale: temporal.isStale,
      isUndated: temporal.isUndated,
      status: 'ready',
      sourceType: 'sample',
      fetchedAt: new Date().toISOString()
    };
  });

  const verification = verifyClaimsVerbatim(expected.claims, ingestedSources);
  const conflicts = detectConflicts(verification.verifiedClaims, ingestedSources);
  const freshnessWarnings = auditFreshness(ingestedSources, verification.verifiedClaims);
  const parameterStatuses = computeParameterStatuses(
    expected.expectedAttributes,
    verification.verifiedClaims,
    conflicts,
    freshnessWarnings,
    ingestedSources
  );
  const gaps = detectGaps(expected.expectedAttributes, verification.verifiedClaims, ingestedSources.length, undefined, parameterStatuses);
  const coverageMatrix = buildCoverageMatrix(expected.expectedAttributes, ingestedSources, verification.verifiedClaims, conflicts, parameterStatuses);
  const checklist = buildPrioritizedChecklist(gaps, conflicts, freshnessWarnings, expected.openQuestions || [], parameterStatuses);

  const report: FullAnalysisReport = {
    id: `sample-${scenario.id}`,
    question: scenario.question,
    summary: expected.summary || `Synthesized offline review for ${scenario.name}. Identified parameters, cross-source conflicts, and potential gaps across ${ingestedSources.length} sample reference sources.`,
    analyzedWith: {
      provider: 'Deterministic Fixture Engine',
      model: 'fixture-offline-v1',
      cached: true
    },
    metrics: {
      sourcesCount: ingestedSources.length,
      gapsCount: gaps.length,
      conflictsCount: conflicts.length,
      staleCount: freshnessWarnings.length,
      claimsCount: verification.verifiedClaims.length,
      discardedClaimsCount: verification.discardedClaimsCount
    },
    expectedAttributes: expected.expectedAttributes,
    sources: ingestedSources,
    claims: verification.verifiedClaims,
    parameterStatuses,
    gaps,
    conflicts,
    freshnessWarnings,
    coverageMatrix,
    checklist,
    openQuestions: expected.openQuestions || [],
    createdAt: new Date().toISOString()
  };

  return {
    id: scenario.id,
    name: scenario.name,
    question: scenario.question,
    sources: ingestedSources,
    report
  };
}

// Backward-compatible exports
export const SAMPLE_RESEARCH_QUESTION = "What are the eligibility requirements, family income limit, and renewal rules for the Aurora Merit Scholarship?";

export const SAMPLE_DISCOVERY_RESULTS = [
  {
    title: 'Aurora State Higher Education Directorate - 2026 Official Guidelines [SAMPLE DATA]',
    url: 'sample://education.aurora.example/guidelines-2026',
    domain: 'education.aurora.example [SAMPLE]',
    snippet: 'Official Circular: Applications for the Aurora Merit Scholarship for the 2026-27 academic session are now open. Maximum family income limit is established at INR 5,00,000 per annum.',
    date: '15 January 2026',
    isOfficial: true,
    score: 95
  },
  {
    title: 'Student Aid Review: Unofficial Guide to Aurora Scholarships [SAMPLE DATA]',
    url: 'sample://scholarship-advisory.example/aurora-review-2024',
    domain: 'scholarship-advisory.example [SAMPLE]',
    snippet: 'Guidance Note: In the 2024-25 cycle of the Aurora Merit Scholarship, the family income limit was established at INR 3,50,000 per annum.',
    date: '10 August 2024',
    isOfficial: false,
    score: 82
  },
  {
    title: 'Community Discussion Forum Thread #412 [SAMPLE DATA]',
    url: 'sample://studenttalk.example/thread-aurora',
    domain: 'studenttalk.example [SAMPLE]',
    snippet: 'Discussion: Does anyone know if renewal requires maintaining a 3.5 GPA? Nobody has found any published renewal conditions.',
    date: undefined,
    isOfficial: false,
    score: 70
  }
];

export const SAMPLE_SOURCES: IngestedSource[] = loadFixtureScenario('scenario-a-aurora').sources;

export function generateSampleReport(scenarioId?: string): FullAnalysisReport {
  return loadFixtureScenario(scenarioId || 'scenario-a-aurora').report;
}
