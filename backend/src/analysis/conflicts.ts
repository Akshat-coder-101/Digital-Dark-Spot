import { ExtractedClaim, PossibleConflict } from './types.js';
import { IngestedSource } from '../ingestion/types.js';
import { formatAttributeLabel } from './gaps.js';

function normalizeValueForComparison(val: string): string {
  return val
    .toLowerCase()
    .replace(/[$,. ]+/g, '')
    .trim();
}

export function detectConflicts(
  claims: ExtractedClaim[],
  sources: IngestedSource[]
): PossibleConflict[] {
  const conflicts: PossibleConflict[] = [];
  const sourceMap = new Map<string, IngestedSource>(sources.map(s => [s.id, s]));

  // Group claims by attribute
  const byAttr = new Map<string, ExtractedClaim[]>();
  for (const c of claims) {
    const list = byAttr.get(c.attribute) || [];
    list.push(c);
    byAttr.set(c.attribute, list);
  }

  for (const [attr, attrClaims] of byAttr.entries()) {
    if (attrClaims.length < 2) continue;

    // Compare pairwise claims from different sources
    for (let i = 0; i < attrClaims.length; i++) {
      for (let j = i + 1; j < attrClaims.length; j++) {
        const c1 = attrClaims[i];
        const c2 = attrClaims[j];

        // Only compare across different sources
        if (c1.source_id === c2.source_id) continue;

        const norm1 = normalizeValueForComparison(c1.value);
        const norm2 = normalizeValueForComparison(c2.value);

        // If normalized values differ meaningfully
        if (norm1 !== norm2) {
          const s1 = sourceMap.get(c1.source_id);
          const s2 = sourceMap.get(c2.source_id);
          const label = formatAttributeLabel(attr);

          const s1Date = s1?.detectedDate || s1?.detectedCycle || (s1?.isUndated ? 'Undated' : undefined);
          const s2Date = s2?.detectedDate || s2?.detectedCycle || (s2?.isUndated ? 'Undated' : undefined);

          conflicts.push({
            id: `conflict-${attr}-${c1.id.slice(0, 5)}-${c2.id.slice(0, 5)}`,
            attribute: attr,
            title: `Possible conflict: two sources list different ${label} details`,
            description: `Source "${c1.source_title}" indicates "${c1.value}", whereas source "${c2.source_title}" reports "${c2.value}". Verify using the latest official authority notice.`,
            sourceA: {
              source_id: c1.source_id,
              source_title: c1.source_title,
              source_domain: c1.source_domain,
              value: c1.value,
              quote: c1.quote,
              dateStatus: s1Date
            },
            sourceB: {
              source_id: c2.source_id,
              source_title: c2.source_title,
              source_domain: c2.source_domain,
              value: c2.value,
              quote: c2.quote,
              dateStatus: s2Date
            },
            statusLabel: 'Possible conflict',
            signalTag: 'Sourced'
          });

          // Break to avoid duplicated pairwise combinations for same attribute
          break;
        }
      }
    }
  }

  return conflicts;
}

