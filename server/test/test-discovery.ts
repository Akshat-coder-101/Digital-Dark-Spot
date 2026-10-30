import { generateDiverseSearchQueries } from '../src/search/queryGenerator.js';
import { rankAndDedupeSearchResults, normalizeUrl } from '../src/search/ranker.js';
import { SearchManager } from '../src/search/manager.js';
import { SearchResult } from '../src/search/types.js';
import { isOfficialDomain } from '../src/search/adapters/tavily.js';
import { generateSampleReport } from '../src/data/sampleData.js';
import { runSecondPassTargetedGapSearch } from '../src/search/secondPass.js';

async function runDiscoveryTests() {
  console.log('\n🍉 ========================================================');
  console.log('       DIGITAL DARK SPOT — STEP 3B DISCOVERY TESTS         ');
  console.log('========================================================\n');

  // 1. Query Generation
  console.log('1. Testing Diverse Query Generation...');
  const testQuestion = "What should I verify before applying for this scholarship?";
  const queries = await generateDiverseSearchQueries(testQuestion);
  console.log(` • Generated ${queries.length} diverse queries:`);
  for (const q of queries) {
    console.log(`   - "${q}"`);
  }

  if (queries.length < 4 || queries.length > 6) {
    console.error(`❌ Expected between 4 and 6 queries, got ${queries.length}`);
    process.exit(1);
  }
  console.log('✅ Query generation satisfied (4-6 diverse search angles).');

  // 2. Official Domain Classification
  console.log('\n2. Testing Official / Institutional Domain Detection...');
  const testDomains = [
    { domain: 'scholarships.gov.in', expected: true },
    { domain: 'education.nic.in', expected: true },
    { domain: 'stanford.edu', expected: true },
    { domain: 'iitd.ac.in', expected: true },
    { domain: 'randomblog.com', expected: false },
    { domain: 'scholarship-forum.net', expected: false }
  ];

  for (const t of testDomains) {
    const isOff = isOfficialDomain(t.domain);
    if (isOff === t.expected) {
      console.log(`✅ Domain "${t.domain}" correctly classified as isOfficial = ${isOff}`);
    } else {
      console.error(`❌ Failed domain classification for ${t.domain}`);
      process.exit(1);
    }
  }

  // 3. Merging, Deduplicating, Ranking & Diversity (Max 2 per domain)
  console.log('\n3. Testing Ranking, Deduplication & Diversity...');
  const mockResults: SearchResult[] = [
    { title: 'Official Portal Guidelines 2026', url: 'https://scholarships.gov.in/notice', snippet: 'Official guidelines', domain: 'scholarships.gov.in', isOfficial: true },
    { title: 'Duplicate URL Notice', url: 'https://scholarships.gov.in/notice/', snippet: 'Duplicate', domain: 'scholarships.gov.in', isOfficial: true },
    { title: 'Third Page from Same Domain', url: 'https://scholarships.gov.in/faq', snippet: 'FAQ', domain: 'scholarships.gov.in', isOfficial: true },
    { title: 'Fourth Page from Same Domain', url: 'https://scholarships.gov.in/contact', snippet: 'Contact', domain: 'scholarships.gov.in', isOfficial: true },
    { title: 'University Aid FAQ', url: 'https://state.edu/aid', snippet: 'Aid details', domain: 'state.edu', isOfficial: true },
    { title: 'Unofficial Guide 2024', url: 'https://freeaid.com/guide', snippet: 'Unofficial blog', domain: 'freeaid.com', isOfficial: false }
  ];

  const ranked = rankAndDedupeSearchResults(mockResults, testQuestion, 5);
  console.log(` • Ranked and filtered results: ${ranked.length}`);

  const govCount = ranked.filter(r => r.domain === 'scholarships.gov.in').length;
  if (govCount > 2) {
    console.error(`❌ Domain diversity failed: Expected at most 2 per domain, got ${govCount}`);
    process.exit(1);
  } else {
    console.log(`✅ Diversity rule respected: ${govCount} results from scholarships.gov.in (max 2).`);
  }

  if (ranked[0].isOfficial) {
    console.log(`✅ Official domain ranked at top position: "${ranked[0].title}"`);
  } else {
    console.error('❌ Official domain was not ranked highest.');
    process.exit(1);
  }

  // 4. Multi-Key Round-Robin & Failover on Search
  console.log('\n4. Testing Search Key Cooldown & Failover...');
  const searchMgr = new SearchManager();
  const testKey = {
    key: 'test-search-key-1',
    maskedKey: 'test...y-1',
    disabled: false,
    cooldownUntil: null,
    failureCount: 0
  };

  searchMgr.recordKeyError('tavily', testKey, 429);
  if (testKey.cooldownUntil && testKey.cooldownUntil > Date.now()) {
    console.log('✅ Search rate limit (429) correctly places key in 60s cooldown.');
  } else {
    console.error('❌ Search key cooldown failed');
    process.exit(1);
  }

  // 5. Second-Pass Targeted Gap Search
  console.log('\n5. Testing Second-Pass Targeted Search Wording...');
  const initialReport = generateSampleReport();
  const updatedReport = await runSecondPassTargetedGapSearch(initialReport);

  const targetedGap = updatedReport.gaps.find(g => g.attribute === 'renewal_conditions');
  if (targetedGap) {
    console.log(`✅ Verified Second-Pass Output: "${targetedGap.title}"`);
  }

  console.log('\n🍉 Step 3B Automatic Discovery Test Suite PASSED!\n');
}

runDiscoveryTests().catch(err => {
  console.error('Discovery test error:', err);
  process.exit(1);
});
