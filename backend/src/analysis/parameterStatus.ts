import {
  ExtractedClaim,
  PossibleConflict,
  FreshnessWarning,
  ParameterStatus
} from './types.js';
import { IngestedSource } from '../ingestion/types.js';
import {
  areAttributesMatching,
  matchesCanonicalParameter,
  normalizeAttributeName
} from './canonicalization.js';
import { formatAttributeLabel } from './gaps.js';

export function computeParameterStatuses(
  expectedParameters: string[],
  claims: ExtractedClaim[],
  conflicts: PossibleConflict[] = [],
  freshness: FreshnessWarning[] = [],
  sources: IngestedSource[] = []
): ParameterStatus[] {
  const readySources = sources.filter(s => s.status === 'ready');
  const statuses: ParameterStatus[] = [];

  // Track which claims map to which parameter
  const claimAssignedParam = new Map<string, string>();

  // Pass 1: Match claims to expected parameters
  for (const param of expectedParameters) {
    const normP = normalizeAttributeName(param);
    for (const c of claims) {
      if (claimAssignedParam.has(c.id)) continue;
      const normAttr = normalizeAttributeName(c.attribute);
      const origAttr = (c as any).original_attribute ? normalizeAttributeName((c as any).original_attribute) : '';

      const isMatch = normAttr === normP ||
        origAttr === normP ||
        areAttributesMatching(normAttr, normP) ||
        (origAttr && areAttributesMatching(origAttr, normP)) ||
        matchesCanonicalParameter(normAttr, normP) ||
        (origAttr && matchesCanonicalParameter(origAttr, normP));

      if (isMatch) {
        claimAssignedParam.set(c.id, param);
      }
    }
  }

  // Pass 2: Compute status for each parameter
  for (const param of expectedParameters) {
    const normP = normalizeAttributeName(param);
    const label = formatAttributeLabel(param);

    // Filter claims assigned to this parameter
    const paramClaims = claims.filter(c => {
      if (claimAssignedParam.get(c.id) === param) return true;
      const normAttr = normalizeAttributeName(c.attribute);
      const origAttr = (c as any).original_attribute ? normalizeAttributeName((c as any).original_attribute) : '';
      return normAttr === normP || origAttr === normP || areAttributesMatching(normAttr, normP);
    });

    const uniqueSourceIds = Array.from(new Set(paramClaims.map(c => c.source_id)));
    const sourcesCount = uniqueSourceIds.length;

    // Check conflict
    const conflict = conflicts.find(
      cf => normalizeAttributeName(cf.attribute) === normP || areAttributesMatching(cf.attribute, normP)
    );

    // Check freshness / stale / deadline passed
    const hasDeadlinePassed = paramClaims.some(c => c.isDeadlinePassed || c.isOutdated);
    const hasStaleWarning = freshness.some(
      w => paramClaims.some(c => c.source_id === w.source_id) &&
           (w.statusLabel?.toLowerCase().includes('outdated') || w.warningType === 'deadline_passed')
    );
    const allCoveredAreStale = sourcesCount > 0 && uniqueSourceIds.every(sid => {
      const src = readySources.find(s => s.id === sid);
      return src?.isStale;
    });
    const isStale = Boolean(hasDeadlinePassed || hasStaleWarning || allCoveredAreStale);

    // Status Precedence: Conflict > Gap (0 claims) > Stale > Single Source > Found
    let status: 'conflict' | 'gap' | 'stale' | 'single_source' | 'found';
    let statusLabel: string;
    let sortRank: number;

    if (conflict) {
      status = 'conflict';
      statusLabel = 'Conflict';
      sortRank = 1;
    } else if (paramClaims.length === 0) {
      // ABSOLUTE RULE: Only 0 claims can ever be Gap
      status = 'gap';
      statusLabel = 'Gap';
      sortRank = 2;
    } else if (isStale) {
      status = 'stale';
      statusLabel = 'Stale';
      sortRank = 3;
    } else if (sourcesCount === 1) {
      status = 'single_source';
      statusLabel = 'Single source';
      sortRank = 4;
    } else {
      status = 'found';
      statusLabel = 'Found';
      sortRank = 5;
    }

    // Key value derivation
    let keyValue = 'Not found in the sources reviewed';
    if (status === 'conflict' && conflict) {
      const v1 = conflict.sourceA?.value || 'Option A';
      const v2 = conflict.sourceB?.value || 'Option B';
      keyValue = `Sources disagree: ${v1} / ${v2}`;
    } else if (status === 'gap') {
      keyValue = 'Not found in the sources reviewed';
    } else if (paramClaims.length > 0) {
      // Consensus value
      const valCounts: Record<string, number> = {};
      for (const c of paramClaims) {
        const valNorm = (c.value || '').trim();
        if (valNorm) valCounts[valNorm] = (valCounts[valNorm] || 0) + 1;
      }
      const sortedVals = Object.entries(valCounts).sort((a, b) => b[1] - a[1]);
      keyValue = sortedVals[0]?.[0] || paramClaims[0].value;
    }

    const gapSuggestedAction = status === 'gap'
      ? `Verify with primary authoritative documentation specifically for "${label}".`
      : undefined;

    statuses.push({
      parameter: param,
      label,
      status,
      statusLabel,
      claims: paramClaims,
      sourcesCount,
      sourceIds: uniqueSourceIds,
      conflict,
      isStale,
      keyValue,
      gapSuggestedAction,
      sortRank
    });
  }

  return statuses;
}
