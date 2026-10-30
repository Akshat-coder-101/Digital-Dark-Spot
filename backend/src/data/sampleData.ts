import { IngestedSource } from '../ingestion/types.js';
import { RawLLMExtraction, FullAnalysisReport } from '../analysis/types.js';
import { verifyClaimsVerbatim } from '../analysis/verifier.js';
import { detectGaps } from '../analysis/gaps.js';
import { detectConflicts } from '../analysis/conflicts.js';
import { auditFreshness } from '../analysis/freshness.js';
import { buildCoverageMatrix } from '../analysis/matrix.js';
import { buildPrioritizedChecklist } from '../analysis/checklist.js';

export const SAMPLE_RESEARCH_QUESTION = "What should I verify before applying for the National Scholarship Scheme 2026 (NSP)?";

export const SAMPLE_SOURCES: IngestedSource[] = [
  {
    id: 'src-sample-official',
    type: 'text',
    domain: 'scholarships.gov.in',
    title: 'National Scholarship Portal (NSP) — Central Guidelines 2026-27',
    rawText: `Official Gazette Announcement: Applications for the National Means-cum-Merit Scholarship for the 2026-27 academic session are now open on the National Scholarship Portal (scholarships.gov.in). The maximum family annual income ceiling is ₹2,50,000 as confirmed by competent revenue authority income certificates. All applicants must authenticate via Aadhaar One-Time Registration (OTR) and submit certified academic marksheets. Selected scholars receive an annual award of ₹12,000 disbursed directly through DBT. The strict closing deadline for application submission is 31 October 2026. Published 12 January 2026.`,
    cleanedText: `Official Gazette Announcement: Applications for the National Means-cum-Merit Scholarship for the 2026-27 academic session are now open on the National Scholarship Portal (scholarships.gov.in). The maximum family annual income ceiling is ₹2,50,000 as confirmed by competent revenue authority income certificates. All applicants must authenticate via Aadhaar One-Time Registration (OTR) and submit certified academic marksheets. Selected scholars receive an annual award of ₹12,000 disbursed directly through DBT. The strict closing deadline for application submission is 31 October 2026. Published 12 January 2026.`,
    wordCount: 78,
    detectedDate: '12 January 2026',
    detectedCycle: '2026-27',
    isStale: false,
    isUndated: false,
    status: 'ready',
    fetchedAt: '2026-10-30T10:00:00.000Z'
  },
  {
    id: 'src-sample-blog',
    type: 'text',
    domain: 'scholarshiptips-india.org',
    title: 'Student Aid Review: Unofficial Guide to 2026-27 NSP Scholarships',
    rawText: `In our student guidance advisory for the 2026-27 scholarship session, the parental annual income limit was established at ₹1,50,000 maximum. Crucially, applicants were instructed to upload bank passbook statements for the last 6 months along with an employer affidavit of income, rather than standard government income certificates. Remember to double-check requirements before applying. Published 25 January 2026 for the 2026-27 academic term.`,
    cleanedText: `In our student guidance advisory for the 2026-27 scholarship session, the parental annual income limit was established at ₹1,50,000 maximum. Crucially, applicants were instructed to upload bank passbook statements for the last 6 months along with an employer affidavit of income, rather than standard government income certificates. Remember to double-check requirements before applying. Published 25 January 2026 for the 2026-27 academic term.`,
    wordCount: 65,
    detectedDate: '25 January 2026',
    detectedCycle: '2026-27',
    isStale: false,
    isUndated: false,
    status: 'ready',
    fetchedAt: '2026-10-30T10:00:00.000Z'
  },
  {
    id: 'src-sample-archived',
    type: 'text',
    domain: 'archives-edupress.org',
    title: 'State Education Archive: 2024-25 Past Cycle Gazette Reference',
    rawText: `Historical Reference Archive: In the earlier 2024-25 cycle, state income caps were fixed at ₹1,00,000 and required physical countersignature from district education offices. Notice preserved for historical reference. Published 10 September 2024 for the 2024-25 term.`,
    cleanedText: `Historical Reference Archive: In the earlier 2024-25 cycle, state income caps were fixed at ₹1,00,000 and required physical countersignature from district education offices. Notice preserved for historical reference. Published 10 September 2024 for the 2024-25 term.`,
    wordCount: 42,
    detectedDate: '10 September 2024',
    detectedCycle: '2024-25',
    isStale: true,
    isUndated: false,
    status: 'ready',
    fetchedAt: '2026-10-30T10:00:00.000Z'
  },
  {
    id: 'src-sample-forum',
    type: 'text',
    domain: 'talkcampus-india.net',
    title: 'CollegeForum Community Discussion Thread #892',
    rawText: `Someone on the forum posted that candidates require a minimum 55% aggregate in qualifying exams to be considered. Also note that awards might be reduced if outside grants exceed ₹5,000. Be careful because the official faculty page doesn't mention renewal conditions anywhere, so ask your nodal officer! Undated post by user @ScholarSeeker.`,
    cleanedText: `Someone on the forum posted that candidates require a minimum 55% aggregate in qualifying exams to be considered. Also note that awards might be reduced if outside grants exceed ₹5,000. Be careful because the official faculty page doesn't mention renewal conditions anywhere, so ask your nodal officer! Undated post by user @ScholarSeeker.`,
    wordCount: 55,
    detectedDate: null,
    detectedCycle: null,
    isStale: false,
    isUndated: true,
    status: 'ready',
    fetchedAt: '2026-10-30T10:00:00.000Z'
  }
];

