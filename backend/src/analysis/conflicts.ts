import { ExtractedClaim, PossibleConflict } from './types.js';
import { IngestedSource } from '../ingestion/types.js';
import { formatAttributeLabel } from './gaps.js';
import { extractQualifier } from './canonicalization.js';
import { compareTypedValues, extractNumericRange, doRangesOverlap } from './normalization.js';
import { isOfficialDomain } from '../search/adapters/tavily.js';

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

export function extractSubject(claim: ExtractedClaim): string {
  if (claim.subject && claim.subject.trim().length > 0 && claim.subject.toLowerCase() !== 'general') {
    return claim.subject.trim().toLowerCase();
  }

  const text = `${claim.value} ${claim.quote} ${claim.source_title}`.toLowerCase();

  // Distinct model/lineup signatures
  const models = [
    'legion 5i', 'legion 7', 'legion pro', 'loq', 'ideapad gaming',
    'nitro 16', 'nitro 5', 'nitro v', 'predator helios',
    'tuf gaming', 'rog zephyrus', 'rog strix',
    'dell g15', 'dell g16', 'alienware m16',
    'victus 16', 'victus 15', 'omen 16', 'omen 17',
    'katana 15', 'cyborg 15', 'stealth 16', 'raider ge',
    'blade 16', 'blade 14'
  ];
  for (const m of models) {
    if (text.includes(m)) return m;
  }

  const brands = ['lenovo', 'acer', 'asus', 'dell', 'hp', 'msi', 'razer', 'gigabyte', 'apple', 'samsung'];
  for (const b of brands) {
    if (new RegExp(`\\b${b}\\b`, 'i').test(text)) return b;
  }

  return 'general';
}

