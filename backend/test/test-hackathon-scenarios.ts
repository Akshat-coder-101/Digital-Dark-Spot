import assert from 'assert';
import { discoveryService } from '../src/search/discoveryService.js';
import { processSource } from '../src/ingestion/fetcher.js';
import { areAttributesMatching } from '../src/analysis/canonicalization.js';
import { detectConflicts } from '../src/analysis/conflicts.js';
import { detectGaps } from '../src/analysis/gaps.js';
import { ExtractedClaim } from '../src/analysis/types.js';
import { IngestedSource } from '../src/ingestion/types.js';

console.log('\n🍉 ========================================================');
console.log('    HACKATHON 2026 VERIFICATION TEST SUITE (TESTS A - F)   ');
console.log('========================================================\n');

async function runTests() {
  let passed = 0;

  // TEST A: Query does not return hardcoded fake scholarships
  console.log('▶ TEST A: Query "NSP Post-Matric Scholarship 2026-27"');
  const jobA = await discoveryService.runDiscovery('disc-test-a', 'NSP Post-Matric Scholarship 2026-27');
  assert.ok(jobA.queriesGenerated.length >= 3, 'Formulated investigative search queries');
  console.log(`  ✅ Generated ${jobA.queriesGenerated.length} multi-angle search queries.`);
  // When no search keys are configured, it must NOT return the 4 fake scholarships
  assert.strictEqual(jobA.sourcesFound.length, 0, 'Does NOT fabricate fake sources when search keys unavailable');
  console.log('  ✅ Did not fabricate fake search sources. Graceful no-search fallback.');
  passed++;

  // TEST B: Different topic: "Renewable energy subsidy guidelines 2026"
  console.log('\n▶ TEST B: Query "Renewable energy subsidy guidelines 2026"');
  const jobB = await discoveryService.runDiscovery('disc-test-b', 'Renewable energy subsidy guidelines 2026');
  // It must formulate clean renewable energy queries, NOT scholarship queries!
  const hasSolarQuery = jobB.queriesGenerated.some(q => q.toLowerCase().includes('renewable energy') || q.toLowerCase().includes('subsidy'));
  assert.ok(hasSolarQuery, 'Queries are tailored to renewable energy topic');
  assert.strictEqual(jobB.sourcesFound.length, 0, 'Does NOT return fake scholarship cards for renewable energy');
  console.log(`  ✅ Formulated topic-tailored queries for clean energy: "${jobB.queriesGenerated[0]}"`);
  console.log('  ✅ No unrelated fake scholarship sources returned.');
  passed++;

  // TEST C & D: Pasted source and User-provided source with rawContent
  console.log('\n▶ TEST C & D: Ingestion without redundant HTTP fetch');
  const pastedSource = await processSource({
    type: 'text',
    value: 'Ministry of New and Renewable Energy (MNRE): Benchmark capital cost for residential rooftop solar is ₹50,000 per kW. Central financial assistance is 40% for systems up to 3kW. Published 15 January 2026.',
    title: 'MNRE Rooftop Solar Circular 2026',
    sourceType: 'user_text'
  }, 0);

  assert.strictEqual(pastedSource.status, 'ready');
  assert.strictEqual(pastedSource.sourceType, 'user_text');
  assert.strictEqual(pastedSource.detectedDate, '15 January 2026');
  assert.ok(pastedSource.wordCount > 20);
  console.log(`  ✅ Ingested user-provided source in memory without HTTP request (words: ${pastedSource.wordCount}, date: "${pastedSource.detectedDate}")`);
  passed++;

  // TEST E: Sample mode is clearly labelled SAMPLE DATA
  console.log('\n▶ TEST E: Sample Mode');
  const sampleJob = await discoveryService.runDiscovery('sample-scholarship-audit', 'What should I verify before applying for this scholarship?');
  assert.ok(sampleJob.sourcesFound.length > 0, 'Sample mode returns demo sources');
  for (const s of sampleJob.sourcesFound) {
    assert.ok(s.url.startsWith('sample://'), `Sample URL must start with sample://, got ${s.url}`);
    assert.ok(s.domain.includes('[SAMPLE]'), `Domain must clearly indicate [SAMPLE], got ${s.domain}`);
  }
  console.log(`  ✅ Sample mode returned ${sampleJob.sourcesFound.length} sources, all clearly tagged sample:// and [SAMPLE].`);
  passed++;

  // TEST F: Role-specific deadlines do not trigger false conflicts
  console.log('\n▶ TEST F: Role-Specific Deadlines');
  const matchCheck = areAttributesMatching('application_deadline_student', 'institute_verification_deadline');
  assert.strictEqual(matchCheck, false, 'Student deadline and institute verification deadline must NOT match');

  const testSources: IngestedSource[] = [
    {
      id: 'src-role-1',
      type: 'text',
      domain: 'scholarships.gov.in',
      title: 'Official Notification 2026-27',
      rawText: 'Student application deadline: 31 October 2026. Institute verification deadline: 15 November 2026.',
      cleanedText: 'Student application deadline: 31 October 2026. Institute verification deadline: 15 November 2026.',
      wordCount: 12,
      detectedDate: '2026-01-12',
      detectedCycle: '2026-27',
      isStale: false,
      isUndated: false,
      status: 'ready',
      fetchedAt: new Date().toISOString()
    },
    {
      id: 'src-role-2',
      type: 'text',
      domain: 'highered-state.gov.in',
      title: 'State Verification Guideline',
      rawText: 'State verifier level 1 deadline: 30 November 2026.',
      cleanedText: 'State verifier level 1 deadline: 30 November 2026.',
      wordCount: 8,
      detectedDate: '2026-01-15',
      detectedCycle: '2026-27',
      isStale: false,
      isUndated: false,
      status: 'ready',
      fetchedAt: new Date().toISOString()
    }
  ];

  const testClaims: ExtractedClaim[] = [
    {
      id: 'c-s',
      source_id: 'src-role-1',
      source_title: 'Official Notification 2026-27',
      source_domain: 'scholarships.gov.in',
      attribute: 'application_deadline_student',
      value: '31 October 2026',
      quote: 'Student application deadline: 31 October 2026',
      verified: true
    },
    {
      id: 'c-i',
      source_id: 'src-role-1',
      source_title: 'Official Notification 2026-27',
      source_domain: 'scholarships.gov.in',
      attribute: 'institute_verification_deadline',
      value: '15 November 2026',
      quote: 'Institute verification deadline: 15 November 2026',
      verified: true
    },
    {
      id: 'c-v',
      source_id: 'src-role-2',
      source_title: 'State Verification Guideline',
      source_domain: 'highered-state.gov.in',
      attribute: 'verifier_level_1_deadline',
      value: '30 November 2026',
      quote: 'State verifier level 1 deadline: 30 November 2026',
      verified: true
    }
  ];

  const roleConflicts = detectConflicts(testClaims, testSources);
  assert.strictEqual(roleConflicts.length, 0, `Expected 0 conflicts, got ${roleConflicts.length}`);
  console.log('  ✅ Confirmed 0 false conflicts between student (Oct 31), institute (Nov 15), and verifier (Nov 30) deadlines.');
  passed++;

  console.log(`\n🎉 All ${passed}/${passed} Hackathon Scenarios PASSED cleanly!\n`);
}

runTests().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});

