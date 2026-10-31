import { IngestedSource } from '../ingestion/types.js';
import { RawLLMExtraction, FullAnalysisReport } from '../analysis/types.js';
import { verifyClaimsVerbatim } from '../analysis/verifier.js';
import { detectGaps } from '../analysis/gaps.js';
import { detectConflicts } from '../analysis/conflicts.js';
import { auditFreshness } from '../analysis/freshness.js';
import { buildCoverageMatrix } from '../analysis/matrix.js';
import { buildPrioritizedChecklist } from '../analysis/checklist.js';

export const SAMPLE_RESEARCH_QUESTION = "What should I verify before applying for this scholarship?";

export const SAMPLE_DISCOVERY_RESULTS = [
  {
    title: 'National Scholarship Portal (NSP) — Central Guidelines 2026-27 [SAMPLE DATA]',
    url: 'sample://scholarships.example/guidelines-2026-27',
    domain: 'scholarships.example [SAMPLE]',
    snippet: 'Official Gazette Announcement: Applications for the National Means-cum-Merit Scholarship for the 2026-27 academic session are now open on the National Scholarship Portal. Maximum family income ceiling is ₹2,50,000. Application deadline 31 October 2026.',
    date: '12 January 2026',
    isOfficial: true,
    score: 95
  },
  {
    title: 'Student Aid Review: Unofficial Guide to 2026-27 NSP Scholarships [SAMPLE DATA]',
    url: 'sample://scholarshiptips.example/guide-2026-27',
    domain: 'scholarshiptips.example [SAMPLE]',
    snippet: 'Advisory: Parental annual income limit stated as ₹1,50,000 maximum with 6 months bank statements required. Conflicting with gazette notification.',
    date: '25 January 2026',
    isOfficial: false,
    score: 82
  },
  {
    title: 'State Education Archive: 2024-25 Past Cycle Reference [SAMPLE DATA]',
    url: 'sample://archives.example/cycle-2024-25',
    domain: 'archives.example [SAMPLE]',
    snippet: 'Historical reference for previous 2024-25 cycle. Income ceiling was ₹1,00,000.',
    date: '10 September 2024',
    isOfficial: false,
    score: 75
  },
  {
    title: 'CollegeForum Community Discussion Thread #892 [SAMPLE DATA]',
    url: 'sample://talkcampus.example/thread-892',
    domain: 'talkcampus.example [SAMPLE]',
    snippet: 'Student discussion: Candidates require minimum 55% marks. Renewal criteria not published on the portal.',
    date: undefined,
    isOfficial: false,
    score: 70
  }
];

export const SAMPLE_SOURCES: IngestedSource[] = [
  {
    id: 'src-sample-official',
    type: 'text',
    domain: 'scholarships.example',
    title: 'National Scholarship Portal (NSP) — Central Guidelines 2026-27',
    rawText: `Official Gazette Announcement: Applications for the National Means-cum-Merit Scholarship for the 2026-27 academic session are now open on the National Scholarship Portal (scholarships.example). The maximum family annual income ceiling is ₹2,50,000 as confirmed by competent revenue authority income certificates. All applicants must authenticate via Aadhaar One-Time Registration (OTR) and submit certified academic marksheets. Selected scholars receive an annual award of ₹12,000 disbursed directly through DBT. The strict closing deadline for application submission is 31 October 2026. Published 12 January 2026.`,
    cleanedText: `Official Gazette Announcement: Applications for the National Means-cum-Merit Scholarship for the 2026-27 academic session are now open on the National Scholarship Portal (scholarships.example). The maximum family annual income ceiling is ₹2,50,000 as confirmed by competent revenue authority income certificates. All applicants must authenticate via Aadhaar One-Time Registration (OTR) and submit certified academic marksheets. Selected scholars receive an annual award of ₹12,000 disbursed directly through DBT. The strict closing deadline for application submission is 31 October 2026. Published 12 January 2026.`,
    wordCount: 78,
    textCharacterCount: 520,
    claimsExtracted: 5,
    claimsDiscarded: 0,
    usefulnessStatus: 'READY',
    credibilityHint: 'institutional',
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
    domain: 'scholarshiptips.example',
    title: 'Student Aid Review: Unofficial Guide to 2026-27 NSP Scholarships',
    rawText: `In our student guidance advisory for the 2026-27 scholarship session, the parental annual income limit was established at ₹1,50,000 maximum. Crucially, applicants were instructed to upload bank passbook statements for the last 6 months along with an employer affidavit of income, rather than standard government income certificates. Remember to double-check requirements before applying. Published 25 January 2026 for the 2026-27 academic term.`,
    cleanedText: `In our student guidance advisory for the 2026-27 scholarship session, the parental annual income limit was established at ₹1,50,000 maximum. Crucially, applicants were instructed to upload bank passbook statements for the last 6 months along with an employer affidavit of income, rather than standard government income certificates. Remember to double-check requirements before applying. Published 25 January 2026 for the 2026-27 academic term.`,
    wordCount: 65,
    textCharacterCount: 420,
    claimsExtracted: 2,
    claimsDiscarded: 0,
    usefulnessStatus: 'READY',
    credibilityHint: 'general',
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
    domain: 'archives.example',
    title: 'State Education Archive: 2024-25 Past Cycle Gazette Reference',
    rawText: `Historical Reference Archive: In the earlier 2024-25 cycle, state income caps were fixed at ₹1,00,000 and required physical countersignature from district education offices. Notice preserved for historical reference. Published 10 September 2024 for the 2024-25 term.`,
    cleanedText: `Historical Reference Archive: In the earlier 2024-25 cycle, state income caps were fixed at ₹1,00,000 and required physical countersignature from district education offices. Notice preserved for historical reference. Published 10 September 2024 for the 2024-25 term.`,
    wordCount: 42,
    textCharacterCount: 260,
    claimsExtracted: 1,
    claimsDiscarded: 0,
    usefulnessStatus: 'READY',
    credibilityHint: 'general',
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
    domain: 'talkcampus.example',
    title: 'CollegeForum Community Discussion Thread #892',
    rawText: `Someone on the college telegram channel said you must have scored at least 55% marks in class 12 to be eligible for the merit quota. Also nobody knows what the renewal conditions are after the first year. Undated forum post.`,
    cleanedText: `Someone on the college telegram channel said you must have scored at least 55% marks in class 12 to be eligible for the merit quota. Also nobody knows what the renewal conditions are after the first year. Undated forum post.`,
    wordCount: 41,
    textCharacterCount: 230,
    claimsExtracted: 1,
    claimsDiscarded: 0,
    usefulnessStatus: 'READY',
    credibilityHint: 'general',
    detectedDate: null,
    detectedCycle: null,
    isStale: false,
    isUndated: true,
    status: 'ready',
    fetchedAt: '2026-10-30T10:00:00.000Z'
  }
];

