/**
 * Deterministic Typed Normalization & Comparison Module
 * 
 * Supports:
 * - Number: standard integers, floats
 * - Percent: "75%", "75 percent", "75 %"
 * - Money: "Rs 6 lakh", "6,00,000 INR", "₹600000", "$50,000", "€10k", "50000"
 * - Date: ISO "YYYY-MM-DD", "15 March 2026", "15/03/2026", "March 15, 2026"
 * - List: token-fuzzy set comparison (unordered, comma/semicolon delimited)
 * - Boolean: "yes/no", "true/false", "required/optional"
 * - Url: normalized domain and path
 */

export type ValueType = 'number' | 'money' | 'percent' | 'date' | 'list' | 'boolean' | 'url' | 'text';

export interface MoneyValue {
  amount: number;
  currency: string;
}

const MONTH_NAMES: Record<string, string> = {
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

export interface NumericRange {
  min: number;
  max: number;
}

export function extractNumericRange(val: string): NumericRange | null {
  if (!val) return null;
  const s = val.replace(/,/g, '').toLowerCase();

  // Range pattern with optional unit symbols (e.g. "80W - 115W", "$1,000 - $1,500", "10-15%")
  const rangeMatch = s.match(/(\d+(?:\.\d+)?)\s*(?:[a-z%$₹€£]+)?\s*(?:-|–|—|to)\s*(?:[a-z%$₹€£]+)?\s*(\d+(?:\.\d+)?)/i);
  if (rangeMatch) {
    const n1 = parseFloat(rangeMatch[1]);
    const n2 = parseFloat(rangeMatch[2]);
    return {
      min: Math.min(n1, n2),
      max: Math.max(n1, n2)
    };
  }

  // Single number
  const singleMatch = s.match(/(\d+(?:\.\d+)?)/);
  if (singleMatch) {
    const n = parseFloat(singleMatch[1]);
    return { min: n, max: n };
  }

  return null;
}

export function doRangesOverlap(r1: NumericRange, r2: NumericRange): boolean {
  return r1.min <= r2.max && r2.min <= r1.max;
}

export function normalizeNumber(val: string): number | null {
  if (!val) return null;
  const s = val.trim().replace(/,/g, '');
  if (/^[-+]?\d+(\.\d+)?$/.test(s)) {
    return parseFloat(s);
  }
  return null;
}

export function normalizePercent(val: string): number | null {
  if (!val) return null;
  const m = val.trim().toLowerCase().match(/^([-+]?\d+(?:\.\d+)?)\s*(?:%|percent)$/i);
  if (m) {
    return parseFloat(m[1]);
  }
  return null;
}

export function normalizeMoney(val: string): MoneyValue | null {
  if (!val) return null;
  const s = val.trim().toLowerCase();

  // Detect currency prefix/suffix
  let currency = 'INR'; // default assumption in localized context unless specified
  if (s.includes('$') || s.includes('usd')) {
    currency = 'USD';
  } else if (s.includes('€') || s.includes('eur')) {
    currency = 'EUR';
  } else if (s.includes('£') || s.includes('gbp')) {
    currency = 'GBP';
  } else if (s.includes('rs') || s.includes('inr') || s.includes('₹')) {
    currency = 'INR';
  }

  // Remove currency signs and text
  const clean = s
    .replace(/(?:rs\.?|inr|₹|\$|usd|€|eur|£|gbp)/g, '')
    .trim();

  // Handle Indian numbering words (lakh, crore)
  const lakhMatch = clean.match(/^(\d+(?:\.\d+)?)\s*(?:lakh|lakhs|lac|lacs)\b/);
  if (lakhMatch) {
    return {
      amount: Math.round(parseFloat(lakhMatch[1]) * 100000),
      currency
    };
  }

  const croreMatch = clean.match(/^(\d+(?:\.\d+)?)\s*(?:crore|crores|cr)\b/);
  if (croreMatch) {
    return {
      amount: Math.round(parseFloat(croreMatch[1]) * 10000000),
      currency
    };
  }

  // Handle standard multipliers (k, m)
  const kMatch = clean.match(/^(\d+(?:\.\d+)?)\s*k\b/);
  if (kMatch) {
    return {
      amount: Math.round(parseFloat(kMatch[1]) * 1000),
      currency
    };
  }

  const mMatch = clean.match(/^(\d+(?:\.\d+)?)\s*m\b/);
  if (mMatch) {
    return {
      amount: Math.round(parseFloat(mMatch[1]) * 1000000),
      currency
    };
  }

  // Raw digits with commas
  const numClean = clean.replace(/[,\s]/g, '');
  if (/^\d+(\.\d+)?$/.test(numClean)) {
    return {
      amount: parseFloat(numClean),
      currency
    };
  }

  return null;
}

export function normalizeDate(val: string): string | null {
  if (!val) return null;
  const s = val.trim().toLowerCase();

  // 1. ISO format: YYYY-MM-DD
  const isoMatch = s.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if (isoMatch) {
    const y = isoMatch[1];
    const m = isoMatch[2].padStart(2, '0');
    const d = isoMatch[3].padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  // 2. Numeric DD/MM/YYYY or DD-MM-YYYY
  const dmyMatch = s.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
  if (dmyMatch) {
    const d = dmyMatch[1].padStart(2, '0');
    const m = dmyMatch[2].padStart(2, '0');
    const y = dmyMatch[3];
    return `${y}-${m}-${d}`;
  }

  // 3. Natural date: "15 March 2026" or "15th Mar 2026"
  const mNames = Object.keys(MONTH_NAMES).join('|');
  const naturalA = s.match(new RegExp(`^(\\d{1,2})(?:st|nd|rd|th)?\\s+(${mNames})[.,]?\\s*(\\d{4})?$`, 'i'));
  if (naturalA) {
    const d = naturalA[1].padStart(2, '0');
    const m = MONTH_NAMES[naturalA[2].toLowerCase()];
    const y = naturalA[3] || 'XXXX';
    return `${y}-${m}-${d}`;
  }

  // 4. Natural date: "March 15, 2026" or "June 1"
  const naturalB = s.match(new RegExp(`^(${mNames})\\s+(\\d{1,2})(?:st|nd|rd|th)?(?:,?\\s*(\\d{4}))?$`, 'i'));
  if (naturalB) {
    const m = MONTH_NAMES[naturalB[1].toLowerCase()];
    const d = naturalB[2].padStart(2, '0');
    const y = naturalB[3] || 'XXXX';
    return `${y}-${m}-${d}`;
  }

  return null;
}

export function normalizeUrl(val: string): string | null {
  if (!val) return null;
  const s = val.trim().toLowerCase();
  try {
    const u = new URL(s.startsWith('http') ? s : `https://${s}`);
    const host = u.hostname.replace(/^www\./, '');
    const path = u.pathname.replace(/\/+$/, '');
    return `${host}${path}`;
  } catch {
    return null;
  }
}

export function normalizeList(val: string): string[] | null {
  if (!val) return null;
  if (!val.includes(',') && !val.includes(';') && !val.includes('\n')) {
    return null;
  }

  const items = val
    .split(/[,;\n]/)
    .map(i =>
      i
        .trim()
        .toLowerCase()
        .replace(/^[•\-\*]\s*/, '')
        .replace(/^(?:and|or)\s+/i, '')
        .replace(/[.,;]$/, '')
        .trim()
    )
    .filter(i => i.length > 0);

  if (items.length <= 1) return null;

  // Canonicalize each item token set without hardcoded domain synonyms
  return items.sort();
}

export function normalizeBoolean(val: string): boolean | null {
  if (!val) return null;
  const s = val.trim().toLowerCase();
  if (['true', 'yes', 'mandatory', 'required', 'active'].includes(s)) return true;
  if (['false', 'no', 'optional', 'not required', 'inactive'].includes(s)) return false;
  return null;
}

export function normalizeValueByType(val: any, explicitType?: ValueType): { type: ValueType; normalized: any } {
  if (val === null || val === undefined) {
    return { type: 'text', normalized: '' };
  }
  const s = String(val).trim().toLowerCase();
  if (s.length === 0) {
    return { type: 'text', normalized: '' };
  }

  // If explicit type is provided
  if (explicitType) {
    switch (explicitType) {
      case 'percent': {
        const p = normalizePercent(s);
        if (p !== null) return { type: 'percent', normalized: p };
        break;
      }
      case 'money': {
        const m = normalizeMoney(s);
        if (m !== null) return { type: 'money', normalized: m };
        break;
      }
      case 'date': {
        const d = normalizeDate(s);
        if (d !== null) return { type: 'date', normalized: d };
        break;
      }
      case 'list': {
        const l = normalizeList(s);
        if (l !== null) return { type: 'list', normalized: l };
        break;
      }
      case 'boolean': {
        const b = normalizeBoolean(s);
        if (b !== null) return { type: 'boolean', normalized: b };
        break;
      }
      case 'url': {
        const u = normalizeUrl(s);
        if (u !== null) return { type: 'url', normalized: u };
        break;
      }
      case 'number': {
        const n = normalizeNumber(s);
        if (n !== null) return { type: 'number', normalized: n };
        break;
      }
    }
  }

  // Automatic type inference hierarchy:
  // 1. Percent
  const p = normalizePercent(s);
  if (p !== null) return { type: 'percent', normalized: p };

  // 2. Money
  const m = normalizeMoney(s);
  if (m !== null && (s.includes('rs') || s.includes('inr') || s.includes('₹') || s.includes('$') || s.includes('€') || s.includes('£') || s.includes('lakh') || s.includes('crore'))) {
    return { type: 'money', normalized: m };
  }

  // 3. Date
  const d = normalizeDate(s);
  if (d !== null) return { type: 'date', normalized: d };

  // 4. List
  const l = normalizeList(s);
  if (l !== null) return { type: 'list', normalized: l };

  // 5. URL
  if (s.startsWith('http://') || s.startsWith('https://') || s.includes('.gov') || s.includes('.nic.in') || s.includes('.edu') || s.includes('.org') || s.includes('.com')) {
    const u = normalizeUrl(s);
    if (u !== null) return { type: 'url', normalized: u };
  }

  // 6. Number
  const n = normalizeNumber(s);
  if (n !== null) return { type: 'number', normalized: n };

  // 7. Money fallback for pure numbers if currency might be inferred later
  if (m !== null) return { type: 'money', normalized: m };

  // Text fallback
  return {
    type: 'text',
    normalized: s.toLowerCase().replace(/\s+/g, ' ')
  };
}

export interface TypedComparisonResult {
  status: 'equivalent' | 'conflict' | 'wording_difference';
  equivalent: boolean;
  isConflict: boolean;
  isWordingDifference: boolean;
  inferredType: ValueType;
  normalizedA: any;
  normalizedB: any;
}

export function compareTypedValues(
  arg1: any,
  arg2?: any,
  arg3?: any,
  arg4?: any
): TypedComparisonResult {
  let valA: string = '';
  let typeA: ValueType | undefined = undefined;
  let valB: string = '';
  let typeB: ValueType | undefined = undefined;

  if (typeof arg2 === 'string') {
    // Called as (valA, valB, commonType)
    valA = String(arg1 || '');
    valB = String(arg2 || '');
    typeA = arg3;
    typeB = arg3;
  } else {
    // Called as (valA, typeA, valB, typeB)
    valA = String(arg1 || '');
    typeA = arg2;
    valB = String(arg3 || '');
    typeB = arg4;
  }

  const normA = normalizeValueByType(valA, typeA);
  const normB = normalizeValueByType(valB, typeB);

  // Helper return builder
  const buildResult = (status: 'equivalent' | 'conflict' | 'wording_difference') => ({
    status,
    equivalent: status === 'equivalent',
    isConflict: status === 'conflict',
    isWordingDifference: status === 'wording_difference',
    inferredType: normA.type,
    normalizedA: normA.normalized,
    normalizedB: normB.normalized
  });

  // If identical raw normalized text
  if (normA.normalized === normB.normalized) {
    return buildResult('equivalent');
  }

  // If both are typed values
  if (normA.type !== 'text' && normB.type !== 'text') {
    if (normA.type === normB.type) {
      if (normA.type === 'money') {
        const mA: MoneyValue = normA.normalized;
        const mB: MoneyValue = normB.normalized;
        if (mA.currency === mB.currency && mA.amount === mB.amount) {
          return buildResult('equivalent');
        }
        return buildResult('conflict');
      }

      if (normA.type === 'list') {
        const lA: string[] = normA.normalized;
        const lB: string[] = normB.normalized;
        if (lA.length === lB.length && lA.every((item, idx) => item === lB[idx])) {
          return buildResult('equivalent');
        }
        return buildResult('conflict');
      }

      if (normA.normalized === normB.normalized) {
        return buildResult('equivalent');
      }
      return buildResult('conflict');
    }

    // Money and pure number comparison
    if (normA.type === 'money' && normB.type === 'number') {
      if (normA.normalized.amount === normB.normalized) {
        return buildResult('equivalent');
      }
    }
    if (normA.type === 'number' && normB.type === 'money') {
      if (normA.normalized === normB.normalized.amount) {
        return buildResult('equivalent');
      }
    }

    return buildResult('conflict');
  }

  // Strip punctuation and compare
  const sA = String(normA.normalized).replace(/[^a-z0-9]/g, '');
  const sB = String(normB.normalized).replace(/[^a-z0-9]/g, '');
  if (sA.length > 0 && sA === sB) {
    return buildResult('equivalent');
  }

  // Text differences:
  // Check if they are distinct keyword values (e.g. "full tuition" vs "half tuition", "mandatory" vs "not required")
  const wordsA = new Set(String(normA.normalized).split(/\s+/));
  const wordsB = new Set(String(normB.normalized).split(/\s+/));
  const hasContradictoryModifier =
    (wordsA.has('full') && wordsB.has('half')) ||
    (wordsA.has('half') && wordsB.has('full')) ||
    (wordsA.has('mandatory') && wordsB.has('optional')) ||
    (wordsA.has('optional') && wordsB.has('mandatory'));

  if (hasContradictoryModifier) {
    return buildResult('conflict');
  }

  // General text differences produce an Uncertain wording_difference signal
  return buildResult('wording_difference');
}