export const PRECOMPUTED_SAMPLE_LLM_OUTPUT: RawLLMExtraction = {
  expected_attributes: [
    'application_deadline',
    'eligibility_income_limit',
    'required_documents',
    'award_amount',
    'official_application_portal',
    'renewal_conditions',
    'minimum_gpa',
    'external_award_offset'
  ],
  claims: [
    {
      source_id: 'src-sample-official',
      attribute: 'application_deadline',
      value: '31 October 2026',
      quote: 'strict closing deadline for application submission is 31 October 2026'
    },
    {
      source_id: 'src-sample-official',
      attribute: 'eligibility_income_limit',
      value: '₹2,50,000 maximum family income (confirmed by revenue certificate)',
      quote: 'maximum family annual income ceiling is ₹2,50,000 as confirmed by competent revenue authority income certificates'
    },
    {
      source_id: 'src-sample-blog',
      attribute: 'eligibility_income_limit',
      value: '₹1,50,000 maximum (2026-27 guide)',
      quote: 'parental annual income limit was established at ₹1,50,000 maximum'
    },
    {
      source_id: 'src-sample-official',
      attribute: 'required_documents',
      value: 'Aadhaar OTR authentication and certified academic marksheets',
      quote: 'authenticate via Aadhaar One-Time Registration (OTR) and submit certified academic marksheets'
    },
    {
      source_id: 'src-sample-blog',
      attribute: 'required_documents',
      value: 'Bank passbook statements for the last 6 months + employer affidavit',
      quote: 'upload bank passbook statements for the last 6 months along with an employer affidavit of income'
    },
    {
      source_id: 'src-sample-official',
      attribute: 'award_amount',
      value: '₹12,000 annually disbursed through DBT',
      quote: 'annual award of ₹12,000 disbursed directly through DBT'
    },
    {
      source_id: 'src-sample-official',
      attribute: 'official_application_portal',
      value: 'scholarships.gov.in',
      quote: 'open on the National Scholarship Portal (scholarships.gov.in)'
    },
    {
      source_id: 'src-sample-forum',
      attribute: 'minimum_gpa',
      value: 'Minimum 55% aggregate marks',
      quote: 'require a minimum 55% aggregate in qualifying exams to be considered'
    },
    {
      source_id: 'src-sample-forum',
      attribute: 'external_award_offset',
      value: 'Award reduced if outside grants exceed ₹5,000',
      quote: 'awards might be reduced if outside grants exceed ₹5,000'
    }
  ],
  open_questions: [
    'What are the official renewal conditions for continuing the National Scholarship into subsequent academic years?',
    'Which income documentation is officially mandated for the 2026-27 NSP cycle: revenue authority income certificate or 6-month bank passbook?',
    'Is there an official minimum aggregate percentage stated in Central Government regulations, or is selection ranking purely comparative?'
  ],
  summary: 'Reviewed primary documents for the National Scholarship Scheme 2026 (NSP Guidelines 2026-27): the official portal announcement (scholarships.gov.in), an unofficial 2026 student guide, a community forum thread, and archived 2024-25 records. Discovered conflicting income ceilings (₹2,50,000 vs ₹1,50,000) and documentation requirements across 2026 sources, alongside an unaddressed total gap on renewal conditions.'
};

/**
 * Builds the verified sample report by running the precomputed extraction
 * through the EXACT same deterministic verification and analysis algorithms.
 */
export function generateSampleReport(): FullAnalysisReport {
  const verified = verifyClaimsVerbatim(
    PRECOMPUTED_SAMPLE_LLM_OUTPUT.claims,
    SAMPLE_SOURCES
  );

  const gaps = detectGaps(
    PRECOMPUTED_SAMPLE_LLM_OUTPUT.expected_attributes,
    verified.verifiedClaims,
    SAMPLE_SOURCES.length
  );

  const conflicts = detectConflicts(
    verified.verifiedClaims,
    SAMPLE_SOURCES
  );

  const freshness = auditFreshness(SAMPLE_SOURCES);

  const matrix = buildCoverageMatrix(
    PRECOMPUTED_SAMPLE_LLM_OUTPUT.expected_attributes,
    SAMPLE_SOURCES,
    verified.verifiedClaims,
    conflicts
  );

  const checklist = buildPrioritizedChecklist(
    gaps,
    conflicts,
    freshness,
    PRECOMPUTED_SAMPLE_LLM_OUTPUT.open_questions
  );

  return {
    id: 'sample-scholarship-report',
    question: SAMPLE_RESEARCH_QUESTION,
    summary: PRECOMPUTED_SAMPLE_LLM_OUTPUT.summary || '',
    analyzedWith: {
      provider: 'Offline Verified Dataset',
      model: 'Precomputed Ground-Truth Sample',
      cached: true
    },
    metrics: {
      sourcesCount: SAMPLE_SOURCES.length,
      gapsCount: gaps.length,
      conflictsCount: conflicts.length,
      staleCount: freshness.length,
      claimsCount: verified.verifiedClaims.length,
      discardedClaimsCount: verified.discardedClaimsCount
    },
    expectedAttributes: PRECOMPUTED_SAMPLE_LLM_OUTPUT.expected_attributes,
    sources: SAMPLE_SOURCES,
    claims: verified.verifiedClaims,
    gaps,
    conflicts,
    freshnessWarnings: freshness,
    coverageMatrix: matrix,
    checklist,
    openQuestions: PRECOMPUTED_SAMPLE_LLM_OUTPUT.open_questions,
    createdAt: new Date().toISOString()
  };
}
