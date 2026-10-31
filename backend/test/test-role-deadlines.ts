import assert from 'assert';
import {
  canonicalizeAttribute,
  areAttributesMatching
} from '../src/analysis/canonicalization.js';
import { detectConflicts } from '../src/analysis/conflicts.js';
import { ExtractedClaim } from '../src/analysis/types.js';
import { IngestedSource } from '../src/ingestion/types.js';

console.log('\n🍉 ========================================================');
console.log('       TEST F: ROLE-SPECIFIC DEADLINES CONFLICT CHECK       ');
console.log('========================================================\n');

// 1. Verify that role-specific deadlines do NOT match each other
const studentVsInstitute = areAttributesMatching('application_deadline_student', 'institute_verification_deadline');
const instituteVsVerifier = areAttributesMatching('institute_verification_deadline', 'verifier_level_1_deadline');
const studentVsVerifier = areAttributesMatching('student_submission_deadline', 'state_verification_deadline');

assert.strictEqual(studentVsInstitute, false, 'Student deadline must NOT match institute deadline');
assert.strictEqual(instituteVsVerifier, false, 'Institute deadline must NOT match verifier deadline');
assert.strictEqual(studentVsVerifier, false, 'Student deadline must NOT match state verifier deadline');

console.log('✅ Role-specific attribute matching checks passed:');
console.log('   - application_deadline_student vs institute_verification_deadline: false');
console.log('   - institute_verification_deadline vs verifier_level_1_deadline: false');
console.log('   - student_submission_deadline vs state_verification_deadline: false');

// 2. Verify that two sources mentioning different role deadlines do NOT trigger a conflict
const sources: IngestedSource[] = [
  {
    id: 'src-role-a',
    type: 'text',
    domain: 'scholarships.gov.in',
    title: 'NSP Official Gazette Notice 2026-27',
    rawText: 'Student application deadline is 31 October 2026. Institute verification deadline is 15 November 2026.',
    cleanedText: 'Student application deadline is 31 October 2026. Institute verification deadline is 15 November 2026.',
    wordCount: 15,
    detectedDate: '2026-01-12',
    detectedCycle: '2026-27',
    isStale: false,
    isUndated: false,
    status: 'ready',
    fetchedAt: new Date().toISOString()
  },
  {
    id: 'src-role-b',
    type: 'text',
    domain: 'state-highered.gov.in',
    title: 'State Nodal Verification Advisory',
    rawText: 'District verifier level 1 deadline is 30 November 2026.',
    cleanedText: 'District verifier level 1 deadline is 30 November 2026.',
    wordCount: 10,
    detectedDate: '2026-01-15',
    detectedCycle: '2026-27',
    isStale: false,
    isUndated: false,
    status: 'ready',
    fetchedAt: new Date().toISOString()
  }
];

const claims: ExtractedClaim[] = [
  {
    id: 'c-student',
    source_id: 'src-role-a',
    source_title: 'NSP Official Gazette Notice 2026-27',
    source_domain: 'scholarships.gov.in',
    attribute: canonicalizeAttribute('application_deadline_student'),
    original_attribute: 'application_deadline_student',
    value: '31 October 2026',
    quote: 'Student application deadline is 31 October 2026',
    verified: true
  },
  {
    id: 'c-institute',
    source_id: 'src-role-a',
    source_title: 'NSP Official Gazette Notice 2026-27',
    source_domain: 'scholarships.gov.in',
    attribute: canonicalizeAttribute('institute_verification_deadline'),
    original_attribute: 'institute_verification_deadline',
    value: '15 November 2026',
    quote: 'Institute verification deadline is 15 November 2026',
    verified: true
  },
  {
    id: 'c-verifier',
    source_id: 'src-role-b',
    source_title: 'State Nodal Verification Advisory',
    source_domain: 'state-highered.gov.in',
    attribute: canonicalizeAttribute('verifier_level_1_deadline'),
    original_attribute: 'verifier_level_1_deadline',
    value: '30 November 2026',
    quote: 'District verifier level 1 deadline is 30 November 2026',
    verified: true
  }
];

const conflicts = detectConflicts(claims, sources);

assert.strictEqual(conflicts.length, 0, `Expected 0 conflicts across role-specific deadlines, found ${conflicts.length}`);

console.log('✅ Conflict check passed: 0 false conflicts detected between student, institute, and verifier deadlines.');
console.log('\n🍉 Test F (Role-Specific Deadlines) PASSED with 100% accuracy!\n');

