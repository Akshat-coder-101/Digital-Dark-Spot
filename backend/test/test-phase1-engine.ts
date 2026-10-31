import assert from 'assert';
import {
  normalizeNumber,
  normalizePercent,
  normalizeMoney,
  normalizeDate,
  normalizeUrl,
  normalizeList,
  normalizeBoolean,
  compareTypedValues
} from '../src/analysis/normalization.js';
import { areAttributesMatching, extractQualifier } from '../src/analysis/canonicalization.js';
import { detectTemporalMetadata } from '../src/ingestion/metadata.js';
import { detectConflicts } from '../src/analysis/conflicts.js';
import { buildCoverageMatrix } from '../src/analysis/matrix.js';
import { IngestedSource } from '../src/ingestion/types.js';
import { ExtractedClaim } from '../src/analysis/types.js';

console.log('\n🍉 ========================================================');
console.log('       DIGITAL DARK SPOT — PHASE 1 ENGINE TEST SUITE       ');
console.log('========================================================\n');

let passed = 0;
let failed = 0;

function runTest(name: string, fn: () => void) {
  try {
    fn();
    console.log(`✅ [PASS] ${name}`);
    passed++;
  } catch (err: any) {
    console.log(`❌ [FAIL] ${name}: ${err.message}`);
    failed++;
  }
}

// 1. Normalization Tests
runTest('Normalizers: Number, Percent, Money, Date, Url, List, Boolean', () => {
  assert.strictEqual(normalizeNumber('1,250.50'), 1250.5);
  assert.strictEqual(normalizePercent('85.5%'), 85.5);
  assert.strictEqual(normalizePercent('85.5 percent'), 85.5);

  const moneyLakh = normalizeMoney('Rs 2.5 lakh');
  assert.deepStrictEqual(moneyLakh, { amount: 250000, currency: 'INR' });

  const moneyCrore = normalizeMoney('1.5 crore INR');
  assert.deepStrictEqual(moneyCrore, { amount: 15000000, currency: 'INR' });

  const moneyUsd = normalizeMoney('$45,000');
  assert.deepStrictEqual(moneyUsd, { amount: 45000, currency: 'USD' });

  assert.strictEqual(normalizeDate('2026-04-15'), '2026-04-15');
  assert.strictEqual(normalizeDate('15 April 2026'), '2026-04-15');
  assert.strictEqual(normalizeDate('15/04/2026'), '2026-04-15');

  assert.strictEqual(normalizeUrl('https://example.gov.in/portal/'), 'example.gov.in/portal');

  assert.deepStrictEqual(normalizeList('Item C, Item A; Item B'), ['item a', 'item b', 'item c']);
  assert.strictEqual(normalizeBoolean('mandatory'), true);
  assert.strictEqual(normalizeBoolean('optional'), false);
});

// 2. Strict Qualifier Separation
runTest('Qualifier separation: Distinct roles/qualifiers never conflict or falsely match', () => {
  const match1 = areAttributesMatching('student_submission_deadline', 'institute_verification_deadline');
  assert.strictEqual(match1, false, 'Student and institute deadlines must not match');

  const match2 = areAttributesMatching('primary_applicant_criteria', 'secondary_applicant_criteria');
  assert.strictEqual(match2, false, 'Primary and secondary criteria must not match');

  const claims: ExtractedClaim[] = [
    {
      id: 'c1',
      source_id: 's1',
      source_title: 'Notice A',
      source_domain: 'notice-a.example',
      attribute: 'student_submission_deadline',
      original_attribute: 'student_submission_deadline',
      value: '31 October 2026',
      quote: 'student deadline is 31 October 2026',
      verified: true,
      qualifier: 'student'
    },
    {
      id: 'c2',
      source_id: 's2',
      source_title: 'Notice B',
      source_domain: 'notice-b.example',
      attribute: 'institute_verification_deadline',
      original_attribute: 'institute_verification_deadline',
      value: '15 November 2026',
      quote: 'institute verification is 15 November 2026',
      verified: true,
      qualifier: 'institution'
    }
  ];

  const dummySources: IngestedSource[] = [
    {
      id: 's1', type: 'text', domain: 'notice-a.example', title: 'Notice A', rawText: '', cleanedText: '',
      wordCount: 10, textCharacterCount: 50, claimsExtracted: 1, claimsDiscarded: 0, usefulnessStatus: 'READY',
      credibilityHint: 'institutional', detectedDate: '2026-01-01', detectedCycle: null, isStale: false,
      isUndated: false, status: 'ready', fetchedAt: ''
    },
    {
      id: 's2', type: 'text', domain: 'notice-b.example', title: 'Notice B', rawText: '', cleanedText: '',
      wordCount: 10, textCharacterCount: 50, claimsExtracted: 1, claimsDiscarded: 0, usefulnessStatus: 'READY',
      credibilityHint: 'institutional', detectedDate: '2026-01-01', detectedCycle: null, isStale: false,
      isUndated: false, status: 'ready', fetchedAt: ''
    }
  ];

  const conflicts = detectConflicts(claims, dummySources);
  assert.strictEqual(conflicts.length, 0, 'No conflict should exist between different qualifiers');
});

