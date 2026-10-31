import assert from 'assert';
import { generateDiverseSearchQueries } from '../src/search/queryGenerator.js';
import { rankAndDedupeSearchResults } from '../src/search/ranker.js';
import { SearchResult } from '../src/search/types.js';
import { DiscoveryService } from '../src/search/discoveryService.js';
import { runSecondPassTargetedGapSearch } from '../src/search/secondPass.js';
import { FullAnalysisReport } from '../src/analysis/types.js';

console.log('\n🍉 ========================================================');
console.log('       DIGITAL DARK SPOT — PHASE 2 DISCOVERY TESTS         ');
console.log('========================================================\n');

let passed = 0;
let failed = 0;

function runTest(name: string, fn: () => Promise<void> | void) {
  try {
    const res = fn();
    if (res instanceof Promise) {
      return res.then(() => {
        console.log(`✅ [PASS] ${name}`);
        passed++;
      }).catch((err: any) => {
        console.log(`❌ [FAIL] ${name}: ${err.message}`);
        failed++;
      });
    } else {
      console.log(`✅ [PASS] ${name}`);
      passed++;
    }
  } catch (err: any) {
    console.log(`❌ [FAIL] ${name}: ${err.message}`);
    failed++;
  }
}

async function main() {
  // TEST 1: Topic-tailored queries for generic inquiries (no hardcoded scholarship queries)
  await runTest('Query Generator: Tailors queries to diverse non-scholarship domains', async () => {
    const q1 = 'Clean Hydrogen Production Credit 2026';
    const queries1 = await generateDiverseSearchQueries(q1);
    assert(queries1.length >= 4, 'Should generate at least 4 queries');
    assert(queries1.some(q => q.toLowerCase().includes('clean hydrogen')), 'Query must contain the actual topic');
    assert(!queries1.some(q => q.toLowerCase().includes('scholarship')), 'Must NOT contain scholarship for hydrogen');

    const q2 = 'Quantum Computing Research Fellowship 2026';
    const queries2 = await generateDiverseSearchQueries(q2);
    assert(queries2.some(q => q.toLowerCase().includes('quantum computing')), 'Query must contain quantum computing');
  });

  // TEST 2: Authoritative domain ranking & deduplication
  runTest('Search Ranker: Prioritizes authoritative institutional domains', () => {
    const mockResults: SearchResult[] = [
      {
        title: 'Random Blog Post',
        url: 'https://random-blog.example/page',
        domain: 'random-blog.example',
        snippet: 'General commentary...',
        score: 60
      },
      {
        title: 'Official Gazette Notification',
        url: 'https://energy.gov.in/gazette-2026',
        domain: 'energy.gov.in',
        snippet: 'Official ministry notification...',
        isOfficial: true,
        score: 70
      },
      {
        title: 'Duplicate Blog Link',
        url: 'https://random-blog.example/page',
        domain: 'random-blog.example',
        snippet: 'Duplicate url...',
        score: 55
      }
    ];

    const ranked = rankAndDedupeSearchResults(mockResults, 5);
    assert.strictEqual(ranked.length, 2, 'Duplicates must be removed');
    assert.strictEqual(ranked[0].domain, 'energy.gov.in', 'Official gov.in domain must rank first');
    assert.strictEqual(ranked[0].isOfficial, true);
  });

  // TEST 3: Graceful fallback when search provider has no keys
  await runTest('Discovery Service: Graceful no-search fallback without source fabrication', async () => {
    const discovery = new DiscoveryService();
    const job = await discovery.runDiscovery('disc-test-123', 'Autonomous Drone Safety Regulations 2026');

    assert.strictEqual(job.status, 'ready');
    assert.strictEqual(job.sourcesFound.length, 0, 'Must NOT fabricate fake sources when API keys are absent');
    assert(job.queriesGenerated.length >= 3, 'Must formulate investigative queries for user guidance');
    assert(job.message.toLowerCase().includes('not configured') || job.message.toLowerCase().includes('queries'), 'Friendly fallback message');
  });

  // TEST 4: Second pass targeted search for gaps
  await runTest('Second Pass: Formulates targeted probe without crashing when keys are absent', async () => {
    const mockReport: FullAnalysisReport = {
      id: 'rep-test-gap',
      question: 'Residential Solar Battery Guidelines',
      summary: 'Initial synthesis',
      analyzedWith: { provider: 'mock', model: 'test', cached: false },
      metrics: { sourcesCount: 1, gapsCount: 1, conflictsCount: 0, staleCount: 0, claimsCount: 1, discardedClaimsCount: 0 },
      expectedAttributes: ['battery_capacity', 'warranty_period'],
      sources: [{
        id: 's1', type: 'text', domain: 'solar.example', title: 'Solar Doc', rawText: 'capacity is 10 kWh', cleanedText: 'capacity is 10 kWh',
        wordCount: 10, textCharacterCount: 50, claimsExtracted: 1, claimsDiscarded: 0, usefulnessStatus: 'READY', credibilityHint: 'general',
        detectedDate: '2026-01-01', detectedCycle: null, isStale: false, isUndated: false, status: 'ready', fetchedAt: ''
      }],
      claims: [{
        id: 'c1', source_id: 's1', source_title: 'Solar Doc', source_domain: 'solar.example',
        attribute: 'battery_capacity', value: '10 kWh', quote: 'capacity is 10 kWh', verified: true
      }],
      gaps: [{
        id: 'gap-warranty_period', attribute: 'warranty_period', title: 'Potential gap: Warranty Period not found in the sources reviewed',
        description: 'Uncovered', type: 'total_gap', sourceCount: 0, supportingSourceIds: [], suggestedAction: 'Verify',
        statusLabel: 'Potential gap', signalTag: 'AI-suggested'
      }],
      conflicts: [],
      freshnessWarnings: [],
      coverageMatrix: [],
      checklist: [],
      openQuestions: [],
      createdAt: new Date().toISOString()
    };

    const updated = await runSecondPassTargetedGapSearch(mockReport);
    assert.strictEqual(updated.id, mockReport.id);
    assert.strictEqual(updated.gaps.length, 1);
  });

  console.log(`\nPhase 2 Test Results: ${passed} passed, ${failed} failed`);
  if (failed > 0) {
    process.exit(1);
  } else {
    console.log('🍉 All Phase 2 Discovery tests passed cleanly!\n');
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

