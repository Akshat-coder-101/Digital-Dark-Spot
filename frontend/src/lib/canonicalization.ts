export const QUALIFIER_TOKENS = [
  'primary',
  'secondary',
  'initial',
  'extension',
  'maximum',
  'minimum',
  'student',
  'institution',
  'officer',
  'provider',
  'resident',
  'commercial',
  'domestic',
  'standard',
  'expedited'
];

export function normalizeAttributeName(attr: any): string {
  if (!attr) return '';
  const str = typeof attr === 'string' ? attr : (attr.attribute || attr.key || attr.name || String(attr));
  return str
    .toLowerCase()
    .trim()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .replace(/_+/g, '_');
}

export function extractQualifier(attr: string): { qualifier?: string; baseKey: string } {
  const norm = normalizeAttributeName(attr);
  const parts = norm.split('_');

  for (const q of QUALIFIER_TOKENS) {
    if (parts.includes(q)) {
      const remaining = parts.filter(p => p !== q).join('_');
      return { qualifier: q, baseKey: remaining || norm };
    }
  }

  return { baseKey: norm };
}

export function areAttributesMatching(attrA: any, attrB: any): boolean {
  if (!attrA || !attrB) return false;

  const normA = normalizeAttributeName(attrA);
  const normB = normalizeAttributeName(attrB);

  if (normA === normB) return true;

  // Extract qualifiers
  const { qualifier: qA, baseKey: baseA } = extractQualifier(normA);
  const { qualifier: qB, baseKey: baseB } = extractQualifier(normB);

  // If both have different explicit qualifiers, they must NOT match
  if (qA && qB && qA !== qB) {
    return false;
  }

  // If one has a qualifier and the other doesn't, allow match only if baseKeys are identical
  if ((qA || qB) && baseA === baseB) {
    return true;
  }

  // Token-based matching on base keys
  const tokensA = new Set(baseA.split('_').filter(t => t.length > 2));
  const tokensB = new Set(baseB.split('_').filter(t => t.length > 2));

  if (tokensA.size === 0 || tokensB.size === 0) {
    return false;
  }

  let intersectionCount = 0;
  for (const t of tokensA) {
    if (tokensB.has(t)) intersectionCount++;
  }

  const unionSize = new Set([...tokensA, ...tokensB]).size;
  const jaccard = unionSize > 0 ? intersectionCount / unionSize : 0;

  // Exact subset match for multi-token attributes (e.g. "submission_deadline" and "deadline")
  const isSubset = intersectionCount === Math.min(tokensA.size, tokensB.size);
  if (isSubset && Math.min(tokensA.size, tokensB.size) >= 1 && Math.max(tokensA.size, tokensB.size) <= 3) {
    return true;
  }

  return jaccard >= 0.6;
}

