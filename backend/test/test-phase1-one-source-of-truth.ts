import { computeParameterStatuses } from '../src/analysis/parameterStatus.js';
import { detectGaps } from '../src/analysis/gaps.js';
import { buildCoverageMatrix } from '../src/analysis/matrix.js';
import { buildPrioritizedChecklist } from '../src/analysis/checklist.js';
import { IngestedSource } from '../src/ingestion/types.js';
import { ExtractedClaim, PossibleConflict } from '../src/analysis/types.js';

async function runPhase1Tests() {
  console.log('\n============================================================');
  console.log('    PHASE 1: ONE SOURCE OF TRUTH VERIFICATION TEST         ');
  console.log('============================================================\n');

  const sources: IngestedSource[] = [
    {
      id: 'src-1',
      type: 'url',
      url: 'https://specs.example.com',
      domain: 'specs.example.com',
      title: 'Manufacturer Spec Sheet',
      rawText: 'Text',
      cleanedText: 'Text',
      wordCount: 500,
      textCharacterCount: 2500,
      claimsExtracted: 2,
      claimsDiscarded: 0,
      usefulnessStatus: 'READY',
      credibilityHint: 'institutional',
      detectedDate: '2026-01-15',
      detectedCycle: '2026',
      isStale: false,
      isUndated: false,
      status: 'ready',
      sourceType: 'real',
      fetchedAt: new Date().toISOString()
    },
    {
      id: 'src-2',
      type: 'url',
      url: 'https://review.example.com',
      domain: 'review.example.com',
      title: 'Independent Review',
      rawText: 'Text',
      cleanedText: 'Text',
      wordCount: 800,
      textCharacterCount: 4000,
      claimsExtracted: 2,
      claimsDiscarded: 0,
      usefulnessStatus: 'READY',
      credibilityHint: 'general',
      detectedDate: '2026-02-10',
      detectedCycle: '2026',
      isStale: false,
      isUndated: false,
      status: 'ready',
      sourceType: 'real',
      fetchedAt: new Date().toISOString()
    }
  ];

  const expectedParameters = [
    'power_limit',
    'vram_capacity',
    'cooling_design',
    'warranty_period'
  ];

  const claims: ExtractedClaim[] = [
    // power_limit: only 1 source (single source)
    {
      id: 'claim-1',
      source_id: 'src-1',
      source_title: 'Manufacturer Spec Sheet',
      source_domain: 'specs.example.com',
      attribute: 'power_limit',
      value: '115W TGP',
      quote: 'configured at a full 115W TGP',
      subject: 'Hardware Model A',
      confidence: 1.0,
      isVerified: true
    },
    // vram_capacity: 2 sources with conflict
    {
      id: 'claim-2',
      source_id: 'src-1',
      source_title: 'Manufacturer Spec Sheet',
      source_domain: 'specs.example.com',
      attribute: 'vram_capacity',
      value: '8GB GDDR7',
      quote: 'equipped with 8GB GDDR7 memory',
      subject: 'Hardware Model A',
      confidence: 1.0,
      isVerified: true
    },
    {
      id: 'claim-3',
      source_id: 'src-2',
      source_title: 'Independent Review',
      source_domain: 'review.example.com',
      attribute: 'vram_capacity',
      value: '6GB GDDR7',
      quote: 'includes 6GB GDDR7 memory buffer',
      subject: 'Hardware Model A',
      confidence: 1.0,
      isVerified: true
    },
    // cooling_design: 2 sources agreeing
    {
      id: 'claim-4',
      source_id: 'src-1',
      source_title: 'Manufacturer Spec Sheet',
      source_domain: 'specs.example.com',
      attribute: 'cooling_design',
      value: 'Dual-fan vapor chamber',
      quote: 'features a dual-fan vapor chamber',
      subject: 'Hardware Model A',
      confidence: 1.0,
      isVerified: true
    },
    {
      id: 'claim-5',
      source_id: 'src-2',
      source_title: 'Independent Review',
      source_domain: 'review.example.com',
      attribute: 'cooling_design',
      value: 'Dual-fan vapor chamber',
      quote: 'utilizes dual-fan vapor chamber cooling',
      subject: 'Hardware Model A',
      confidence: 1.0,
      isVerified: true
    }
    // warranty_period: 0 claims (total gap)
  ];

  const conflicts: PossibleConflict[] = [
    {
      id: 'conflict-1',
      attribute: 'vram_capacity',
      normalizedParam: 'vram_capacity',
      subject: 'Hardware Model A',
      sourceA: {
        source_id: 'src-1',
        source_title: 'Manufacturer Spec Sheet',
        source_domain: 'specs.example.com',
        value: '8GB GDDR7',
        quote: 'equipped with 8GB GDDR7 memory'
      },
      sourceB: {
        source_id: 'src-2',
        source_title: 'Independent Review',
        source_domain: 'review.example.com',
        value: '6GB GDDR7',
        quote: 'includes 6GB GDDR7 memory buffer'
      },
      statusLabel: 'Discrepancy',
      signalTag: 'Sourced'
    }
  ];

  // 1. Compute single source of truth
  const statuses = computeParameterStatuses(
    expectedParameters,
    claims,
    conflicts,
    [],
    sources
  );

  console.log('--- Computed Parameter Statuses ---');
  for (const s of statuses) {
    console.log(` • [${s.status.toUpperCase()}] ${s.parameter} (claims: ${s.claims.length}, sources: ${s.sourcesCount}) -> "${s.keyValue}"`);
  }

  // TEST INVARIANT 1: A parameter with >=1 claim can NEVER be Gap
  for (const s of statuses) {
    if (s.claims.length > 0 && s.status === 'gap') {
      throw new Error(`TEST FAILED: Parameter ${s.parameter} has ${s.claims.length} claims but was assigned status 'gap'!`);
    }
  }
  console.log('✅ PASS: Invariant verified: parameters with claims can never be Gap.');

  // TEST INVARIANT 2: Check expected statuses
  const pPower = statuses.find(s => s.parameter === 'power_limit')!;
  const pVram = statuses.find(s => s.parameter === 'vram_capacity')!;
  const pCooling = statuses.find(s => s.parameter === 'cooling_design')!;
  const pWarranty = statuses.find(s => s.parameter === 'warranty_period')!;

  if (pPower.status !== 'single_source') {
    throw new Error(`Expected power_limit to be single_source, got ${pPower.status}`);
  }
  if (pVram.status !== 'conflict') {
    throw new Error(`Expected vram_capacity to be conflict, got ${pVram.status}`);
  }
  if (pCooling.status !== 'found') {
    throw new Error(`Expected cooling_design to be found, got ${pCooling.status}`);
  }
  if (pWarranty.status !== 'gap') {
    throw new Error(`Expected warranty_period to be gap, got ${pWarranty.status}`);
  }
  console.log('✅ PASS: All 4 parameter status types classified correctly.');

  // TEST INVARIANT 3: Coverage Matrix agrees 100% with ParameterStatus
  const matrix = buildCoverageMatrix(expectedParameters, sources, claims, conflicts, statuses);
  for (const row of matrix) {
    const s = statuses.find(st => st.parameter === row.attribute)!;
    if (s.status === 'gap' && row.overallStatus !== 'gap') {
      throw new Error(`Matrix mismatch for ${row.attribute}: status is ${s.status} but matrix has ${row.overallStatus}`);
    }
    if (s.status !== 'gap' && row.overallStatus === 'gap') {
      throw new Error(`Matrix false gap for ${row.attribute}: status is ${s.status} but matrix has gap!`);
    }
  }
  console.log('✅ PASS: Coverage Matrix 100% agrees with single status object.');

  // TEST INVARIANT 4: Gaps list contains ONLY true gaps
  const gaps = detectGaps(expectedParameters, claims, sources.length, undefined, statuses);
  if (gaps.length !== 1 || gaps[0].attribute !== 'warranty_period') {
    throw new Error(`Expected exactly 1 gap (warranty_period), got ${gaps.length}: ${gaps.map(g => g.attribute).join(', ')}`);
  }
  console.log('✅ PASS: Gaps list contains ONLY true gaps (0 false gaps).');

  // TEST INVARIANT 5: Checklist builds high priority items from real gaps only
  const checklist = buildPrioritizedChecklist(gaps, conflicts, [], [], statuses);
  const highGapItems = checklist.filter(c => c.priority === 'High' && c.title.startsWith('Find a source for:'));
  if (highGapItems.length !== 1 || highGapItems[0].relatedAttribute !== 'warranty_period') {
    throw new Error(`Checklist has false gap items: ${JSON.stringify(highGapItems)}`);
  }
  const singleSourceItems = checklist.filter(c => c.priority === 'Medium' && c.relatedAttribute === 'power_limit');
  if (singleSourceItems.length !== 1) {
    throw new Error(`Expected single-source checklist item for power_limit, got: ${JSON.stringify(singleSourceItems)}`);
  }
  console.log('✅ PASS: Checklist rebuilt cleanly from single status object without false gaps.');

  console.log('\n🎉 ALL PHASE 1 TESTS PASSED CLEANLY!\n');
}

runPhase1Tests().catch(err => {
  console.error('❌ Phase 1 test error:', err);
  process.exit(1);
});

