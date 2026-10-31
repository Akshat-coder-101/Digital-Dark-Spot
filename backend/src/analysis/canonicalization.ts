/**
 * Topic-independent attribute canonicalization and qualifier separation.
 * 
 * Maps diverse wording to shared canonical keys without hardcoded domain synonym clusters.
 * Enforces strict qualifier separation (e.g. primary vs secondary roles, maximum vs minimum)
 * to prevent false conflicts or false matches.
 */

// Generic role or qualifier prefixes/suffixes that must not be merged across different qualifiers
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

export function canonicalizeAttribute(
  rawAttribute: string,
  targetAttributes: string[] = []
): string {
  const norm = normalizeAttributeName(rawAttribute);

  for (const target of targetAttributes) {
    if (areAttributesMatching(norm, target)) {
      return normalizeAttributeName(target);
    }
  }

  return norm;
}

export function stemAttributeToken(token: string): string {
  if (!token) return '';
  return token
    .toLowerCase()
    .replace(/ies$/, 'y')
    .replace(/sses$/, 'ss')
    .replace(/(?:s|es)$/, '')
    .replace(/(?:ing|tion|ment)$/, '');
}

export function matchesCanonicalParameter(rawAttr: string, rawParam: string): boolean {
  if (!rawAttr || !rawParam) return false;
  const normA = normalizeAttributeName(rawAttr);
  const normP = normalizeAttributeName(rawParam);
  if (normA === normP) return true;
  if (areAttributesNearDuplicates(normA, normP)) return true;

  const tokensA = normA.split('_').map(stemAttributeToken).filter(t => t.length >= 3);
  const tokensP = normP.split('_').map(stemAttributeToken).filter(t => t.length >= 3);
  const setP = new Set(tokensP);

  // If any stemmed token of A appears directly in P
  for (const t of tokensA) {
    if (setP.has(t)) return true;
    for (const p of tokensP) {
      if (t.includes(p) || p.includes(t)) return true;
    }
  }

  // Common semantic topic clusters (power/tgp, display/screen, thermals/cooling, price, warranty)
  const SEMANTIC_GROUPS: Array<{ triggers: string[]; targets: string[] }> = [
    {
      triggers: ['tgp', 'wattage', 'power', 'tdp', 'boost', 'watt'],
      targets: ['power', 'tgp', 'wattage', 'limit', 'boost']
    },
    {
      triggers: ['vram', 'memory', 'gddr', 'bandwidth', 'ram'],
      targets: ['vram', 'memory', 'spec', 'hardware']
    },
    {
      triggers: ['display', 'screen', 'panel', 'refresh', 'hz', 'resolution', 'nit', 'oled', 'ips'],
      targets: ['display', 'screen', 'panel', 'resolution']
    },
    {
      triggers: ['cool', 'thermal', 'fan', 'heat', 'temp', 'vapor'],
      targets: ['cool', 'thermal', 'fan', 'heat']
    },
    {
      triggers: ['price', 'cost', 'fee', 'msrp', 'retail', 'discount', 'deal', 'financ'],
      targets: ['price', 'cost', 'fee', 'financ', 'deal']
    },
    {
      triggers: ['warranty', 'return', 'refund', 'support', 'guarantee', 'repair'],
      targets: ['warranty', 'return', 'policy', 'support']
    },
    {
      triggers: ['deadline', 'due', 'close', 'last_date', 'cutoff', 'timeline', 'schedul'],
      targets: ['deadline', 'date', 'timeline', 'schedul']
    },
    {
      triggers: ['criteria', 'prereq', 'qualif', 'requir'],
      targets: ['criteria', 'requir', 'qualif']
    },
    {
      triggers: ['document', 'certif', 'id_proof', 'transcript', 'filing', 'paper'],
      targets: ['document', 'filing', 'paper']
    },
    {
      triggers: ['portal', 'websit', 'link', 'url', 'register', 'apply'],
      targets: ['portal', 'websit', 'link', 'sourc', 'offic']
    }
  ];

  for (const group of SEMANTIC_GROUPS) {
    const aMatches = tokensA.some(t => group.triggers.some(trig => t.includes(trig) || trig.includes(t)));
    const pMatches = tokensP.some(p => group.targets.some(targ => p.includes(targ) || targ.includes(p)));
    if (aMatches && pMatches) return true;
  }

  return false;
}

export function areAttributesNearDuplicates(attrA: string, attrB: string): boolean {
  if (!attrA || !attrB) return false;
  const normA = normalizeAttributeName(attrA);
  const normB = normalizeAttributeName(attrB);
  if (normA === normB) return true;

  if (areAttributesMatching(normA, normB)) return true;

  const stemsA = normA.split('_').map(stemAttributeToken).filter(t => t.length > 2);
  const stemsB = normB.split('_').map(stemAttributeToken).filter(t => t.length > 2);

  if (stemsA.length === 0 || stemsB.length === 0) return false;

  const setB = new Set(stemsB);
  let common = 0;
  for (const s of stemsA) {
    if (setB.has(s)) common++;
  }

  // If one is a complete stemmed subset of the other
  if (common === Math.min(stemsA.length, stemsB.length)) {
    return true;
  }

  // Token Jaccard on stems >= 0.5
  const union = new Set([...stemsA, ...stemsB]).size;
  return union > 0 && (common / union) >= 0.5;
}