export function areSubjectsMatching(c1: ExtractedClaim, c2: ExtractedClaim): boolean {
  const s1 = extractSubject(c1);
  const s2 = extractSubject(c2);
  if (s1 === 'general' || s2 === 'general') return true;
  return s1 === s2 || s1.includes(s2) || s2.includes(s1);
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
    // Rule: Never compare claims from "other_details"
    if (attr === 'other_details') continue;

    // Pairwise comparison
    for (let i = 0; i < attrClaims.length; i++) {
      for (let j = i + 1; j < attrClaims.length; j++) {
        const c1 = attrClaims[i];
        const c2 = attrClaims[j];

        // Only compare across different sources
        if (c1.source_id === c2.source_id) continue;

        // Rule: Only compare claims with the SAME subject (same product/entity). Different products are not conflicts.
        if (!areSubjectsMatching(c1, c2)) {
          continue;
        }

        // Rule: Different facts or sub-specifications are not conflicts (e.g. Dynamic Boost wattage vs base TGP)
        const isDynamicBoost1 = c1.value.toLowerCase().includes('dynamic boost') || c1.quote.toLowerCase().includes('dynamic boost');
        const isDynamicBoost2 = c2.value.toLowerCase().includes('dynamic boost') || c2.quote.toLowerCase().includes('dynamic boost');
        if (isDynamicBoost1 !== isDynamicBoost2) {
          continue;
        }

        // If exact quotes are identical or values are equivalent under normalization, never flag as conflict
        if (!c1.quote || !c2.quote || c1.quote.trim().toLowerCase() === c2.quote.trim().toLowerCase() || areValuesEquivalent(c1.value, c2.value)) {
          continue;
        }

        // Link, portal and URL attributes are NOT conflicts unless both values contain distinct URL targets
        const isLinkOrPortal = attr.includes('portal') ||
          attr.includes('link') ||
          attr.includes('url') ||
          attr.includes('website') ||
          c1.valueType === 'url' ||
          c2.valueType === 'url';

        if (isLinkOrPortal) {
          const url1 = c1.value.match(/https?:\/\/[^\s"'<>]+/i)?.[0];
          const url2 = c2.value.match(/https?:\/\/[^\s"'<>]+/i)?.[0];
          // If neither or only one is an explicit URL, or both point to same target, do not flag as conflict
          if (!url1 || !url2 || url1.toLowerCase() === url2.toLowerCase()) {
            continue;
          }
        }

        // Compare ONLY when qualifiers match or are compatible
        const q1 = c1.qualifier || extractQualifier(c1.original_attribute || c1.attribute).qualifier;
        const q2 = c2.qualifier || extractQualifier(c2.original_attribute || c2.attribute).qualifier;
        if (q1 && q2 && q1 !== q2) {
          // Distinct qualifiers (e.g. primary vs secondary, student vs institution), do not treat as conflict
          continue;
        }

        // Numeric ranges that overlap are NOT conflicts (e.g. "$1,000 - $1,500" vs "$1,200", "80W - 140W" vs "115W")
        const r1 = extractNumericRange(c1.value);
        const r2 = extractNumericRange(c2.value);
        if (r1 && r2 && doRangesOverlap(r1, r2)) {
          continue;
        }

        const comp = compareTypedValues(c1.value, c2.value, c1.valueType || c2.valueType);
        if (comp.equivalent) {
          continue;
        }

        // Values of completely different types (e.g. money vs wattage vs date) are not conflicts
        if (comp.inferredType !== 'text' && c2.valueType && comp.inferredType !== c2.valueType) {
          continue;
        }

        const isNumericConflict = Boolean(r1 && r2 && !doRangesOverlap(r1, r2));

        // Suppress generic wording differences unless an explicit factual contradiction exists
        if (!comp.isConflict && !isNumericConflict) {
          continue;
        }
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

          const isTextWording = comp.isWordingDifference && !isNumericConflict;
          const signalTag = isTextWording ? 'Uncertain' : 'Sourced';
          const title = isTextWording
            ? `Possible conflict: differing wording for ${label}`
            : `Possible conflict: two sources list different ${label} specifications`;

          const explanationSuffix = cycleExplanation
            ? ` Discrepancy may be explained by reference to an earlier cycle (${cycleExplanation}).`
            : '';

          // Why flagged explanation
          let whyFlagged = `Discrepancy in reported values for ${label} ("${c1.value}" vs "${c2.value}").`;
          if (comp.inferredType === 'money') {
            whyFlagged = `Monetary specification differs across sources: "${c1.value}" vs "${c2.value}".`;
          } else if (comp.inferredType === 'date') {
            whyFlagged = `Conflicting calendar dates or deadlines reported: "${c1.value}" vs "${c2.value}".`;
          } else if (comp.inferredType === 'number' || comp.inferredType === 'percent') {
            whyFlagged = `Numerical specification or percentage differs: "${c1.value}" vs "${c2.value}".`;
          } else if (isTextWording) {
            whyFlagged = `Differing wording or descriptive terminology across sources: "${c1.value}" vs "${c2.value}".`;
          }

          // Authority discrepancy between official source and secondary/blog source
          const isAOfficial = isOfficialDomain(c1.source_domain);
          const isBOfficial = isOfficialDomain(c2.source_domain);
          let authorityDiscrepancy: string | undefined = undefined;
          if (isAOfficial && !isBOfficial) {
            authorityDiscrepancy = `Official source (${c1.source_domain}) takes precedence; secondary guide (${c2.source_domain}) may be inaccurate, speculative, or outdated.`;
          } else if (!isAOfficial && isBOfficial) {
            authorityDiscrepancy = `Official source (${c2.source_domain}) takes precedence; secondary guide (${c1.source_domain}) may be inaccurate, speculative, or outdated.`;
          }

          conflicts.push({
            id: `conflict-${attr}-${c1.id.slice(0, 5)}-${c2.id.slice(0, 5)}`,
            attribute: attr,
            qualifier: q1 || q2,
            title,
            description: `Source "${c1.source_title}"${s1Term} states "${c1.value}", while source "${c2.source_title}"${s2Term} reports "${c2.value}".${explanationSuffix} Review with primary authority documentation.`,
            whyFlagged,
            isWeak: isTextWording,
            authorityDiscrepancy,
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

  return conflicts;
}
