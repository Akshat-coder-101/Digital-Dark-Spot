import assert from 'assert';
import { normalizeValueForComparison, areValuesEquivalent } from '../src/analysis/conflicts.js';

console.log('\n🍉 ========================================================');
console.log('       DIGITAL DARK SPOT — VALUE NORMALIZATION TESTS       ');
console.log('========================================================\n');

let passed = 0;
let failed = 0;

function testEquivalent(val1: string, val2: string, description: string) {
  try {
    const isEq = areValuesEquivalent ? areValuesEquivalent(val1, val2) : (normalizeValueForComparison(val1) === normalizeValueForComparison(val2));
    assert.strictEqual(isEq, true, `Expected equivalent: "${val1}" vs "${val2}"`);
    console.log(`✅ [Equivalence] ${description}: "${val1}" === "${val2}"`);
    passed++;
  } catch (err: any) {
    console.log(`❌ [FAILED Equivalence] ${description}: "${val1}" vs "${val2}" -> ${err.message}`);
    failed++;
  }
}

function testConflict(val1: string, val2: string, description: string) {
  try {
    const isEq = areValuesEquivalent ? areValuesEquivalent(val1, val2) : (normalizeValueForComparison(val1) === normalizeValueForComparison(val2));
    assert.strictEqual(isEq, false, `Expected conflict: "${val1}" vs "${val2}"`);
    console.log(`✅ [Conflict] ${description}: "${val1}" !== "${val2}"`);
    passed++;
  } catch (err: any) {
    console.log(`❌ [FAILED Conflict] ${description}: "${val1}" vs "${val2}" -> ${err.message}`);
    failed++;
  }
}

// 1. Percentage Equivalences
testEquivalent('75%', '75 percent', 'Percentage symbol vs word');
testEquivalent('75 %', '75percent', 'Percentage spacing');

// 2. Currency & Number Equivalences
testEquivalent('Rs 6 lakh', 'INR 6,00,000', 'Indian currency lakh word vs standard INR');
testEquivalent('INR 6,00,000', '600000', 'INR formatted vs raw digits');
testEquivalent('Rs 6 lakh', '600000', 'Lakh word vs raw digits');
testEquivalent('$50,000', '$ 50000', 'Dollar symbol and comma');

// 3. Date Equivalences
testEquivalent('15 March 2026', '15/03/2026', 'Natural date vs DD/MM/YYYY');
testEquivalent('15 March 2026', '2026-03-15', 'Natural date vs ISO YYYY-MM-DD');
testEquivalent('15/03/2026', '2026-03-15', 'DD/MM/YYYY vs ISO');
testEquivalent('June 1', '1 June', 'Month Day vs Day Month');

// 4. Casing & Whitespace
testEquivalent('income certificate', 'Income Certificate', 'Case sensitivity');
testEquivalent('  official   transcript  ', 'Official Transcript', 'Whitespace & trim');

// 5. Document lists in different order
testEquivalent(
  'income certificate, transcripts, ID proof',
  'ID proof, income certificate, transcripts',
  'Comma-separated list reordering'
);
testEquivalent(
  'Transcripts; ID proof; Income Certificate',
  'Income Certificate, Transcripts, ID proof',
  'Semicolon vs comma list reordering'
);

// 6. Values that MUST conflict
testConflict('75%', '70%', 'Different percentage requirements');
testConflict('15 March 2026', '30 April 2026', 'Different deadline dates');
testConflict('$50,000', '$40,000', 'Different income limits');
testConflict('full tuition', 'half tuition', 'Different award coverage terms');

console.log(`\nResults: ${passed} passed, ${failed} failed`);
if (failed > 0) {
  process.exit(1);
} else {
  console.log('🍉 All Value Normalization tests passed!\n');
}
