import assert from 'assert';
import { processSource, classifyUrlFailure } from '../src/ingestion/fetcher.js';
import { analysisPipeline } from '../src/analysis/pipeline.js';
import { JobProgress } from '../src/analysis/types.js';

async function runFailingUrlTests() {
  console.log('\n🍉 ========================================================');
  console.log('       DIGITAL DARK SPOT — FAILING URL TEST SUITE          ');
  console.log('========================================================\n');

  // 1. Test URL Classification & Error Mapping
  console.log('--- 1. Testing URL Failure Classification ---');

  const invalidProt = classifyUrlFailure('ftp://example.com/data');
  assert.strictEqual(invalidProt, 'invalid URL', 'Protocol error should classify as "invalid URL"');

  const malformed = classifyUrlFailure('not_a_valid_url');
  assert.strictEqual(malformed, 'invalid URL', 'Malformed URL should classify as "invalid URL"');

  const localhost = classifyUrlFailure('http://localhost:3000', 'SSRF blocked: Access to localhost/internal addresses is strictly prohibited.');
  assert.strictEqual(localhost, 'private address', 'Localhost SSRF should classify as "private address"');

  const loopback = classifyUrlFailure('http://127.0.0.1:8080', 'SSRF blocked: IP 127.0.0.1 is private or loopback.');
  assert.strictEqual(loopback, 'private address', 'Loopback SSRF should classify as "private address"');

  const metaData = classifyUrlFailure('http://169.254.169.254', 'SSRF blocked: IP 169.254.169.254 is private or loopback.');
  assert.strictEqual(metaData, 'private address', 'Metadata SSRF should classify as "private address"');

  const dnsErr = classifyUrlFailure('https://unresolvable-domain-dds-xyz-test.org', 'DNS resolution failed');
  assert.strictEqual(dnsErr, 'blocked or timed out', 'Unresolvable domain should classify as "blocked or timed out"');

  console.log('✅ Classification tests passed: invalid URL, private address, and blocked or timed out.');

  // 2. Test Ingestion with Invalid URL
  console.log('\n--- 2. Testing Ingestion with Malformed URL ---');
  const invalidResult = await processSource({
    type: 'url',
    value: 'this-is-not-a-valid-url',
    title: 'Invalid URL Test'
  }, 0);

  assert.strictEqual(invalidResult.status, 'error');
  assert.strictEqual(invalidResult.usefulnessStatus, 'FAILED');
  assert.strictEqual(invalidResult.errorMessage, 'invalid URL');
  console.log(`✅ Invalid URL returned status "error" with plain reason: "${invalidResult.errorMessage}"`);

  // 3. Test Ingestion with Private Address (SSRF Target)
  console.log('\n--- 3. Testing Ingestion with Private Address (SSRF) ---');
  const privateResult = await processSource({
    type: 'url',
    value: 'http://127.0.0.1:9999/admin-panel',
    title: 'Private Loopback URL'
  }, 1);

  assert.strictEqual(privateResult.status, 'error');
  assert.strictEqual(privateResult.usefulnessStatus, 'FAILED');
  assert.strictEqual(privateResult.errorMessage, 'private address');
  console.log(`✅ Private address returned status "error" with plain reason: "${privateResult.errorMessage}"`);

  // 4. Test Ingestion with Mocked HTTP Failure (Blocked or Timed Out)
  console.log('\n--- 4. Testing Ingestion with Mocked HTTP 403 Forbidden ---');
  const originalFetch = global.fetch;
  const dnsModule = await import('dns/promises');
  const originalLookup = dnsModule.default.lookup;

  // Mock public DNS resolution so SSRF validation passes in sandboxed offline environment
  (dnsModule.default as any).lookup = async () => [{ address: '93.184.216.34', family: 4 }];

  // Mock fetch returning HTTP 403
  global.fetch = async () => {
    return {
      ok: false,
      status: 403,
      statusText: 'Forbidden'
    } as any;
  };

  try {
    const blockedResult = await processSource({
      type: 'url',
      value: 'https://example.com/protected-page',
      title: 'Protected Page'
    }, 2);

    assert.strictEqual(blockedResult.status, 'error');
    assert.strictEqual(blockedResult.usefulnessStatus, 'FAILED');
    assert.strictEqual(blockedResult.errorMessage, 'blocked or timed out');
    console.log(`✅ HTTP 403 returned status "error" with plain reason: "${blockedResult.errorMessage}"`);
  } finally {
    global.fetch = originalFetch;
    (dnsModule.default as any).lookup = originalLookup;
  }

  // 5. Test Ingestion with Mocked Empty / JavaScript-Only Page
  console.log('\n--- 5. Testing Ingestion with Mocked Empty / JavaScript-Only HTML ---');
  (dnsModule.default as any).lookup = async () => [{ address: '93.184.216.34', family: 4 }];
  global.fetch = async () => {
    return {
      ok: true,
      status: 200,
      statusText: 'OK',
      text: async () => '<html><head><title>SPA App</title></head><body><div id="root"></div></body></html>'
    } as any;
  };

  try {
    const emptyJsResult = await processSource({
      type: 'url',
      value: 'https://example.com/client-rendered-spa',
      title: 'SPA Blank Page'
    }, 3);

    assert.strictEqual(emptyJsResult.status, 'error');
    assert.strictEqual(emptyJsResult.usefulnessStatus, 'FAILED');
    assert.strictEqual(emptyJsResult.errorMessage, 'empty or JavaScript-only page');
    console.log(`✅ Blank SPA returned status "error" with plain reason: "${emptyJsResult.errorMessage}"`);
  } finally {
    global.fetch = originalFetch;
    (dnsModule.default as any).lookup = originalLookup;
  }

  // 6. Test Pipeline Rejection and Progress Reporting (Never Leave "Processing")
  console.log('\n--- 6. Testing Pipeline Ingestion Failure & Progress Chips ---');
  let lastProgress: JobProgress | null = null;
  const progressReports: JobProgress[] = [];

  try {
    await analysisPipeline.run(
      'job-failing-test-001',
      'What should I verify about this target?',
      [
        { type: 'url', value: 'http://127.0.0.1:8080/internal' },
        { type: 'url', value: 'not-a-valid-url' }
      ],
      false,
      (p) => {
        lastProgress = p;
        progressReports.push(p);
      }
    );
    assert.fail('Expected pipeline to throw when all sources fail');
  } catch (err: any) {
    const expectedErrorMsg = 'This site blocked automated access or took too long. Paste the page text instead.';
    assert.strictEqual(err.message, expectedErrorMsg, `Pipeline should throw sanitized message: "${expectedErrorMsg}"`);
    console.log(`✅ Pipeline threw sanitized error: "${err.message}"`);
  }

  assert.ok(lastProgress, 'Progress update should have been captured');
  const chips = (lastProgress as JobProgress).sourcesStatus;
  assert.strictEqual(chips.length, 2, 'Should have 2 source status chips');

  // Verify none are left as "pending" ("Processing")
  for (const chip of chips) {
    assert.notStrictEqual(chip.status, 'pending', `Chip "${chip.title}" was left in "pending" status!`);
    assert.strictEqual(chip.status, 'error', `Chip "${chip.title}" should have status "error" (Failed)`);
    assert.ok(chip.reason, `Chip "${chip.title}" must have a plain failure reason`);
  }

  assert.strictEqual(chips[0].reason, 'private address');
  assert.strictEqual(chips[1].reason, 'invalid URL');
  console.log('✅ Ingestion pipeline updated all failed sources to status "error" (Failed) with plain reasons:');
  chips.forEach((c, i) => console.log(`   Chip ${i + 1}: title="${c.title}", status="${c.status}", reason="${c.reason}"`));

  console.log('\n========================================================');
  console.log('🎉 ALL FAILING URL & ERROR SANITIZATION TESTS PASSED!   ');
  console.log('========================================================\n');
}

runFailingUrlTests().catch((err) => {
  console.error('❌ Test failed with exception:', err);
  process.exit(1);
});
