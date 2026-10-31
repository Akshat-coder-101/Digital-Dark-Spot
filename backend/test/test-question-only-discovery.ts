import 'dotenv/config';
import assert from 'assert';
import zlib from 'zlib';
import { stripTrackingParams, resolveRedirectUrl } from '../src/search/adapters/gemini.js';
import { extractTextFromPdfBuffer, processSource } from '../src/ingestion/fetcher.js';
import { searchManager } from '../src/search/manager.js';
import { discoveryService } from '../src/search/discoveryService.js';
import { analysisPipeline } from '../src/analysis/pipeline.js';
import { SearchResult } from '../src/search/types.js';

async function runQuestionOnlyDiscoveryTests() {
  console.log('\n🍉 ========================================================');
  console.log('    DIGITAL DARK SPOT — QUESTION-ONLY DISCOVERY SUITE      ');
  console.log('========================================================\n');

  // --- F1. Tracking Parameter Stripping Tests ---
  console.log('--- F1. Testing Tracking Parameter Stripping ---');
  const dirtyUrl = 'https://example.com/page?utm_source=twitter&utm_medium=cpc&fbclid=IwAR123&gclid=abc456&ref=hackernews&valid_param=123';
  const cleanUrl = stripTrackingParams(dirtyUrl);
  assert.ok(!cleanUrl.includes('utm_source'), 'Should strip utm_source');
  assert.ok(!cleanUrl.includes('fbclid'), 'Should strip fbclid');
  assert.ok(!cleanUrl.includes('gclid'), 'Should strip gclid');
  assert.ok(!cleanUrl.includes('ref='), 'Should strip ref');
  assert.ok(cleanUrl.includes('valid_param=123'), 'Should preserve legitimate query parameters');
  console.log('✅ Tracking parameters stripped cleanly while preserving legitimate parameters.');

  // --- F2. PDF Text Extraction Test ---
  console.log('\n--- F2. Testing In-Memory PDF Text Extraction ---');
  const streamContent = Buffer.from('BT /F1 12 Tf [(Official) 15 (Hardware) -5 (Specifications) 10 (2026)] TJ ET');
  const deflated = zlib.deflateSync(streamContent);
  const mockPdf = Buffer.concat([
    Buffer.from('%PDF-1.4\n1 0 obj\n<< /Length ' + deflated.length + ' /Filter /FlateDecode >>\nstream\n'),
    deflated,
    Buffer.from('\nendstream\nendobj\n%%EOF')
  ]);
  const extractedPdfText = extractTextFromPdfBuffer(mockPdf);
  assert.ok(extractedPdfText.includes('Official Hardware Specifications 2026'), `PDF extraction failed: "${extractedPdfText}"`);
  console.log(`✅ Extracted text from PDF stream: "${extractedPdfText}"`);

  // Save original search methods
  const originalSearch = searchManager.search.bind(searchManager);
  const originalHasAnyKeys = searchManager.hasAnyKeys.bind(searchManager);
  (searchManager as any).hasAnyKeys = () => true;

  // --- A. Laptop Question-Only Workflow ---
  console.log('\n--- A. Testing Scenario: RTX 5060 Laptop (Question-Only) ---');
  const laptopQuestion = 'What should I verify before buying an RTX 5060 laptop?';

  // Mock search provider returning 3 laptop sources
  (searchManager as any).search = async (query: string): Promise<SearchResult[]> => {
    return [
      {
        title: 'NVIDIA RTX 5060 Laptop GPU Specifications',
        url: 'https://hardware-specs.example.org/rtx-5060?utm_source=feed&gclid=999',
        snippet: 'The RTX 5060 mobile GPU features a maximum TGP of 115W, 8GB GDDR7 memory, and PCIe 5.0 support.',
        rawContent: 'The RTX 5060 mobile GPU features a maximum TGP of 115W, 8GB GDDR7 memory, and PCIe 5.0 support.',
        domain: 'hardware-specs.example.org',
        isOfficial: true,
        score: 95
      },
      {
        title: 'OEM Thermal and Power Limits Comparison',
        url: 'https://techbench.example.com/tgp-cooling-audit',
        snippet: 'Base TGP varies widely between 45W in thin designs and 115W in full gaming chassis. Check manufacturer TGP.',
        rawContent: 'Base TGP varies widely between 45W in thin designs and 115W in full gaming chassis. Check manufacturer TGP.',
        domain: 'techbench.example.com',
        isOfficial: false,
        score: 80
      }
    ];
  };

  const laptopJob = await discoveryService.runDiscovery('disc-test-laptop', laptopQuestion);
  assert.strictEqual(laptopJob.status, 'ready', 'Discovery job should be ready');
  assert.ok(laptopJob.sourcesFound.length >= 2, 'Should discover at least 2 sources');

  // Verify URL stripping in results
  for (const src of laptopJob.sourcesFound) {
    assert.ok(!src.url.includes('utm_source'), `Source URL contains utm_source: ${src.url}`);
    assert.ok(!src.url.includes('gclid'), `Source URL contains gclid: ${src.url}`);
  }
  console.log(`✅ Laptop discovery returned ${laptopJob.sourcesFound.length} reviewable sources with clean URLs.`);

  // --- B. Scholarship Question-Only Workflow ---
  console.log('\n--- B. Testing Scenario: Scholarship (Topic-Independent Workflow) ---');
  const scholarshipQuestion = 'What should a student verify before applying for a scholarship?';

  (searchManager as any).search = async (query: string): Promise<SearchResult[]> => {
    return [
      {
        title: 'National Fellowship Guidelines 2026-27',
        url: 'https://education.gov.in/fellowship-guidelines.pdf',
        snippet: 'Applications open on 15 September 2026. Annual family income threshold is 250000 rupees.',
        rawContent: 'Applications open on 15 September 2026. Annual family income threshold is 250000 rupees.',
        domain: 'education.gov.in',
        isOfficial: true,
        score: 98
      },
      {
        title: 'Student Advisory: Common Grant Disqualifications',
        url: 'https://studenthelp.org/grant-rules',
        snippet: 'Late submission of marksheets and missing domicile proof account for 65% of rejected applications.',
        rawContent: 'Late submission of marksheets and missing domicile proof account for 65% of rejected applications.',
        domain: 'studenthelp.org',
        isOfficial: false,
        score: 75
      }
    ];
  };

  const scholarshipJob = await discoveryService.runDiscovery('disc-test-scholarship', scholarshipQuestion);
  assert.strictEqual(scholarshipJob.status, 'ready');
  assert.ok(scholarshipJob.sourcesFound.length >= 2);
  console.log(`✅ Scholarship discovery returned ${scholarshipJob.sourcesFound.length} sources without domain-specific locks.`);

  // --- C. Rooftop Solar Question-Only Workflow ---
  console.log('\n--- C. Testing Scenario: Rooftop Solar Installation ---');
  const solarQuestion = 'What should a homeowner verify before installing rooftop solar?';

  (searchManager as any).search = async (query: string): Promise<SearchResult[]> => {
    return [
      {
        title: 'Clean Energy Grid Interconnection Rules',
        url: 'https://energy-commission.gov/rooftop-interconnect',
        snippet: 'Inverter capacity must not exceed 10kW for residential connections. Net metering requires bi-directional meter.',
        rawContent: 'Inverter capacity must not exceed 10kW for residential connections. Net metering requires bi-directional meter.',
        domain: 'energy-commission.gov',
        isOfficial: true,
        score: 96
      },
      {
        title: 'Solar Panel Warranty & Roof Structural Checklist',
        url: 'https://solarinsider.com/warranty-fine-print',
        snippet: 'Panel performance warranties promise 80% output after 25 years. Inverter warranties typically last 10 to 12 years.',
        rawContent: 'Panel performance warranties promise 80% output after 25 years. Inverter warranties typically last 10 to 12 years.',
        domain: 'solarinsider.com',
        isOfficial: false,
        score: 78
      }
    ];
  };

  const solarJob = await discoveryService.runDiscovery('disc-test-solar', solarQuestion);
  assert.strictEqual(solarJob.status, 'ready');
  assert.ok(solarJob.sourcesFound.length >= 2);
  console.log(`✅ Solar discovery returned ${solarJob.sourcesFound.length} sources with clean ranking.`);

  // --- D. Search Failure / Quota Exhaustion -> Phase 5 Honest Fallback ---
  console.log('\n--- D. Testing Search Quota Error -> Phase 5 Honest Fallback ---');
  (searchManager as any).search = async (): Promise<SearchResult[]> => {
    const quotaErr: any = new Error('429 Too Many Requests: You exceeded your current quota');
    quotaErr.status = 429;
    throw quotaErr;
  };

  const failedJob = await discoveryService.runDiscovery('disc-test-fallback-429', 'What should I verify before investing in commercial property?');
  assert.strictEqual(failedJob.status, 'ready', 'Job should remain ready and resilient');
  assert.strictEqual(failedJob.sourcesFound.length, 0, 'No sources should be fabricated');
  assert.ok(
    failedJob.message.includes('No sources reviewed. AI-suggested:') &&
    failedJob.message.includes('These are verification suggestions, not source-backed findings.') &&
    (failedJob.message.includes('Search quota reached') || failedJob.message.includes('no sources could be retrieved')),
    'Job message must match Phase 5 fallback text with specific plain-words failure reason'
  );
  console.log(`✅ Search failure gracefully produced zero fake sources and honest fallback message:`);
  console.log(`   "${failedJob.message}"`);

  // Now test pipeline execution with empty sources (Honest Fallback Report)
  const fallbackReport = await analysisPipeline.run(
    'job-honest-fallback-01',
    'What should I verify before investing in commercial property?',
    []
  );

  assert.strictEqual(fallbackReport.metrics.sourcesCount, 0, 'Report must have 0 sources reviewed');
  assert.strictEqual(fallbackReport.metrics.claimsCount, 0, 'Report must have 0 claims (no fabricated evidence)');
  assert.strictEqual(fallbackReport.metrics.conflictsCount, 0, 'Report must have 0 conflicts');
  assert.ok(fallbackReport.gaps.length > 0, 'Report should provide AI-suggested potential gaps');
  assert.ok(fallbackReport.checklist.length > 0, 'Report should provide AI-suggested checklist items');

  // Verify all gaps and checklist items are tagged "AI-suggested"
  for (const gap of fallbackReport.gaps) {
    assert.strictEqual(gap.signalTag, 'AI-suggested', 'Fallback gaps must be labeled AI-suggested');
    assert.strictEqual(gap.statusLabel, 'Potential gap');
  }
  for (const item of fallbackReport.checklist) {
    assert.strictEqual(item.signalTag, 'AI-suggested', 'Fallback checklist must be labeled AI-suggested');
  }
  assert.ok(
    fallbackReport.summary.includes('No sources reviewed. AI-suggested:') &&
    fallbackReport.summary.includes('These are verification suggestions, not source-backed findings.'),
    'Fallback report summary must contain honest disclaimer'
  );
  console.log('✅ Pipeline honest fallback report verified: 0 sources, 0 claims, 0 fake quotes, all items tagged "AI-suggested".');

  // --- E. Search Succeeds, Live Fetch Fails -> Limited Fallback ---
  console.log('\n--- E. Testing Source Fetch Failure with Supporting Snippet ---');
  const limitedSource = await processSource({
    type: 'url',
    value: 'https://example-blocked-site.com/specs',
    title: 'Blocked Site with Snippet',
    snippet: 'This is the verified supporting text snippet from the grounding metadata providing necessary facts.'
  }, 0);

  assert.strictEqual(limitedSource.status, 'ready', 'Should be ready via supporting snippet');
  assert.strictEqual(limitedSource.sourceType, 'limited', 'Should be marked as limited source');
  assert.strictEqual(limitedSource.isLimited, true);
  assert.ok(limitedSource.cleanedText.includes('verified supporting text snippet'), 'Cleaned text must match snippet');
  console.log('✅ Fetch failure with supporting snippet marked source as "limited" without fabricating text.');

  // Restore search manager
  (searchManager as any).search = originalSearch;
  (searchManager as any).hasAnyKeys = originalHasAnyKeys;

  console.log('\n========================================================');
  console.log('🎉 ALL QUESTION-ONLY WORKFLOW & FALLBACK TESTS PASSED!  ');
  console.log('========================================================\n');
}

runQuestionOnlyDiscoveryTests().catch((err) => {
  console.error('❌ Test failed with exception:', err);
  process.exit(1);
});
