import { ExtractedClaim, PossibleConflict } from './types.js';
import { IngestedSource } from '../ingestion/types.js';
import { formatAttributeLabel } from './gaps.js';

export function normalizeValueForComparison(val: string): string {
  return val
    .toLowerCase()
    .replace(/[$,. ]+/g, '')
    .trim();
}

const MONTH_MAP: Record<string, string> = {
  january: '01', jan: '01',
  february: '02', feb: '02',
  march: '03', mar: '03',
  april: '04', apr: '04',
  may: '05',
  june: '06', jun: '06',
  july: '07', jul: '07',
  august: '08', aug: '08',
  september: '09', sep: '09', sept: '09',
  october: '10', oct: '10',
  november: '11', nov: '11',
  december: '12', dec: '12'
};

function parsePercentage(val: string): number | null {
  const m = val.trim().toLowerCase().match(/^(\d+(?:\.\d+)?)\s*(?:%|percent)$/i);
  if (m) {
    return parseFloat(m[1]);
  }
  return null;
}

function parseCurrencyOrNumber(val: string): number | null {
  const clean = val
    .trim()
    .toLowerCase()
    .replace(/^(rs\.?|inr|₹|\$|€|£)\s*/i, '')
    .replace(/\s*(rs\.?|inr|₹|\$|€|£)$/i, '')
    .trim();

  // Check for lakh / crore expressions
  const lakhMatch = clean.match(/^(\d+(?:\.\d+)?)\s*(?:lakh|lakhs|lac|lacs)$/i);
  if (lakhMatch) {
    return Math.round(parseFloat(lakhMatch[1]) * 100000);
  }
  const croreMatch = clean.match(/^(\d+(?:\.\d+)?)\s*(?:crore|crores|cr)$/i);
  if (croreMatch) {
    return Math.round(parseFloat(croreMatch[1]) * 10000000);
  }

  // Pure digits with optional commas and decimal
  const numClean = clean.replace(/[,\s]/g, '');
  if (/^\d+(\.\d+)?$/.test(numClean)) {
    return parseFloat(numClean);
  }
  return null;
}

function parseDateKey(val: string): string | null {
  const s = val.trim().toLowerCase();

  // DD/MM/YYYY or DD-MM-YYYY or YYYY-MM-DD
  const isoMatch = s.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if (isoMatch) {
    const y = isoMatch[1];
    const m = isoMatch[2].padStart(2, '0');
    const d = isoMatch[3].padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  const slashMatch = s.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
  if (slashMatch) {
    const d = slashMatch[1].padStart(2, '0');
    const m = slashMatch[2].padStart(2, '0');
    const y = slashMatch[3];
    return `${y}-${m}-${d}`;
  }

  // Natural dates like "15 March 2026" or "March 15, 2026"
  const monthNames = Object.keys(MONTH_MAP).join('|');
  const dmyMatch = s.match(new RegExp(`^(\\d{1,2})(?:st|nd|rd|th)?\\s+(${monthNames})\\s*(\\d{4})?$`, 'i'));
  if (dmyMatch) {
    const d = dmyMatch[1].padStart(2, '0');
    const m = MONTH_MAP[dmyMatch[2].toLowerCase()];
    const y = dmyMatch[3] || 'XXXX';
    return `${y}-${m}-${d}`;
  }

  const mdyMatch = s.match(new RegExp(`^(${monthNames})\\s+(\\d{1,2})(?:st|nd|rd|th)?(?:,?\\s*(\\d{4}))?$`, 'i'));
  if (mdyMatch) {
    const m = MONTH_MAP[mdyMatch[1].toLowerCase()];
    const d = mdyMatch[2].padStart(2, '0');
    const y = mdyMatch[3] || 'XXXX';
    return `${y}-${m}-${d}`;
  }

  return null;
}

function parseListItems(val: string): string[] | null {
  if (!val.includes(',') && !val.includes(';')) return null;
  const items = val
    .split(/[,;]/)
    .map(i => i.trim().toLowerCase().replace(/^[•\-\*]\s*/, '').replace(/^(?:and|or)\s+/i, '').trim())
    .filter(i => i.length > 0);
  if (items.length <= 1) return null;
  return items.sort();
}

export function areValuesEquivalent(val1: string, val2: string): boolean {
  if (val1 === val2) return true;
  if (!val1 || !val2) return false;

  const t1 = val1.trim().toLowerCase().replace(/\s+/g, ' ');
  const t2 = val2.trim().toLowerCase().replace(/\s+/g, ' ');
  if (t1 === t2) return true;

  // 1. Percentage check
  const p1 = parsePercentage(t1);
  const p2 = parsePercentage(t2);
  if (p1 !== null || p2 !== null) {
    return p1 !== null && p2 !== null && p1 === p2;
  }

  // 2. Currency & Number check
  const n1 = parseCurrencyOrNumber(t1);
  const n2 = parseCurrencyOrNumber(t2);
  if (n1 !== null || n2 !== null) {
    return n1 !== null && n2 !== null && n1 === n2;
  }

  // 3. Date check
  const d1 = parseDateKey(t1);
  const d2 = parseDateKey(t2);
  if (d1 !== null || d2 !== null) {
    return d1 !== null && d2 !== null && d1 === d2;
  }

  // 4. List check (unordered comparison)
  const l1 = parseListItems(t1);
  const l2 = parseListItems(t2);
  if (l1 && l2 && l1.length === l2.length) {
    const allMatch = l1.every((item, idx) => item === l2[idx]);
    if (allMatch) return true;
  }

  // 5. Basic punctuation-stripped fallback
  const s1 = t1.replace(/[^a-z0-9]/g, '');
  const s2 = t2.replace(/[^a-z0-9]/g, '');
  return s1.length > 0 && s1 === s2;
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

        // If values differ meaningfully
        if (!areValuesEquivalent(c1.value, c2.value)) {
          const s1 = sourceMap.get(c1.source_id);
          const s2 = sourceMap.get(c2.source_id);
          const label = formatAttributeLabel(attr);

          const s1Date = s1?.detectedDate || s1?.detectedCycle || (s1?.isUndated ? 'Undated' : undefined);
          const s2Date = s2?.detectedDate || s2?.detectedCycle || (s2?.isUndated ? 'Undated' : undefined);

          const s1Term = c1.original_attribute && c1.original_attribute !== attr ? ` (termed "${c1.original_attribute}")` : '';
          const s2Term = c2.original_attribute && c2.original_attribute !== attr ? ` (termed "${c2.original_attribute}")` : '';

          conflicts.push({
            id: `conflict-${attr}-${c1.id.slice(0, 5)}-${c2.id.slice(0, 5)}`,
            attribute: attr,
            title: `Possible conflict: two sources list different ${label} details`,
            description: `Source "${c1.source_title}"${s1Term} indicates "${c1.value}", whereas source "${c2.source_title}"${s2Term} reports "${c2.value}". Verify using the latest official authority notice.`,
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

