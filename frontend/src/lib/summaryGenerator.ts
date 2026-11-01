import {
  ParameterStatus,
  ExtractedClaim,
  PossibleConflict,
  FreshnessWarning,
  ChecklistItem,
  IngestedSource
} from './types';

export function formatSentenceCase(str: string): string {
  if (!str) return '';
  const clean = str.replace(/_/g, ' ').trim();
  return clean.charAt(0).toUpperCase() + clean.slice(1).toLowerCase();
}

export interface StructuredSummaryParameterSection {
  parameter: string;
  heading: string;
  status: 'found' | 'single_source' | 'conflict' | 'gap' | 'stale';
  statusLabel: string;
  text: string;
  marker: number;
  sourcesCount: number;
  inspectClaimId?: string;
  claims: Array<{
    id: string;
    value: string;
    quote: string;
    sourceTitle: string;
    sourceDomain: string;
  }>;
}

export interface StructuredSummary {
  badge: 'Written from verified findings';
  overview: string[];
  parameterSections: StructuredSummaryParameterSection[];
  otherDetails: Array<{
    theme: string;
    claims: Array<{
      id: string;
      value: string;
      quote: string;
      sourceTitle: string;
      sourceDomain: string;
    }>;
  }>;
  datesAndFreshness: {
    upcomingDates: Array<{ date: string; label: string; sourceDomain: string; claimId: string }>;
    passedDeadlines: Array<{ date: string; label: string; sourceDomain: string; claimId: string }>;
    cycleWarnings: Array<{ cycle: string; text: string }>;
    undatedWarnings: Array<{ sourceTitle: string; sourceDomain: string }>;
  };
  verifyNext: Array<{
    id: string;
    priority: string;
    title: string;
    description: string;
  }>;
  copyableMarkdown: string;
}

