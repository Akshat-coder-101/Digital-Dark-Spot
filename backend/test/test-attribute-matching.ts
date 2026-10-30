import assert from 'assert';
import {
  canonicalizeAttribute,
  areAttributesMatching
} from '../src/analysis/canonicalization.js';
import { detectGaps } from '../src/analysis/gaps.js';
import { detectConflicts } from '../src/analysis/conflicts.js';
import { ExtractedClaim } from '../src/analysis/types.js';
import { IngestedSource } from '../ingestion/types.js';

console.log('\n🍉 ========================================================');
console.log('       DIGITAL DARK SPOT — ATTRIBUTE MATCHING TESTS       ');
console.log('========================================================\n');

let passed = 0;
let failed = 0;

function testMatch(attr1: string, attr2: string, expected: boolean, desc: string) {
  try {
    const res = areAttributesMatching(attr1, attr2);
    assert.strictEqual(res, expected, `Expected match=${expected} for "${attr1}" vs "${attr2}"`);
    console.log(`✅ [Match Check] ${desc}: "${attr1}" ~ "${attr2}" (result: ${res})`);
    passed++;
  } catch (err: any) {
    console.log(`❌ [FAILED Match Check] ${desc}: "${attr1}" ~ "${attr2}" -> ${err.message}`);
    failed++;
  }
}

// 1. Synonym matching tests
testMatch('deadline', 'last_date', true, 'Deadline vs Last Date');
testMatch('application_deadline', 'closing_date', true, 'Application Deadline vs Closing Date');
testMatch('income_limit', 'family_income', true, 'Income Limit vs Family Income');
testMatch('annual_income', 'eligibility_income_limit', true, 'Annual Income vs Eligibility Income Limit');
testMatch('required_documents', 'documents_needed', true, 'Required Documents vs Documents Needed');
testMatch('award_amount', 'scholarship_amount', true, 'Award Amount vs Scholarship Amount');
testMatch('official_application_portal', 'portal_url', true, 'Application Portal vs Portal URL');
testMatch('requred_documents', 'required_documents', true, 'Typo tolerance via string distance');
testMatch('deadline', 'award_amount', false, 'Completely different attributes must not match');

// 2. Test that synonyms do NOT produce a false gap
const dummySources: IngestedSource[] = [
  {
    id: 'src-1',
    url: 'https://official.gov.in/rules',
    domain: 'official.gov.in',
    title: 'Official Portal',
    text: 'Last date to apply is 15 March 2026.',
    rawHtml: '...',
    cleanText: 'Last date to apply is 15 March 2026.',
    wordCount: 10,
    status: 'ready',
    detectedDate: '2026-03-15',
    detectedCycle: '2026-27',
    isUndated: false,
    isStale: false,
    isOfficialDomain: true
  },
  {
    id: 'src-2',
    url: 'https://news.edu/post',
    domain: 'news.edu',
    title: 'Education News',
    text: 'Deadline is 30 April 2026.',
    rawHtml: '...',
    cleanText: 'Deadline is 30 April 2026.',
    wordCount: 10,
    status: 'ready',
    detectedDate: '2026-04-30',
    detectedCycle: '2026-27',
    isUndated: false,
    isStale: false,
    isOfficialDomain: false
  }
];

const claimsWithSynonyms: ExtractedClaim[] = [
  {
    id: 'c1',
    source_id: 'src-1',
    source_title: 'Official Portal',
    source_domain: 'official.gov.in',
    attribute: canonicalizeAttribute('last_date'),
    original_attribute: 'last_date',
    value: '15 March 2026',
    quote: 'Last date to apply is 15 March 2026.',
    verified: true
  },
  {
    id: 'c2',
    source_id: 'src-2',
    source_title: 'Education News',
    source_domain: 'news.edu',
    attribute: canonicalizeAttribute('deadline'),
    original_attribute: 'deadline',
    value: '30 April 2026',
    quote: 'Deadline is 30 April 2026.',
    verified: true
  }
];

// Expected attribute is 'application_deadline'
const gaps = detectGaps(['application_deadline', 'award_amount'], claimsWithSynonyms, 2);
const deadlineGap = gaps.find(g => g.attribute === 'application_deadline');
const awardGap = gaps.find(g => g.attribute === 'award_amount');

try {
  // 'application_deadline' has 2 matching claims (via last_date and deadline), so it must NOT be a total gap or thin coverage
  assert.strictEqual(deadlineGap, undefined, 'application_deadline should NOT be flagged as a gap');
  console.log('✅ [Gap Prevention] Synonym claims ("last_date" & "deadline") successfully prevented false gap for "application_deadline"');
  passed++;
} catch (err: any) {
  console.log(`❌ [FAILED Gap Prevention] ${err.message}`);
  failed++;
}

try {
  // 'award_amount' has 0 claims, so it must be a total gap
  assert.strictEqual(awardGap?.type, 'total_gap', 'award_amount should be a total gap');
  console.log('✅ [True Gap Detection] Missing attribute "award_amount" properly identified as total gap');
  passed++;
} catch (err: any) {
  console.log(`❌ [FAILED True Gap Detection] ${err.message}`);
  failed++;
}

// 3. Test that synonyms across different sources DO produce a conflict when values conflict
const conflicts = detectConflicts(claimsWithSynonyms, dummySources);

try {
  assert.strictEqual(conflicts.length, 1, 'Expected 1 conflict across synonym attributes with conflicting values');
  const conf = conflicts[0];
  assert.strictEqual(conf.sourceA.original_attribute, 'last_date', 'Preserved original label "last_date" on sourceA');
  assert.strictEqual(conf.sourceB.original_attribute, 'deadline', 'Preserved original label "deadline" on sourceB');
  assert.ok(conf.description.includes('termed "last_date"'), 'Description explicitly mentions sourceA original term');
  console.log('✅ [Cross-Synonym Conflict] Conflict correctly detected across "last_date" and "deadline" with original labels intact!');
  passed++;
} catch (err: any) {
  console.log(`❌ [FAILED Cross-Synonym Conflict] ${err.message}`);
  failed++;
}

console.log(`\nResults: ${passed} passed, ${failed} failed`);
if (failed > 0) {
  process.exit(1);
} else {
  console.log('🍉 All Attribute Matching tests passed!\n');
}
