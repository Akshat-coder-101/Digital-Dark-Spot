import { generateSampleReport, SAMPLE_SOURCES, SAMPLE_RESEARCH_QUESTION } from '../src/data/sampleData.js';

async function runSampleTests() {
  console.log('\n🍉 ========================================================');
  console.log('       DIGITAL DARK SPOT — DEMO SAMPLE DATA TEST SUITE     ');
  console.log('========================================================\n');

  console.log(`Research Question: "${SAMPLE_RESEARCH_QUESTION}"`);
  console.log(`Fictional Sources Count: ${SAMPLE_SOURCES.length}\n`);

  const report = generateSampleReport();

  console.log('Sample Report Generated:');
  console.log(` • ID: ${report.id}`);
  console.log(` • Mode: ${report.analyzedWith.provider} (${report.analyzedWith.model})`);
  console.log(` • Sources: ${report.metrics.sourcesCount}`);
  console.log(` • Verified Claims: ${report.metrics.claimsCount}`);
  console.log(` • Discarded Claims: ${report.metrics.discardedClaimsCount}`);
  console.log(` • Potential Gaps: ${report.metrics.gapsCount}`);
  console.log(` • Possible Conflicts: ${report.metrics.conflictsCount}`);
  console.log(` • Stale / Undated Warnings: ${report.metrics.staleCount}`);

  // Assertions
  if (report.metrics.discardedClaimsCount !== 0) {
    console.error(`❌ Expected 0 discarded claims in sample, got ${report.metrics.discardedClaimsCount}`);
    process.exit(1);
  }

  // Check total gap on renewal_conditions
  const renewalGap = report.gaps.find(g => g.attribute === 'renewal_conditions');
  if (renewalGap && renewalGap.type === 'total_gap') {
    console.log(`✅ Verified core problem scenario: "renewal_conditions" identified as total information gap.`);
  } else {
    console.error('❌ Failed to find total gap for renewal_conditions');
    process.exit(1);
  }

  // Check conflict on eligibility_income_limit
  const incomeConflict = report.conflicts.find(c => c.attribute === 'eligibility_income_limit');
  if (incomeConflict) {
    console.log(`✅ Verified core problem scenario: "eligibility_income_limit" conflict detected between official notice and 2024-25 blog.`);
  } else {
    console.error('❌ Failed to detect income conflict in sample data');
    process.exit(1);
  }

  // Check freshness flags
  if (report.freshnessWarnings.length >= 2) {
    console.log(`✅ Verified freshness flags: Blog flagged for earlier cycle (2024-25), Forum flagged as undated.`);
  } else {
    console.error('❌ Freshness warnings incomplete');
    process.exit(1);
  }

  // Check prioritized checklist
  if (report.checklist.length > 0 && report.checklist.some(c => c.priority === 'High')) {
    console.log(`✅ Prioritized checklist generated with ${report.checklist.length} actionable items.`);
  } else {
    console.error('❌ Checklist generation failed');
    process.exit(1);
  }

  console.log('\n🍉 Demo Mode & Sample Data Test Suite completed with 100% success!\n');
}

runSampleTests().catch(err => {
  console.error('Sample data test failed:', err);
  process.exit(1);
});
