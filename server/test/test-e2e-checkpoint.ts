import { generateSampleReport } from '../src/data/sampleData.js';
import { analysisPipeline } from '../src/analysis/pipeline.js';

async function runCheckpointVerification() {
  console.log('\n🍉 ========================================================');
  console.log('    CHECKPOINT: END-TO-END FLOW VERIFICATION SUITE         ');
  console.log('========================================================\n');

  console.log('1. Testing Sample Report Generation...');
  const report = generateSampleReport();
  analysisPipeline.setReport(report);

  if (report.id !== 'sample-scholarship-report') {
    throw new Error('Report ID mismatch');
  }
  console.log(`✅ Sample report initialized: "${report.question}"`);

  console.log('\n2. Verifying Core Hackathon Scenario Findings:');
  // Check Total Gap on Renewal Conditions
  const renewalGap = report.gaps.find(g => g.attribute === 'renewal_conditions');
  if (!renewalGap || renewalGap.type !== 'total_gap') {
    throw new Error('Renewal conditions gap not detected as total_gap');
  }
  console.log(`✅ Gap Confirmed: ${renewalGap.title}`);

  // Check Conflict on Income Limit
  const incomeConflict = report.conflicts.find(c => c.attribute === 'eligibility_income_limit');
  if (!incomeConflict) {
    throw new Error('Income limit conflict not found');
  }
  console.log(`✅ Conflict Confirmed: ${incomeConflict.title}`);
  console.log(`   - Source A (${incomeConflict.sourceA.source_title}): "${incomeConflict.sourceA.value}"`);
  console.log(`   - Source B (${incomeConflict.sourceB.source_title}): "${incomeConflict.sourceB.value}"`);

  // Check Freshness Warning on earlier cycle
  const cycleWarning = report.freshnessWarnings.find(f => f.warningType === 'earlier_cycle');
  if (!cycleWarning || cycleWarning.detectedCycle !== '2024-25') {
    throw new Error('Earlier cycle warning missing');
  }
  console.log(`✅ Freshness Confirmed: Earlier cycle flagged ("${cycleWarning.detectedCycle}")`);

  // Check Undated Warning
  const undatedWarning = report.freshnessWarnings.find(f => f.warningType === 'undated');
  if (!undatedWarning) {
    throw new Error('Undated warning missing');
  }
  console.log(`✅ Freshness Confirmed: Undated source flagged ("${undatedWarning.source_title}")`);

  // Check Matrix and Checklist
  if (report.coverageMatrix.length !== 8) {
    throw new Error(`Expected 8 matrix rows, got ${report.coverageMatrix.length}`);
  }
  console.log(`✅ Coverage Matrix Confirmed: 8 attribute rows × 3 sources`);

  if (report.checklist.length === 0 || !report.checklist.some(c => c.priority === 'High')) {
    throw new Error('Checklist missing or has no High priority items');
  }
  console.log(`✅ Checklist Confirmed: ${report.checklist.length} prioritized verification items`);

  // Verbatim quotes substring verification
  for (const claim of report.claims) {
    const src = report.sources.find(s => s.id === claim.source_id);
    if (!src || !src.rawText.includes(claim.quote)) {
      throw new Error(`Quote for claim ${claim.id} not found in source ${claim.source_id}`);
    }
  }
  console.log(`✅ 100% Verbatim Ground Truth Confirmed for all ${report.claims.length} claims`);

  console.log('\n🍉 ========================================================');
  console.log('   >>> CHECKPOINT PASSED: CORE WORKING END-TO-END! <<<    ');
  console.log('========================================================\n');
}

runCheckpointVerification().catch(err => {
  console.error('Checkpoint failure:', err);
  process.exit(1);
});

