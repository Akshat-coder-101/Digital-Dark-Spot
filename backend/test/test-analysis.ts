import { detectGaps } from '../src/analysis/gaps.js';
import { detectConflicts } from '../src/analysis/conflicts.js';
import { auditFreshness } from '../src/analysis/freshness.js';
import { buildCoverageMatrix } from '../src/analysis/matrix.js';
import { buildPrioritizedChecklist } from '../src/analysis/checklist.js';
import { IngestedSource } from '../ingestion/types.js';
import { ExtractedClaim } from '../src/analysis/types.js';

async function runAnalysisTests() {
  console.log('\n🍉 ========================================================');
  console.log('       DIGITAL DARK SPOT — DETERMINISTIC ANALYSIS TESTS    ');
  console.log('========================================================\n');

  const expectedAttributes = [
    'application_deadline',
    'eligibility_income_limit',
    'renewal_conditions',
    'required_documents',
    'official_portal_link'
  ];

  const mockSources: IngestedSource[] = [
    {
      id: 'src-1',
      type: 'text',
      domain: 'ministry.gov.example',
      title: 'Current Gazette 2026',
      rawText: 'Notice: Income ceiling is $50,000. Apply by 15 April 2026.',
      cleanedText: 'Notice: Income ceiling is $50,000. Apply by 15 April 2026.',
      wordCount: 10,
      detectedDate: '15 April 2026',
      detectedCycle: '2026-27',
      isStale: false,
      isUndated: false,
      status: 'ready',
      fetchedAt: new Date().toISOString()
    },
    {
      id: 'src-2',
      type: 'text',
      domain: 'studentadvice.org',
      title: 'Aid Forum 2024-25 Cycle',
      rawText: 'Income limit was listed as $40,000 in past cycle.',
      cleanedText: 'Income limit was listed as $40,000 in past cycle.',
      wordCount: 9,
      detectedDate: null,
      detectedCycle: '2024-25',
      isStale: true,
      isUndated: false,
      status: 'ready',
      fetchedAt: new Date().toISOString()
    },
    {
      id: 'src-3',
      type: 'text',
      domain: 'anonymous-tips.net',
      title: 'Undated Tips Blog',
      rawText: 'Always submit tax returns and identity proofs.',
      cleanedText: 'Always submit tax returns and identity proofs.',
      wordCount: 7,
      detectedDate: null,
      detectedCycle: null,
      isStale: false,
      isUndated: true,
      status: 'ready',
      fetchedAt: new Date().toISOString()
    }
  ];

  const verifiedClaims: ExtractedClaim[] = [
    {
      id: 'clm-1',
      source_id: 'src-1',
      source_title: 'Current Gazette 2026',
      source_domain: 'ministry.gov.example',
      attribute: 'application_deadline',
      value: '15 April 2026',
      quote: 'Apply by 15 April 2026',
      verified: true
    },
    {
      id: 'clm-2',
      source_id: 'src-1',
      source_title: 'Current Gazette 2026',
      source_domain: 'ministry.gov.example',
      attribute: 'eligibility_income_limit',
      value: '$50,000',
      quote: 'Income ceiling is $50,000',
      verified: true
    },
    {
      id: 'clm-3',
      source_id: 'src-2',
      source_title: 'Aid Forum 2024-25 Cycle',
      source_domain: 'studentadvice.org',
      attribute: 'eligibility_income_limit',
      value: '$40,000 in past cycle',
      quote: 'Income limit was listed as $40,000 in past cycle',
      verified: true
    },
    {
      id: 'clm-4',
      source_id: 'src-3',
      source_title: 'Undated Tips Blog',
      source_domain: 'anonymous-tips.net',
      attribute: 'required_documents',
      value: 'Tax returns and identity proofs',
      quote: 'submit tax returns and identity proofs',
      verified: true
    }
  ];

  // 1. Test Gap Detection
  console.log('--- 1. Testing Gap Detection ---');
  const gaps = detectGaps(expectedAttributes, verifiedClaims, mockSources.length);

  // 'renewal_conditions' and 'official_portal_link' have 0 claims -> total_gap
  // 'application_deadline' and 'required_documents' have 1 claim across 3 sources -> thin_coverage
  const totalGaps = gaps.filter(g => g.type === 'total_gap');
  const thinGaps = gaps.filter(g => g.type === 'thin_coverage');

  console.log(` • Total Gaps: ${totalGaps.length}`);
  console.log(` • Thin Coverage: ${thinGaps.length}`);

  if (totalGaps.some(g => g.attribute === 'renewal_conditions') && totalGaps.some(g => g.attribute === 'official_portal_link')) {
    console.log('✅ Correctly identified unmentioned attributes as total information gaps.');
  } else {
    console.error('❌ Failed to detect total gaps properly');
    process.exit(1);
  }

  // 2. Test Conflict Detection
  console.log('\n--- 2. Testing Conflict Detection ---');
  const conflicts = detectConflicts(verifiedClaims, mockSources);
  console.log(` • Conflicts Found: ${conflicts.length}`);

  if (conflicts.length === 1 && conflicts[0].attribute === 'eligibility_income_limit') {
    const c = conflicts[0];
    console.log(`✅ Contradiction detected: ${c.title}`);
    console.log(`   Source A (${c.sourceA.source_title}): "${c.sourceA.value}"`);
    console.log(`   Source B (${c.sourceB.source_title}): "${c.sourceB.value}"`);
  } else {
    console.error('❌ Expected exactly 1 conflict for eligibility_income_limit');
    process.exit(1);
  }

  // 3. Test Freshness Audit
  console.log('\n--- 3. Testing Freshness & Temporal Audit ---');
  const freshness = auditFreshness(mockSources);
  console.log(` • Freshness Warnings: ${freshness.length}`);

  const undatedWarning = freshness.find(f => f.warningType === 'undated');
  const cycleWarning = freshness.find(f => f.warningType === 'earlier_cycle');

  if (undatedWarning && cycleWarning) {
    console.log(`✅ Undated source flagged: ${undatedWarning.source_title}`);
    console.log(`✅ Earlier cycle flagged: ${cycleWarning.source_title} (${cycleWarning.detectedCycle})`);
  } else {
    console.error('❌ Failed freshness audit checks');
    process.exit(1);
  }

  // 4. Test Coverage Matrix
  console.log('\n--- 4. Testing Coverage Matrix Construction ---');
  const matrix = buildCoverageMatrix(expectedAttributes, mockSources, verifiedClaims, conflicts);

  if (matrix.length === expectedAttributes.length) {
    console.log(`✅ Coverage Matrix generated with ${matrix.length} attribute rows × ${mockSources.length} sources.`);
  } else {
    console.error(`❌ Matrix row count mismatch`);
    process.exit(1);
  }

  const incomeRow = matrix.find(r => r.attribute === 'eligibility_income_limit');
  if (incomeRow?.overallStatus === 'conflict' && incomeRow.cells['src-1']?.status === 'conflict') {
    console.log('✅ Matrix cell status correctly flagged as "conflict" for conflicting income parameter.');
  } else {
    console.error('❌ Matrix conflict cell status incorrect');
    process.exit(1);
  }

  // 5. Test Prioritized Checklist
  console.log('\n--- 5. Testing Prioritized Checklist ---');
  const checklist = buildPrioritizedChecklist(gaps, conflicts, freshness, ['Is GPA required?']);
  console.log(` • Checklist Items Generated: ${checklist.length}`);

  const highPriority = checklist.filter(c => c.priority === 'High');
  const medPriority = checklist.filter(c => c.priority === 'Medium');

  if (highPriority.length > 0 && medPriority.length > 0) {
    console.log(`✅ Prioritization verified: ${highPriority.length} High, ${medPriority.length} Medium.`);
    console.log(`   Sample High Item: [${highPriority[0].signalTag}] ${highPriority[0].title}`);
    console.log(`   Suggested Source: ${highPriority[0].suggestedOfficialSource}`);
  } else {
    console.error('❌ Checklist prioritization failed');
    process.exit(1);
  }

  console.log('\n🍉 Deterministic Analysis Test Suite completed successfully!\n');
}

runAnalysisTests().catch(err => {
  console.error('Analysis test failed:', err);
  process.exit(1);
});