export const SAMPLE_EXPECTED_ATTRIBUTES: string[] = [
  'application_deadline',
  'eligibility_income_limit',
  'required_documents',
  'award_amount',
  'official_application_portal',
  'renewal_conditions',
  'minimum_qualifying_marks'
];

export const SAMPLE_EXTRACTION: RawLLMExtraction = {
  expected_attributes: SAMPLE_EXPECTED_ATTRIBUTES,
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
      value: '₹2,50,000 maximum per annum',
      quote: 'maximum family annual income ceiling is ₹2,50,000 as confirmed by competent revenue authority income certificates'
    },
    {
      source_id: 'src-sample-official',
      attribute: 'required_documents',
      value: 'Aadhaar OTR authentication and certified academic marksheets',
      quote: 'authenticate via Aadhaar One-Time Registration (OTR) and submit certified academic marksheets'
    },
    {
      source_id: 'src-sample-official',
      attribute: 'award_amount',
      value: '₹12,000 per annum disbursed through DBT',
      quote: 'Selected scholars receive an annual award of ₹12,000 disbursed directly through DBT'
    },
    {
      source_id: 'src-sample-official',
      attribute: 'official_application_portal',
      value: 'https://scholarships.example',
      quote: 'open on the National Scholarship Portal (scholarships.example)'
    },
    {
      source_id: 'src-sample-blog',
      attribute: 'eligibility_income_limit',
      value: '₹1,50,000 maximum with 6 months bank statements',
      quote: 'parental annual income limit was established at ₹1,50,000 maximum'
    },
    {
      source_id: 'src-sample-blog',
      attribute: 'required_documents',
      value: 'Bank passbook statements (6 months) + employer affidavit',
      quote: 'upload bank passbook statements for the last 6 months along with an employer affidavit of income'
    },
    {
      source_id: 'src-sample-archived',
      attribute: 'eligibility_income_limit',
      value: '₹1,00,000 (earlier 2024-25 cycle)',
      quote: 'state income caps were fixed at ₹1,00,000 and required physical countersignature'
    },
    {
      source_id: 'src-sample-forum',
      attribute: 'minimum_qualifying_marks',
      value: 'Minimum 55% in class 12',
      quote: 'scored at least 55% marks in class 12 to be eligible'
    }
  ],
  open_questions: [
    'What are the official renewal criteria and minimum CGPA for subsequent college years?',
    'Which income documentation is definitively required by state scrutinizing officers?'
  ],
  summary: 'Reviewed primary official notice (2026-27), advisory blog post, archived past cycle notice, and student forum discussion. Found 1 critical conflict in parental income limits and 1 total gap regarding subsequent year continuation policy.'
};

export function generateSampleReport(): FullAnalysisReport {
  const sources = SAMPLE_SOURCES;
  const verification = verifyClaimsVerbatim(SAMPLE_EXTRACTION.claims, sources);
  const gaps = detectGaps(SAMPLE_EXPECTED_ATTRIBUTES, verification.verifiedClaims, sources.length);
  const conflicts = detectConflicts(verification.verifiedClaims, sources);
  const freshnessWarnings = auditFreshness(sources);
  const coverageMatrix = buildCoverageMatrix(SAMPLE_EXPECTED_ATTRIBUTES, sources, verification.verifiedClaims, conflicts);
  const checklist = buildPrioritizedChecklist(gaps, conflicts, freshnessWarnings, SAMPLE_EXTRACTION.open_questions);

  return {
    id: 'sample-report-default',
    question: SAMPLE_RESEARCH_QUESTION,
    summary: SAMPLE_EXTRACTION.summary || 'Summary synthesized from sample sources.',
    analyzedWith: {
      provider: 'Deterministic Sample Mode',
      model: 'deterministic-offline-v1',
      cached: true
    },
    metrics: {
      sourcesCount: sources.length,
      gapsCount: gaps.length,
      conflictsCount: conflicts.length,
      staleCount: freshnessWarnings.length,
      claimsCount: verification.verifiedClaims.length,
      discardedClaimsCount: verification.discardedClaimsCount
    },
    expectedAttributes: SAMPLE_EXPECTED_ATTRIBUTES,
    sources,
    claims: verification.verifiedClaims,
    gaps,
    conflicts,
    freshnessWarnings,
    coverageMatrix,
    checklist,
    openQuestions: SAMPLE_EXTRACTION.open_questions,
    createdAt: new Date().toISOString()
  };
}
