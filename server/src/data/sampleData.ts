import { IngestedSource } from '../ingestion/types.js';
import { RawLLMExtraction, FullAnalysisReport } from '../analysis/types.js';
import { verifyClaimsVerbatim } from '../analysis/verifier.js';
import { detectGaps } from '../analysis/gaps.js';
import { detectConflicts } from '../analysis/conflicts.js';
import { auditFreshness } from '../analysis/freshness.js';
import { buildCoverageMatrix } from '../analysis/matrix.js';
import { buildPrioritizedChecklist } from '../analysis/checklist.js';

export const SAMPLE_RESEARCH_QUESTION = "What should I verify before applying for this scholarship?";

export const SAMPLE_SOURCES: IngestedSource[] = [
  {
    id: 'src-sample-official',
    type: 'text',
    domain: 'scholarships.gov.fictional',
    title: 'National Merit Scholarship 2026 Guidelines (Official Notice)',
    rawText: `Official Gazette Announcement: Applications for the National Merit Scholarship 2026-27 cycle are now officially open. Candidates must submit complete applications before the strict deadline of 15 April 2026. The maximum household annual income ceiling is $50,000 as confirmed by official tax returns. All applicants must submit official certified academic transcripts and proof of state residency. Selected scholars receive an annual award of $8,000 disbursed across two semesters. Direct submissions must be made through the official portal at portal.scholarships.gov.fictional. Incomplete dossiers will be rejected. Published 12 January 2026.`,
    cleanedText: `Official Gazette Announcement: Applications for the National Merit Scholarship 2026-27 cycle are now officially open. Candidates must submit complete applications before the strict deadline of 15 April 2026. The maximum household annual income ceiling is $50,000 as confirmed by official tax returns. All applicants must submit official certified academic transcripts and proof of state residency. Selected scholars receive an annual award of $8,000 disbursed across two semesters. Direct submissions must be made through the official portal at portal.scholarships.gov.fictional. Incomplete dossiers will be rejected. Published 12 January 2026.`,
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
    domain: 'collegescholars-blog.fictional',
    title: 'Student Aid Review: Unofficial Guide to 2024-25 Scholarships',
    rawText: `In our review of the 2024-25 scholarship cycle, the family income limit was established at $40,000 maximum. Crucially, applicants were instructed to upload bank statements for the last 6 months along with an employer affidavit of income, rather than standard tax certificates. Remember that application requirements often shift across years. Published 10 September 2024 for the 2024-25 academic term.`,
    cleanedText: `In our review of the 2024-25 scholarship cycle, the family income limit was established at $40,000 maximum. Crucially, applicants were instructed to upload bank statements for the last 6 months along with an employer affidavit of income, rather than standard tax certificates. Remember that application requirements often shift across years. Published 10 September 2024 for the 2024-25 academic term.`,
    wordCount: 65,
    detectedDate: '10 September 2024',
    detectedCycle: '2024-25',
    isStale: true, // older than 18m and earlier cycle
    isUndated: false,
    status: 'ready',
    fetchedAt: '2026-10-30T10:00:00.000Z'
  },
  {
    id: 'src-sample-forum',
    type: 'text',
    domain: 'talkcampus.fictional',
    title: 'CollegeForum Community Discussion Thread #892',
    rawText: `Someone on the forum posted that candidates require a minimum 3.2 cumulative GPA to be eligible for consideration. Also note that awards might be reduced if outside grants exceed $2,000. Be careful because the official faculty page doesn't mention renewal conditions anywhere, so ask your advisor! Undated post by user @ScholarSeeker.`,
    cleanedText: `Someone on the forum posted that candidates require a minimum 3.2 cumulative GPA to be eligible for consideration. Also note that awards might be reduced if outside grants exceed $2,000. Be careful because the official faculty page doesn't mention renewal conditions anywhere, so ask your advisor! Undated post by user @ScholarSeeker.`,
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
      value: '15 April 2026',
      quote: 'strict deadline of 15 April 2026'
    },
    {
      source_id: 'src-sample-official',
      attribute: 'eligibility_income_limit',
      value: '$50,000 maximum household income (confirmed by tax returns)',
      quote: 'maximum household annual income ceiling is $50,000 as confirmed by official tax returns'
    },
    {
      source_id: 'src-sample-blog',
      attribute: 'eligibility_income_limit',
      value: '$40,000 maximum (2024-25 cycle)',
      quote: 'family income limit was established at $40,000 maximum'
    },
    {
      source_id: 'src-sample-official',
      attribute: 'required_documents',
      value: 'Certified academic transcripts and proof of state residency',
      quote: 'submit official certified academic transcripts and proof of state residency'
    },
    {
      source_id: 'src-sample-blog',
      attribute: 'required_documents',
      value: 'Bank statements for the last 6 months + employer affidavit',
      quote: 'upload bank statements for the last 6 months along with an employer affidavit of income'
    },
    {
      source_id: 'src-sample-official',
      attribute: 'award_amount',
      value: '$8,000 annually across two semesters',
      quote: 'annual award of $8,000 disbursed across two semesters'
    },
    {
      source_id: 'src-sample-official',
      attribute: 'official_application_portal',
      value: 'portal.scholarships.gov.fictional',
      quote: 'official portal at portal.scholarships.gov.fictional'
    },
    {
      source_id: 'src-sample-forum',
      attribute: 'minimum_gpa',
      value: 'Minimum 3.2 cumulative GPA (forum rumor)',
      quote: 'require a minimum 3.2 cumulative GPA to be eligible'
    },
    {
      source_id: 'src-sample-forum',
      attribute: 'external_award_offset',
      value: 'Award reduced if outside grants exceed $2,000',
      quote: 'awards might be reduced if outside grants exceed $2,000'
    }
  ],
  open_questions: [
    'What are the official renewal conditions for continuing the scholarship into subsequent academic years?',
    'Which income documentation is officially mandated for the 2026 cycle: tax returns or 6-month bank statements?',
    'Is there an official minimum GPA requirement stated in government regulations, or is selection ranking purely comparative?'
  ],
  summary: 'Reviewed 3 fictional scholarship documents across official 2026 notice, earlier 2024-25 guide, and forum comments. Discovered conflicting income limits ($50k vs $40k) and document requirements, alongside a total information gap on renewal criteria.'
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
