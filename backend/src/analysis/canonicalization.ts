/**
 * Attribute canonicalization and synonym matching.
 * Maps diverse wording (e.g. "deadline" vs "last_date", "income_limit" vs "family_income")
 * to shared canonical keys to prevent false gaps and enable cross-source conflict detection.
 */

const SYNONYM_CLUSTERS: Record<string, string[]> = {
  application_deadline: [
    'deadline',
    'last_date',
    'last_date_to_apply',
    'closing_date',
    'due_date',
    'submission_deadline',
    'end_date',
    'cutoff_date',
    'application_end_date',
    'last_date_of_application'
  ],
  eligibility_income_limit: [
    'income_limit',
    'family_income',
    'annual_income',
    'household_income',
    'income_ceiling',
    'parental_income',
    'income_criteria',
    'family_annual_income',
    'annual_family_income',
    'maximum_income'
  ],
  required_documents: [
    'documents_required',
    'mandatory_documents',
    'document_checklist',
    'certificates_needed',
    'documents_needed',
    'documents_to_upload',
    'necessary_documents',
    'supporting_documents'
  ],
  award_amount: [
    'scholarship_amount',
    'stipend',
    'funding_amount',
    'financial_assistance',
    'grant_amount',
    'benefit_amount',
    'scholarship_value',
    'financial_aid_amount',
    'amount'
  ],
  official_application_portal: [
    'application_portal',
    'portal_url',
    'how_to_apply',
    'website',
    'official_link',
    'application_link',
    'portal_link',
    'apply_online_url',
    'application_url'
  ],
  renewal_conditions: [
    'renewal_criteria',
    'continuation_policy',
    'renewal_requirements',
    'renewal_terms',
    'renewal_rules',
    'scholarship_renewal'
  ],
  eligibility_criteria: [
    'who_can_apply',
    'eligibility_requirements',
    'qualification',
    'qualifying_criteria',
    'eligibility',
    'basic_eligibility'
  ],
  selection_process: [
    'selection_criteria',
    'merit_list',
    'screening_process',
    'how_candidates_are_selected',
    'selection_procedure'
  ],
  age_limit: [
    'maximum_age',
    'minimum_age',
    'age_criteria',
    'age_eligibility'
  ]
};

// Reverse lookup map: synonym -> canonical key
const SYNONYM_MAP = new Map<string, string>();
for (const [canonical, synonyms] of Object.entries(SYNONYM_CLUSTERS)) {
  SYNONYM_MAP.set(canonical, canonical);
  for (const syn of synonyms) {
    SYNONYM_MAP.set(syn, canonical);
  }
}

export function normalizeAttributeName(attr: string): string {
  return attr
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

export function levenshteinDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,      // deletion
        dp[i][j - 1] + 1,      // insertion
        dp[i - 1][j - 1] + cost // substitution
      );
    }
  }

  return dp[m][n];
}

export function canonicalizeAttribute(attr: string): string {
  const norm = normalizeAttributeName(attr);
  if (SYNONYM_MAP.has(norm)) {
    return SYNONYM_MAP.get(norm)!;
  }

  // Check token substring or prefix/suffix matches in clusters
  for (const [canonical, synonyms] of Object.entries(SYNONYM_CLUSTERS)) {
    if (norm === canonical || norm.includes(canonical) || canonical.includes(norm)) {
      return canonical;
    }
    for (const syn of synonyms) {
      if (norm === syn || norm.includes(syn) || syn.includes(norm)) {
        return canonical;
      }
    }
  }

  return norm;
}

export function areAttributesMatching(attr1: string, attr2: string): boolean {
  const c1 = canonicalizeAttribute(attr1);
  const c2 = canonicalizeAttribute(attr2);
  if (c1 === c2) return true;

  const n1 = normalizeAttributeName(attr1);
  const n2 = normalizeAttributeName(attr2);
  if (n1 === n2) return true;

  // Token set overlap
  const tokens1 = new Set(n1.split('_').filter(t => t.length > 2));
  const tokens2 = new Set(n2.split('_').filter(t => t.length > 2));
  let sharedTokens = 0;
  for (const t of tokens1) {
    if (tokens2.has(t)) sharedTokens++;
  }
  const minTokens = Math.min(tokens1.size, tokens2.size);
  if (minTokens > 0 && sharedTokens === minTokens) {
    return true;
  }

  // String edit distance fallback for minor typos (e.g. "requred_documents")
  const maxLen = Math.max(n1.length, n2.length);
  if (maxLen >= 6) {
    const dist = levenshteinDistance(n1, n2);
    if (dist <= 2) return true;
  }

  return false;
}