export function generateStructuredSummary(input: {
  question: string;
  sources: IngestedSource[];
  parameterStatuses: ParameterStatus[];
  claims: ExtractedClaim[];
  conflicts: PossibleConflict[];
  freshness: FreshnessWarning[];
  checklist: ChecklistItem[];
}): StructuredSummary {
  const {
    question,
    sources,
    parameterStatuses,
    claims,
    conflicts: _conflicts,
    freshness,
    checklist
  } = input;

  const readySources = sources.filter(s => s.status === 'ready');
  const lowTextSources = readySources.filter(s => s.sourceType === 'low_text' || s.isLowText);
  const reviewedSources = readySources.filter(s => s.sourceType !== 'low_text' && !s.isLowText);
  const fullSources = reviewedSources.filter(s => !s.isLimited && s.sourceType !== 'limited');
  const limitedSources = reviewedSources.filter(s => s.isLimited || s.sourceType === 'limited');

  const coveredParams = parameterStatuses.filter(p => p.status !== 'gap');
  const gapParams = parameterStatuses.filter(p => p.status === 'gap');
  const conflictParams = parameterStatuses.filter(p => p.status === 'conflict');
  const staleSourcesCount = reviewedSources.filter(s => s.isStale).length;

  // 1. Overview: 4 to 6 plain sentences
  const overview: string[] = [];

  const lowTextText = lowTextSources.length > 0 ? `, and ${lowTextSources.length} low-text source${lowTextSources.length === 1 ? '' : 's'}` : '';
  overview.push(
    `This investigation analyzed evidence addressing the question "${question}" across ${reviewedSources.length} reviewed sources (${fullSources.length} full document${fullSources.length === 1 ? '' : 's'}, ${limitedSources.length} limited supporting text${limitedSources.length === 1 ? '' : 's'}${lowTextText}).`
  );

  overview.push(
    `Verified source evidence was identified for ${coveredParams.length} of the ${parameterStatuses.length} expected decision parameters, establishing ${claims.length} total verbatim claims.`
  );

  if (conflictParams.length > 0) {
    overview.push(
      `Possible contradictions were identified across ${conflictParams.length} parameter${conflictParams.length === 1 ? '' : 's'} (${conflictParams.map(c => c.label).join(', ')}), where reviewed sources present differing values or specifications.`
    );
  } else {
    overview.push(
      `No conflicting statements or contradicting values were identified across the reviewed sources.`
    );
  }

  if (gapParams.length > 0) {
    overview.push(
      `Potential information gaps remain for ${gapParams.length} parameter${gapParams.length === 1 ? '' : 's'} (${gapParams.map(g => g.label).join(', ')}), which are not documented in any of the ${readySources.length} reviewed sources.`
    );
  } else {
    overview.push(
      `All ${parameterStatuses.length} expected decision parameters were corroborated by at least one reviewed source.`
    );
  }

  if (staleSourcesCount > 0 || freshness.some(w => w.warningType === 'deadline_passed')) {
    overview.push(
      `Temporal warnings were flagged for ${staleSourcesCount} source${staleSourcesCount === 1 ? '' : 's'} citing superseded cycles or passed deadlines.`
    );
  } else {
    overview.push(
      `All reviewed sources contain active, unexpired information for the current decision period.`
    );
  }

  // 2. One section per expected parameter (ALL of them, none omitted)
  const parameterSections: StructuredSummaryParameterSection[] = [];
  let markerCounter = 1;
  const mappedClaimIds = new Set<string>();

  for (const p of parameterStatuses) {
    const marker = markerCounter++;
    p.claims.forEach(c => mappedClaimIds.add(c.id));

    let text = '';
    if (p.status === 'conflict' && p.conflict) {
      const v1 = p.conflict.sourceA?.value || 'Option A';
      const v2 = p.conflict.sourceB?.value || 'Option B';
      const s1 = p.conflict.sourceA?.source_domain || 'Source A';
      const s2 = p.conflict.sourceB?.source_domain || 'Source B';
      text = `Reviewed sources disagree on ${p.label}: ${s1} states "${v1}", while ${s2} states "${v2}" (${p.sourcesCount} sources reviewed).`;
    } else if (p.status === 'gap') {
      text = `Not found in the sources reviewed: no verified details or evidence for ${p.label} were documented across any of the ${readySources.length} reviewed sources. Check primary authoritative documentation specifically for this parameter.`;
    } else if (p.status === 'single_source') {
      const domain = p.claims[0]?.source_domain || 'single source';
      text = `Stated as "${p.keyValue}" by 1 source (${domain}) and uncorroborated by other sources reviewed.`;
    } else if (p.status === 'stale') {
      text = `Documented as "${p.keyValue}" (${p.sourcesCount} sources reviewed), but carries temporal staleness warnings or passed deadlines that require re-verification.`;
    } else {
      text = `Documented as "${p.keyValue}" across ${p.sourcesCount} agreeing sources reviewed.`;
    }

    parameterSections.push({
      parameter: p.parameter,
      heading: p.label,
      status: p.status,
      statusLabel: p.statusLabel,
      text,
      marker,
      sourcesCount: p.sourcesCount,
      inspectClaimId: p.claims[0]?.id,
      claims: p.claims.map(c => ({
        id: c.id,
        value: c.value,
        quote: c.quote,
        sourceTitle: c.source_title,
        sourceDomain: c.source_domain
      }))
    });
  }

  // 3. Other details: every verified claim that did not map to a parameter, grouped by theme
  const unmappedClaims = claims.filter(c => !mappedClaimIds.has(c.id));
  const otherDetailsGroups: Record<string, ExtractedClaim[]> = {};

  for (const c of unmappedClaims) {
    const theme = (c as any).subject && (c as any).subject !== 'general'
      ? (c as any).subject
      : formatSentenceCase(c.attribute || 'Additional Detail');
    if (!otherDetailsGroups[theme]) otherDetailsGroups[theme] = [];
    otherDetailsGroups[theme].push(c);
  }

  const otherDetails = Object.entries(otherDetailsGroups).map(([theme, groupClaims]) => ({
    theme,
    claims: groupClaims.map(c => ({
      id: c.id,
      value: c.value,
      quote: c.quote,
      sourceTitle: c.source_title,
      sourceDomain: c.source_domain
    }))
  }));

  // 4. Dates and freshness
  const todayIso = new Date().toISOString().split('T')[0];
  const upcomingDates: Array<{ date: string; label: string; sourceDomain: string; claimId: string }> = [];
  const passedDeadlines: Array<{ date: string; label: string; sourceDomain: string; claimId: string }> = [];

  for (const c of claims) {
    if (c.isDeadlinePassed) {
      passedDeadlines.push({
        date: c.value,
        label: formatSentenceCase(c.attribute),
        sourceDomain: c.source_domain,
        claimId: c.id
      });
    } else if (c.value && /\b\d{4}-\d{2}-\d{2}\b/.test(c.value)) {
      const match = c.value.match(/\b\d{4}-\d{2}-\d{2}\b/);
      if (match && match[0] >= todayIso) {
        upcomingDates.push({
          date: match[0],
          label: formatSentenceCase(c.attribute),
          sourceDomain: c.source_domain,
          claimId: c.id
        });
      }
    }
  }

  const cycleWarnings: Array<{ cycle: string; text: string }> = [];
  const undatedWarnings: Array<{ sourceTitle: string; sourceDomain: string }> = [];

  for (const f of freshness) {
    if (f.warningType === 'earlier_cycle' && f.detectedCycle) {
      cycleWarnings.push({
        cycle: f.detectedCycle,
        text: `Sources reference the ${f.detectedCycle} cycle, which precedes the current decision period.`
      });
    } else if (f.warningType === 'undated') {
      undatedWarnings.push({
        sourceTitle: f.source_title,
        sourceDomain: f.source_domain
      });
    }
  }

  // 5. What to verify next: top 3 or 4 checklist items
  const verifyNext = checklist.slice(0, 4).map(item => ({
    id: item.id,
    priority: item.priority,
    title: item.title,
    description: item.description
  }));

  // 6. Generate Copyable Markdown
  let md = `# Research Summary: ${question}\n\n`;
  md += `*Written from verified findings across ${readySources.length} reviewed sources*\n\n`;
  md += `## Overview\n`;
  for (const p of overview) {
    md += `${p}\n\n`;
  }

  md += `## Decision Parameters\n`;
  for (const sec of parameterSections) {
    md += `### ${sec.heading} [${sec.marker}]\n`;
    md += `- **Status**: ${sec.statusLabel} (${sec.sourcesCount} sources)\n`;
    md += `- **Finding**: ${sec.text}\n\n`;
  }

  if (otherDetails.length > 0) {
    md += `## Other Verified Details\n`;
    for (const grp of otherDetails) {
      md += `### ${grp.theme}\n`;
      for (const c of grp.claims) {
        md += `- ${c.value} *(Source: ${c.sourceDomain})*\n`;
      }
      md += `\n`;
    }
  }

  if (passedDeadlines.length > 0 || upcomingDates.length > 0 || cycleWarnings.length > 0) {
    md += `## Dates and Freshness\n`;
    for (const d of passedDeadlines) {
      md += `- ⚠️ Passed Deadline: ${d.label} was "${d.date}" (Source: ${d.sourceDomain})\n`;
    }
    for (const d of upcomingDates) {
      md += `- 📅 Upcoming: ${d.label} is "${d.date}" (Source: ${d.sourceDomain})\n`;
    }
    for (const cw of cycleWarnings) {
      md += `- ⏳ Cycle Notice: ${cw.text}\n`;
    }
    md += `\n`;
  }

  md += `## What to Verify Next\n`;
  for (const v of verifyNext) {
    md += `- [ ] **[${v.priority}] ${v.title}**: ${v.description}\n`;
  }

  return {
    badge: 'Written from verified findings',
    overview,
    parameterSections,
    otherDetails,
    datesAndFreshness: {
      upcomingDates,
      passedDeadlines,
      cycleWarnings,
      undatedWarnings
    },
    verifyNext,
    copyableMarkdown: md.trim()
  };
}

