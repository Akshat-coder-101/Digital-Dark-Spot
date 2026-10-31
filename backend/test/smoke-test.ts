import assert from 'assert';
import http from 'http';

process.env.NODE_ENV = 'test';

const { app } = await import('../src/index.js');

console.log('\n🍉 ========================================================');
console.log('       DIGITAL DARK SPOT — PHASE 9 SMOKE TEST SUITE        ');
console.log('========================================================\n');

function invokeRoute(
  method: string,
  url: string,
  bodyData?: any
): Promise<{ status: number; body: any }> {
  return new Promise((resolve) => {
    const req = new http.IncomingMessage(null as any);
    req.method = method;
    req.url = url;
    req.headers = {
      'content-type': 'application/json',
      host: 'localhost'
    };

    let statusCode = 200;
    const res = new http.ServerResponse(req);

    (res as any).status = function (code: number) {
      statusCode = code;
      return res;
    };

    (res as any).json = function (jsonObj: any) {
      resolve({ status: statusCode, body: jsonObj });
      return res;
    };

    (res as any).send = function (content: any) {
      try {
        resolve({ status: statusCode, body: typeof content === 'string' ? JSON.parse(content) : content });
      } catch {
        resolve({ status: statusCode, body: content });
      }
      return res;
    };

    if (bodyData) {
      (req as any).body = bodyData;
    }

    app.handle(req as any, res as any);
  });
}

// Banned domain vocabulary outside sample data
const BANNED_VOCABULARY = [
  'scholarship',
  'eligibility',
  'renewal',
  'marksheet',
  'income limit',
  'award amount',
  'subsidy',
  'laptop',
  'nsp'
];

function checkBannedVocabulary(text: string, context: string): void {
  const lower = text.toLowerCase();
  for (const word of BANNED_VOCABULARY) {
    const regex = new RegExp(`\\b${word}\\b`, 'i');
    assert.strictEqual(
      regex.test(lower),
      false,
      `Banned domain word "${word}" found in non-sample response (${context})`
    );
  }
}

// 1. GET /api/health
console.log('▶ Step 1: GET /api/health');
const healthRes = await invokeRoute('GET', '/api/health');
assert.strictEqual(healthRes.status, 200);
assert.strictEqual(healthRes.body.status, 'ok');
console.log('  ✓ /api/health OK');

// 2. GET /api/sample
console.log('▶ Step 2: GET /api/sample');
const sampleRes = await invokeRoute('GET', '/api/sample');
assert.strictEqual(sampleRes.status, 200);
assert.ok(sampleRes.body && sampleRes.body.report, 'Must return full report');
assert.ok(sampleRes.body.report.id, 'Must return report ID');
console.log(`  ✓ /api/sample OK (Report ID: ${sampleRes.body.report.id})`);

// 3. GET /api/report/:id (from sample)
console.log('▶ Step 3: GET /api/report/:id');
const reportId = sampleRes.body.report.id;
const reportRes = await invokeRoute('GET', `/api/report/${encodeURIComponent(reportId)}`);
assert.strictEqual(reportRes.status, 200);
const report = reportRes.body.report || reportRes.body;
assert.ok(report && report.id === reportId);
assert.ok(Array.isArray(report.claims), 'Claims array must be present');
assert.ok(Array.isArray(report.gaps), 'Gaps array must be present');
assert.ok(Array.isArray(report.conflicts), 'Conflicts array must be present');
console.log('  ✓ /api/report/:id OK');

// 4. POST /api/discover with non-scholarship prompt
console.log('▶ Step 4: POST /api/discover ("heat pump subsidies in France 2026")');
const discoverPrompt = 'heat pump subsidies in France 2026';
const discoverRes = await invokeRoute('POST', '/api/discover', { question: discoverPrompt });
assert.strictEqual(discoverRes.status, 200);
assert.ok(discoverRes.body.discoveryId, 'Must return discoveryId');
assert.strictEqual(discoverRes.body.status, 'started');
console.log(`  ✓ POST /api/discover OK (Discovery ID: ${discoverRes.body.discoveryId})`);

// 5. GET /api/discover/:id
console.log('▶ Step 5: GET /api/discover/:id');
const pollRes = await invokeRoute('GET', `/api/discover/${discoverRes.body.discoveryId}`);
assert.strictEqual(pollRes.status, 200);
assert.ok(pollRes.body.job, 'Must return job status');
console.log(`  ✓ GET /api/discover/:id OK (Job Status: ${pollRes.body.job.status})`);

// 6. Assert no domain vocabulary leaked into non-sample responses
const nonSampleJson = JSON.stringify({
  health: healthRes.body,
  discover: discoverRes.body,
  discoverJob: pollRes.body
});
checkBannedVocabulary(nonSampleJson, 'discovery and health responses');
console.log('  ✓ Zero banned vocabulary in non-sample responses verified');

console.log('\n✅ Phase 9 Smoke Test completed with 100% success!\n');
