import { IngestedSource } from '../ingestion/types.js';
import { ExtractedClaim, FreshnessWarning } from './types.js';
import { normalizeDate } from './normalization.js';

export function auditFreshness(
  sources: IngestedSource[],
  claims: ExtractedClaim[] = []
): FreshnessWarning[] {
  const warnings: FreshnessWarning[] = [];
  const todayIso = new Date().toISOString().slice(0, 10); // Real current date e.g. 2026-10-31

  // 1. Audit individual claims for passed deadlines or outdated dates
  for (const c of claims) {
    const attrLower = (c.attribute || '').toLowerCase();
    const valLower = (c.value || '').toLowerCase();
    const isDeadlineAttr = attrLower.includes('deadline') ||
      attrLower.includes('closing') ||
      attrLower.includes('due') ||
      attrLower.includes('cutoff') ||
      attrLower.includes('last_date') ||
      attrLower.includes('submission') ||
      valLower.includes('deadline') ||
      valLower.includes('due date') ||
      valLower.includes('closing date') ||
      valLower.includes('apply by');

    const normDate = normalizeDate(c.value);
    if (normDate && !normDate.startsWith('XXXX')) {
      if (normDate < todayIso) {
        c.isOutdated = true;
        if (isDeadlineAttr) {
          c.isDeadlinePassed = true;
          warnings.push({
            id: `freshness-deadline-${c.id}`,
            source_id: c.source_id,
            source_title: c.source_title,
            source_domain: c.source_domain,
            warningType: 'deadline_passed',
            reason: `Extracted deadline "${c.value}" has passed (${normDate} < ${todayIso}). This requirement is no longer active.`,
            detectedDate: normDate,
            detectedCycle: null,
            statusLabel: 'Potentially outdated',
            signalTag: 'Sourced'
          });
        }
      }
    }
  }

  // 2. Audit sources for stale dates, earlier cycles, and undated statuses
  for (const s of sources) {
    if (s.status !== 'ready') continue;

    if (s.detectedCycle && s.isStale) {
      warnings.push({
        id: `freshness-cycle-${s.id}`,
        source_id: s.id,
        source_title: s.title,
        source_domain: s.domain,
        warningType: 'earlier_cycle',
        reason: `This document refers to the "${s.detectedCycle}" cycle, which precedes the current decision period. Criteria or deadlines may have changed.`,
        detectedDate: s.detectedDate,
        detectedCycle: s.detectedCycle,
        statusLabel: 'Potentially outdated',
        signalTag: 'Sourced'
      });
    } else if (s.detectedDate && s.isStale) {
      warnings.push({
        id: `freshness-stale-${s.id}`,
        source_id: s.id,
        source_title: s.title,
        source_domain: s.domain,
        warningType: 'stale_date',
        reason: `This notice is dated "${s.detectedDate}", which is older than 18 months. Verify whether newer amendments exist.`,
        detectedDate: s.detectedDate,
        detectedCycle: s.detectedCycle,
        statusLabel: 'Potentially outdated',
        signalTag: 'Sourced'
      });
    } else if (s.isUndated) {
      warnings.push({
        id: `freshness-undated-${s.id}`,
        source_id: s.id,
        source_title: s.title,
        source_domain: s.domain,
        warningType: 'undated',
        reason: `No date found in the source text. Information may be obsolete or unversioned.`,
        detectedDate: null,
        detectedCycle: null,
        statusLabel: 'No date found in the source text',
        signalTag: 'Sourced'
      });
    }
  }

  return warnings;
}
