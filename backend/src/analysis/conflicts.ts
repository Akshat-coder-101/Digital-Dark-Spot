import { ExtractedClaim, PossibleConflict } from './types.js';
import { IngestedSource } from '../ingestion/types.js';
import { formatAttributeLabel } from './gaps.js';
import { extractQualifier } from './canonicalization.js';
import { compareTypedValues } from './normalization.js';

export function normalizeValueForComparison(val: string): string {
  return (val || '')
    .toLowerCase()
    .replace(/[$,. ]+/g, '')
    .trim();
}

export function areValuesEquivalent(val1: string, val2: string): boolean {
  if (val1 === val2) return true;
  if (!val1 || !val2) return false;
  const comp = compareTypedValues(val1, val2);
  return comp.equivalent;
}

export function detectConflicts(
  claims: ExtractedClaim[],
  sources: IngestedSource[]
): PossibleConflict[] {
  const conflicts: PossibleConflict[] = [];
  const sourceMap = new Map<string, IngestedSource>(sources.map(s => [s.id, s]));

  // Group claims by canonical attribute
  const byAttr = new Map<string, ExtractedClaim[]>();
  for (const c of claims) {
    const list = byAttr.get(c.attribute) || [];
    list.push(c);
    byAttr.set(c.attribute, list);
  }

  for (const [attr, attrClaims] of byAttr.entries()) {
    if (attrClaims.length < 2) continue;

    // Pairwise comparison
    for (let i = 0; i < attrClaims.length; i++) {
      for (let j = i + 1; j < attrClaims.length; j++) {
        const c1 = attrClaims[i];
        const c2 = attrClaims[j];

        // Only compare across different sources
        if (c1.source_id === c2.source_id) continue;

        // Compare ONLY when qualifiers match or are compatible
        const q1 = c1.qualifier || extractQualifier(c1.original_attribute || c1.attribute).qualifier;
        const q2 = c2.qualifier || extractQualifier(c2.original_attribute || c2.attribute).qualifier;
        if (q1 && q2 && q1 !== q2) {
          // Distinct qualifiers (e.g. primary vs secondary, student vs institution), do not treat as conflict
          continue;
        }

        const comp = compareTypedValues(c1.value, c2.value, c1.valueType || c2.valueType);
        if (comp.isConflict || comp.isWordingDifference) {
          const s1 = sourceMap.get(c1.source_id);
          const s2 = sourceMap.get(c2.source_id);
          const label = formatAttributeLabel(attr);

          const s1Date = s1?.detectedDate || s1?.detectedCycle || (s1?.isUndated ? 'Undated' : undefined);
          const s2Date = s2?.detectedDate || s2?.detectedCycle || (s2?.isUndated ? 'Undated' : undefined);

          const s1Term = c1.original_attribute && c1.original_attribute !== attr ? ` (termed "${c1.original_attribute}")` : '';
          const s2Term = c2.original_attribute && c2.original_attribute !== attr ? ` (termed "${c2.original_attribute}")` : '';

          // Earlier cycle explanation
          let cycleExplanation: string | undefined = undefined;
          if (s1?.detectedCycle && s1?.isStale) {
            cycleExplanation = s1.detectedCycle;
          } else if (s2?.detectedCycle && s2?.isStale) {
            cycleExplanation = s2.detectedCycle;
          }

          const isTextWording = comp.isWordingDifference;
          const signalTag = isTextWording ? 'Uncertain' : 'Sourced';
          const title = isTextWording
            ? `Possible conflict: differing wording for ${label}`
            : `Possible conflict: two sources list different ${label} specifications`;

          const explanationSuffix = cycleExplanation
            ? ` Discrepancy may be explained by reference to an earlier cycle (${cycleExplanation}).`
            : '';

          conflicts.push({
            id: `conflict-${attr}-${c1.id.slice(0, 5)}-${c2.id.slice(0, 5)}`,
            attribute: attr,
            qualifier: q1 || q2,
            title,
            description: `Source "${c1.source_title}"${s1Term} states "${c1.value}", while source "${c2.source_title}"${s2Term} reports "${c2.value}".${explanationSuffix} Review with primary authority documentation.`,
            mayBeExplainedByEarlierCycle: cycleExplanation,
            sourceA: {
              source_id: c1.source_id,
              source_title: c1.source_title,
              source_domain: c1.source_domain,
              original_attribute: c1.original_attribute || c1.attribute,
              value: c1.value,
              quote: c1.quote,
              dateStatus: s1Date
            },
            sourceB: {
              source_id: c2.source_id,
              source_title: c2.source_title,
              source_domain: c2.source_domain,
              original_attribute: c2.original_attribute || c2.attribute,
              value: c2.value,
              quote: c2.quote,
              dateStatus: s2Date
            },
            statusLabel: 'Possible conflict',
            signalTag
          });

          // Break inner loop to avoid duplication for the same attribute pair
          break;
        }
      }
    }
  }

  return conflicts;
}
