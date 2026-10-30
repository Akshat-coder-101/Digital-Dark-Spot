import assert from 'assert';
import { detectTemporalMetadata } from '../src/ingestion/metadata.js';

console.log('\n🍉 ========================================================');
console.log('       DIGITAL DARK SPOT — TEMPORAL EXTRACTION TESTS       ');
console.log('========================================================\n');

let passed = 0;
let failed = 0;

function testCycle(text: string, expectedCycle: string, desc: string) {
  try {
    const res = detectTemporalMetadata(text);
    assert.strictEqual(res.detectedCycle, expectedCycle, `Expected cycle "${expectedCycle}" but got "${res.detectedCycle}"`);
    console.log(`✅ [Cycle] ${desc}: "${res.detectedCycle}"`);
    passed++;
  } catch (err: any) {
    console.log(`❌ [FAILED Cycle] ${desc}: text="${text}" -> ${err.message}`);
    failed++;
  }
}

function testDate(text: string, expectedDate: string, desc: string) {
  try {
    const res = detectTemporalMetadata(text);
    assert.strictEqual(res.detectedDate, expectedDate, `Expected date "${expectedDate}" but got "${res.detectedDate}"`);
    console.log(`✅ [Date] ${desc}: "${res.detectedDate}"`);
    passed++;
  } catch (err: any) {
    console.log(`❌ [FAILED Date] ${desc}: text="${text}" -> ${err.message}`);
    failed++;
  }
}

// 1. Academic Years & Cycles
testCycle('Applications are invited for AY 2025-26 under the scheme.', '2025-26', 'AY 2025-26 prefix');
testCycle('Budget allocation for FY 24-25 has been approved.', '2024-25', 'FY 24-25 prefix with 2-digit years');
testCycle('Admissions open for session 2025-2026 starting autumn.', '2025-26', 'Session 2025-2026');
testCycle('Eligible criteria for 2024/25 applicants.', '2024-25', '2024/25 with slash');
testCycle('Schedule for 2025-2026 grant cycle.', '2025-26', '2025-2026 generic 4-digit span');

// 2. Date Formats
testDate('Last updated on 15th March 2026 by administration.', '15 March 2026', 'Ordinal natural date "15th March 2026"');
testDate('Notice published on March 15, 2026 for all students.', '15 March 2026', 'Month-first date "March 15, 2026"');
testDate('Circular issued 2026-03-15 in New Delhi.', '2026-03-15', 'ISO format "2026-03-15"');
testDate('Deadline is 15/03/2026 at 5:00 PM IST.', '15/03/2026', 'Slash format DD/MM/YYYY');
testDate('Please submit before 03/15/2026.', '15/03/2026', 'Slash format MM/DD/YYYY');

// 3. Undated & Stale Checks
const staleRes = detectTemporalMetadata('Circular issued for FY 23-24 on 10 January 2024.');
assert.strictEqual(staleRes.isStale, true, 'FY 23-24 should be marked as stale');
console.log('✅ [Staleness] Historical cycle 2023-24 marked as stale');
passed++;

const undatedRes = detectTemporalMetadata('General scholarship terms without any dates or years mentioned.');
assert.strictEqual(undatedRes.isUndated, true, 'Undated text should have isUndated=true');
console.log('✅ [Undated] Text without temporal signals marked as undated');
passed++;

console.log(`\nResults: ${passed} passed, ${failed} failed`);
if (failed > 0) {
  process.exit(1);
} else {
  console.log('🍉 All Temporal Extraction tests passed!\n');
}
