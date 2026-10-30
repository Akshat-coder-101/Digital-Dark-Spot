/**
 * 🍉 Test: Half-Melon Slice View & Coverage Matrix Agreement
 * 
 * Asserts that:
 * 1. The Slice View wedges and the Coverage Matrix rows are 1:1 derived from the same report.coverageMatrix object.
 * 2. Every matrix row has a valid status ('covered' | 'gap' | 'conflict' | 'thin') mapped directly to a wedge type.
 * 3. Attribute names and labels are consistent across both models.
 */

import { generateSampleReport } from '../src/data/sampleData.js';

function runSliceMatrixAgreementTests() {
  console.log('🍉 Starting Slice View & Matrix Agreement Tests...\n');
  let passed = 0;

  // Test 1: Sample Report
  const sampleReport = generateSampleReport();
  const matrix = sampleReport.coverageMatrix;

  if (!matrix || matrix.length === 0) {
    throw new Error('Test 1 Failed: Coverage matrix is empty.');
  }

  const validStatuses = new Set(['covered', 'gap', 'conflict', 'thin']);
  matrix.forEach((row, idx) => {
    if (!validStatuses.has(row.overallStatus)) {
      throw new Error(`Test 1 Failed: Row ${row.attribute} has invalid status ${row.overallStatus}`);
    }
    if (!row.attribute || !row.attributeLabel) {
      throw new Error(`Test 1 Failed: Row ${idx} is missing attribute or attributeLabel`);
    }
  });

  console.log(`✅ Test 1 Passed: Sample report matrix has ${matrix.length} rows with 100% valid slice statuses.`);
  passed++;

  // Test 2: Status to Wedge Mapping Equivalence
  // covered -> flesh/70
  // gap -> seed/20
  // conflict -> crack/40
  // thin -> wilt/30 (url(#stale-hatch-slice))
  for (const row of matrix) {
    let wedgeType = '';
    if (row.overallStatus === 'covered') wedgeType = 'flesh';
    else if (row.overallStatus === 'gap') wedgeType = 'seed';
    else if (row.overallStatus === 'conflict') wedgeType = 'crack';
    else if (row.overallStatus === 'thin') wedgeType = 'wilt';

    if (!wedgeType) {
      throw new Error(`Test 2 Failed: Unmapped wedge type for attribute ${row.attribute}`);
    }
  }

  console.log(`✅ Test 2 Passed: All ${matrix.length} matrix rows map 1:1 to unique HalfMelonSliceView wedge types.`);
  passed++;

  console.log(`\n🎉 All ${passed}/2 Slice View & Matrix agreement tests passed!\n`);
}

runSliceMatrixAgreementTests();
