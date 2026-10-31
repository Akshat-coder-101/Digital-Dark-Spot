import assert from 'assert';
import http from 'http';

process.env.NODE_ENV = 'test';

const { app } = await import('../src/index.js');

console.log('\n🍉 ========================================================');
console.log('       DIGITAL DARK SPOT — HTTP ROUTE TEST SUITE           ');
console.log('========================================================\n');

let passed = 0;
let failed = 0;

function invokeRoute(
  method: string,
  url: string,
  bodyData?: any
): Promise<{ status: number; body: any }> {
  return new Promise((resolve, reject) => {
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

    (res as any).end = function (chunk?: any) {
      if (chunk) {
        try {
          resolve({ status: statusCode, body: JSON.parse(chunk.toString()) });
        } catch {
          resolve({ status: statusCode, body: chunk.toString() });
        }
      }
      return res;
    };

    // If bodyData provided, simulate incoming readable stream
    if (bodyData) {
      (req as any).body = bodyData;
    }

    try {
      (app as any).handle(req, res);
    } catch (err) {
      reject(err);
    }
  });
}

function runTest(name: string, fn: () => Promise<void>) {
  return async () => {
    try {
      await fn();
      console.log(`✅ [PASS] ${name}`);
      passed++;
    } catch (err: any) {
      console.log(`❌ [FAIL] ${name}: ${err.message}`);
      failed++;
    }
  };
}

async function main() {
  const tests = [
    runTest('GET /api/health: Returns 200 OK with status and timestamp', async () => {
      const res = await invokeRoute('GET', '/api/health');
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.status, 'ok');
      assert.strictEqual(res.body.app, 'Digital Dark Spot');
    }),

    runTest('GET /api/sample: Returns default Scenario A sample dataset', async () => {
      const res = await invokeRoute('GET', '/api/sample');
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.isSample, true);
      assert(Array.isArray(res.body.sources));
      assert(res.body.report && res.body.report.id);
    }),

    runTest('GET /api/sample/scenario-b-solarbridge: Returns Clean Energy scenario', async () => {
      const res = await invokeRoute('GET', '/api/sample/scenario-b-solarbridge');
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.scenarioId, 'scenario-b-solarbridge');
      assert(res.body.sources.length >= 2);
    }),

    runTest('GET /api/sample/scenario-c-nimbus-air: Returns Hardware Benchmark scenario', async () => {
      const res = await invokeRoute('GET', '/api/sample/scenario-c-nimbus-air');
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.scenarioId, 'scenario-c-nimbus-air');
      assert(res.body.sources.length >= 2);
    }),

    runTest('GET /api/report/:id: Returns 404 for nonexistent report', async () => {
      const res = await invokeRoute('GET', '/api/report/nonexistent-report-xyz');
      assert.strictEqual(res.status, 404);
    }),

    runTest('GET /api/llm/status: Disabled when SHOW_AI_STATUS is not true (returns { available: false })', async () => {
      delete process.env.SHOW_AI_STATUS;
      const res = await invokeRoute('GET', '/api/llm/status');
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.available, false);
    }),

    runTest('GET /api/snapshots: Returns { available: false } when docs/demo-snapshots is empty', async () => {
      const res = await invokeRoute('GET', '/api/snapshots');
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.available, false);
      assert.strictEqual(res.body.count, 0);
    }),

    runTest('POST /api/discover: Starts automated discovery job', async () => {
      const res = await invokeRoute('POST', '/api/discover', { question: 'Renewable energy rooftop guidelines' });
      assert.strictEqual(res.status, 200);
      assert(res.body.discoveryId);
      assert.strictEqual(res.body.status, 'started');
    }),

    runTest('GET /api/discover/:id: Polls discovery job progress', async () => {
      const startRes = await invokeRoute('POST', '/api/discover', { question: 'Test inquiry' });
      const { discoveryId } = startRes.body;

      const pollRes = await invokeRoute('GET', `/api/discover/${discoveryId}`);
      assert.strictEqual(pollRes.status, 200);
      assert(pollRes.body.job);
      assert.strictEqual(pollRes.body.job.id, discoveryId);
    })
  ];

  for (const test of tests) {
    await test();
  }

  console.log(`\nRoute Test Results: ${passed} passed, ${failed} failed`);
  if (failed > 0) {
    process.exit(1);
  } else {
    console.log('🍉 All HTTP Route tests passed cleanly!\n');
    process.exit(0);
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
