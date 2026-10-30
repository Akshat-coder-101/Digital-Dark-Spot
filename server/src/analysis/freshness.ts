import { IngestedSource } from '../ingestion/types.js';
import { FreshnessWarning } from './types.js';

export function auditFreshness(sources: IngestedSource[]): FreshnessWarning[] {
  const warnings: FreshnessWarning[] = [];

  for (const s of sources) {
    if (s.status !== 'ready') continue;

    if (s.isUndated) {
      warnings.push({
        id: `freshness-undated-${s.id}`,
        source_id: s.id,
        source_title: s.title,
        source_domain: s.domain,
        warningType: 'undated',
        reason: `This source provides no identifiable publication date or cycle year. Information may be obsolete or unversioned.`,
        detectedDate: null,
        detectedCycle: null,
        statusLabel: 'Potentially stale',
        signalTag: 'Sourced'
      });
    } else if (s.detectedCycle && s.isStale) {
      warnings.push({
        id: `freshness-cycle-${s.id}`,
        source_id: s.id,
        source_title: s.title,
        source_domain: s.domain,
        warningType: 'earlier_cycle',
        reason: `This document refers to the "${s.detectedCycle}" application cycle, which precedes the current decision period. Criteria or deadlines may have changed.`,
        detectedDate: s.detectedDate,
        detectedCycle: s.detectedCycle,
        statusLabel: 'Potentially stale',
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
        statusLabel: 'Potentially stale',
        signalTag: 'Sourced'
      });
    }
  }

  return warnings;
}