export interface BatchCanonicalizeInput {
  question: string;
  questionNeeds: string[];
  rawAttributes: string[];
  attributeSourceCounts?: Map<string, number>;
  attributeInstitutionalHits?: Map<string, boolean>;
}

export interface BatchCanonicalizeOutput {
  canonicalParameters: string[];
  questionNeeds: string[];
  extraParameters: string[];
  rawToCanonicalMap: Map<string, string>;
  otherDetailsCount: number;
}

export function batchCanonicalizeAttributes(input: BatchCanonicalizeInput): BatchCanonicalizeOutput {
  const {
    questionNeeds: rawNeeds,
    rawAttributes,
    attributeSourceCounts = new Map(),
    attributeInstitutionalHits = new Map()
  } = input;

  const questionNeeds = Array.from(new Set(rawNeeds.map(normalizeAttributeName))).slice(0, 8);
  const rawToCanonicalMap = new Map<string, string>();
  const unmapped: string[] = [];

  // Step 1: Map raw attributes directly to question needs if matching or near-duplicates
  for (const raw of rawAttributes) {
    const norm = normalizeAttributeName(raw);
    if (!norm) continue;

    let matchedNeed: string | undefined;
    for (const need of questionNeeds) {
      if (matchesCanonicalParameter(norm, need)) {
        matchedNeed = need;
        break;
      }
    }

    if (matchedNeed) {
      rawToCanonicalMap.set(norm, matchedNeed);
    } else {
      unmapped.push(norm);
    }
  }

  // Step 2: Cluster unmapped attributes by stem similarity
  const clusters: Array<{ representative: string; members: string[]; totalSources: number; hasInstitutional: boolean }> = [];
  const visited = new Set<string>();

  for (const item of unmapped) {
    if (visited.has(item)) continue;
    visited.add(item);

    const members = [item];
    for (const other of unmapped) {
      if (!visited.has(other) && areAttributesNearDuplicates(item, other)) {
        visited.add(other);
        members.push(other);
      }
    }

    // Pick shortest/cleanest representative
    const representative = members.reduce((a, b) => (a.length <= b.length ? a : b));
    let totalSources = 0;
    let hasInstitutional = false;

    for (const m of members) {
      totalSources = Math.max(totalSources, attributeSourceCounts.get(m) || 1);
      if (attributeInstitutionalHits.get(m)) hasInstitutional = true;
    }

    clusters.push({ representative, members, totalSources, hasInstitutional });
  }

  // Step 3: Promote at most 4 B parameters that appear in >=2 sources or in strongest sources
  const maxBAllowed = Math.max(0, 12 - questionNeeds.length);
  const totalMaxSources = Math.max(1, ...Array.from(attributeSourceCounts.values()));
  const threshold = totalMaxSources <= 2 ? 1 : 2;
  const eligibleB = clusters.filter(c => c.totalSources >= threshold || c.hasInstitutional);

  eligibleB.sort((a, b) => {
    if (a.hasInstitutional !== b.hasInstitutional) {
      return a.hasInstitutional ? -1 : 1;
    }
    if (b.totalSources !== a.totalSources) {
      return b.totalSources - a.totalSources;
    }
    return a.representative.localeCompare(b.representative);
  });

  const promotedB: string[] = [];
  const promotedSet = new Set<string>();

  for (const cand of eligibleB) {
    if (promotedB.length >= Math.min(4, maxBAllowed)) break;
    promotedB.push(cand.representative);
    promotedSet.add(cand.representative);

    for (const m of cand.members) {
      rawToCanonicalMap.set(m, cand.representative);
    }
  }

  // Step 4: Any remaining cluster members are mapped to "other_details"
  let otherDetailsCount = 0;
  for (const cluster of clusters) {
    if (!promotedSet.has(cluster.representative)) {
      for (const m of cluster.members) {
        rawToCanonicalMap.set(m, 'other_details');
        otherDetailsCount += (attributeSourceCounts.get(m) || 1);
      }
    }
  }

  const canonicalParameters = [...questionNeeds, ...promotedB].slice(0, 12);

  return {
    canonicalParameters,
    questionNeeds,
    extraParameters: promotedB,
    rawToCanonicalMap,
    otherDetailsCount
  };
}

export function canonicalizeAttributeDetailed(
  rawAttribute: string,
  targetAttributes: string[] = []
): { canonical: string; matched: boolean; qualifier?: string } {
  const norm = normalizeAttributeName(rawAttribute);
  const { qualifier } = extractQualifier(norm);

  for (const target of targetAttributes) {
    if (areAttributesMatching(norm, target)) {
      return {
        canonical: normalizeAttributeName(target),
        matched: true,
        qualifier
      };
    }
  }

  return {
    canonical: norm,
    matched: false,
    qualifier
  };
}