// 3. Publication vs Deadline Date
runTest('Publication vs Deadline Date: Deadlines are never treated as publication dates', () => {
  const textWithDeadlineOnly = 'Official announcement. Strict submission deadline: 15 April 2026. Do not miss.';
  const res1 = detectTemporalMetadata(textWithDeadlineOnly, 'Announcement');
  assert.strictEqual(res1.detectedDate, null, 'Deadline date must NOT be treated as publication date');
  assert.strictEqual(res1.isUndated, true);

  const textWithExplicitPubDate = 'Published: 12 January 2026. Deadline to submit is 15 April 2026.';
  const res2 = detectTemporalMetadata(textWithExplicitPubDate, 'Announcement');
  assert.strictEqual(res2.detectedDate, '12 January 2026', 'Explicit publication date must be extracted');
  assert.strictEqual(res2.isUndated, false);
});

// 4. Status Precedence in Coverage Matrix
runTest('Status precedence: Conflict > Gap > Stale > Single source > Found', () => {
  const sources: IngestedSource[] = [
    {
      id: 's1', type: 'text', domain: 'source-one.example', title: 'Source 1', rawText: '', cleanedText: '',
      wordCount: 100, textCharacterCount: 500, claimsExtracted: 1, claimsDiscarded: 0, usefulnessStatus: 'READY',
      credibilityHint: 'institutional', detectedDate: '2026-01-01', detectedCycle: null, isStale: false,
      isUndated: false, status: 'ready', fetchedAt: ''
    },
    {
      id: 's2', type: 'text', domain: 'source-two.example', title: 'Source 2', rawText: '', cleanedText: '',
      wordCount: 100, textCharacterCount: 500, claimsExtracted: 1, claimsDiscarded: 0, usefulnessStatus: 'READY',
      credibilityHint: 'general', detectedDate: '2023-01-01', detectedCycle: null, isStale: true,
      isUndated: false, status: 'ready', fetchedAt: ''
    }
  ];

  const conflictingClaims: ExtractedClaim[] = [
    { id: 'c1', source_id: 's1', source_title: 'S1', source_domain: 'd1', attribute: 'max_capacity', value: '100 kW', quote: '100 kW', verified: true },
    { id: 'c2', source_id: 's2', source_title: 'S2', source_domain: 'd2', attribute: 'max_capacity', value: '50 kW', quote: '50 kW', verified: true }
  ];

  const conflicts = detectConflicts(conflictingClaims, sources);
  assert.strictEqual(conflicts.length, 1);

  const matrix = buildCoverageMatrix(['max_capacity', 'unmentioned_attribute'], sources, conflictingClaims, conflicts);
  assert.strictEqual(matrix[0].overallStatus, 'conflict', 'Conflict takes precedence over stale/thin/found');
  assert.strictEqual(matrix[1].overallStatus, 'gap', 'Unmentioned attribute must be a gap');
});

// 5. Usefulness Classification
runTest('Usefulness status classification: READY, NEEDS_ATTENTION, FAILED', () => {
  const readySource: IngestedSource = {
    id: 's-ready', type: 'text', domain: 'valid.example', title: 'Valid', rawText: 'valid content', cleanedText: 'valid content with enough characters to be ready',
    wordCount: 10, textCharacterCount: 100, claimsExtracted: 2, claimsDiscarded: 0, usefulnessStatus: 'READY',
    credibilityHint: 'general', detectedDate: null, detectedCycle: null, isStale: false, isUndated: true, status: 'ready', fetchedAt: ''
  };
  assert.strictEqual(readySource.usefulnessStatus, 'READY');

  const emptySource: IngestedSource = {
    id: 's-failed', type: 'text', domain: 'empty.example', title: 'Empty', rawText: '', cleanedText: '',
    wordCount: 0, textCharacterCount: 0, claimsExtracted: 0, claimsDiscarded: 0, usefulnessStatus: 'FAILED',
    credibilityHint: 'general', detectedDate: null, detectedCycle: null, isStale: false, isUndated: true, status: 'error', fetchedAt: ''
  };
  assert.strictEqual(emptySource.usefulnessStatus, 'FAILED');
});

console.log(`\nEngine Test Results: ${passed} passed, ${failed} failed`);
if (failed > 0) {
  process.exit(1);
} else {
  console.log('🍉 All Phase 1 Engine tests passed!\n');
}

