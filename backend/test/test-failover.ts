import assert from 'assert';
import { LLMManager } from '../src/llm/index.js';

console.log('\n🍉 ========================================================');
console.log('       DIGITAL DARK SPOT — PART D: MOCK FAILOVER TEST      ');
console.log('========================================================\n');

async function runFailoverSuite() {
  let passedTests = 0;

  // TEST 1: Rotate from bad key 1 to good key 2
  console.log('--- Test 1: Rotate from Bad Key 1 to Good Key 2 ---');
  try {
    const manager = new LLMManager();
    (manager as any).providerOrder = ['gemini'];

    let key1Attempts = 0;
    let key2Attempts = 0;

    (manager as any).adapters.set('gemini', {
      provider: 'gemini',
      async complete(key: string) {
        if (key === 'bad-key-1') {
          key1Attempts++;
          const err: any = new Error('Gemini API error (401): API key invalid');
          err.status = 401;
          throw err;
        }
        if (key === 'good-key-2') {
          key2Attempts++;
          return JSON.stringify({ status: 'ok', keyUsed: 'good-key-2' });
        }
        throw new Error('Unknown key');
      }
    });

    // Configure 2 keys for Gemini
    (manager as any).keyStates.set('gemini', [
      {
        key: 'bad-key-1',
        maskedKey: 'bad-...y-1',
        disabled: false,
        cooldownUntil: null,
        failureCount: 0
      },
      {
        key: 'good-key-2',
        maskedKey: 'good...y-2',
        disabled: false,
        cooldownUntil: null,
        failureCount: 0
      }
    ]);

    const res = await manager.complete({
      system: 'Test system',
      user: 'Test user'
    });

    assert.strictEqual(key1Attempts, 1, 'Bad key 1 should have been attempted once');
    assert.strictEqual(key2Attempts, 1, 'Good key 2 should have been attempted once');
    assert.strictEqual(res.data.keyUsed, 'good-key-2', 'Result data should reflect good key');

    const keyStates = (manager as any).keyStates.get('gemini');
    assert.strictEqual(keyStates[0].disabled, true, 'Bad key 1 should now be permanently disabled for session');
    assert.strictEqual(keyStates[1].disabled, false, 'Good key 2 should remain active');

    console.log('✅ Test 1 PASS: Bad key 1 was rejected (401, disabled) and rotated seamlessly to good key 2.');
    passedTests++;
  } catch (err: any) {
    console.error('❌ Test 1 FAIL:', err.message);
  }

  // TEST 2: Cooldown for 60s after 2 invalid JSON responses
  console.log('\n--- Test 2: Cooldown for 60s After 2 Invalid JSON Responses ---');
  try {
    const manager = new LLMManager();
    (manager as any).providerOrder = ['gemini', 'groq'];

    let geminiAttempts = 0;
    let groqAttempts = 0;

    // Gemini returns non-JSON text twice
    (manager as any).adapters.set('gemini', {
      provider: 'gemini',
      async complete() {
        geminiAttempts++;
        return 'Not valid JSON: Here is the analysis in plain English without braces.';
      }
    });

    // Groq returns valid JSON
    (manager as any).adapters.set('groq', {
      provider: 'groq',
      async complete() {
        groqAttempts++;
        return JSON.stringify({ verified: true, source: 'groq-fallback' });
      }
    });

    // Setup 1 key each
    (manager as any).keyStates.set('gemini', [
      {
        key: 'gemini-key-1',
        maskedKey: 'gemi...y-1',
        disabled: false,
        cooldownUntil: null,
        failureCount: 0
      }
    ]);

    (manager as any).keyStates.set('groq', [
      {
        key: 'groq-key-1',
        maskedKey: 'groq...y-1',
        disabled: false,
        cooldownUntil: null,
        failureCount: 0
      }
    ]);

    const res = await manager.complete({
      system: 'Test system',
      user: 'Test user'
    });

    // Gemini should have been attempted at least 2 times before failing over to Groq
    assert.ok(geminiAttempts >= 2, 'Gemini should be attempted on primary and fallback on invalid JSON');
    assert.strictEqual(groqAttempts, 1, 'Groq should have been called as fallback');
    assert.strictEqual(res.provider, 'groq', 'Fallback should resolve to groq');
    assert.strictEqual(res.data.verified, true, 'Result data should be from groq');

    const geminiKey = (manager as any).keyStates.get('gemini')[0];
    const now = Date.now();
    assert(geminiKey.cooldownUntil && geminiKey.cooldownUntil > now, 'Gemini key should be placed in cooldown');
    const remainingSeconds = Math.round((geminiKey.cooldownUntil - now) / 1000);
    assert(remainingSeconds >= 55 && remainingSeconds <= 305, `Cooldown should be active (got ${remainingSeconds}s)`);

    console.log(`✅ Test 2 PASS: 2 consecutive invalid JSON responses triggered cooldown (${remainingSeconds}s set) and immediate failover to Groq.`);
    passedTests++;
  } catch (err: any) {
    console.error('❌ Test 2 FAIL:', err.message);
  }

  // TEST 3: Failover on 503 across providers and models
  console.log('\n--- Test 3: Failover on 503 across providers & fallback model ---');
  try {
    const manager = new LLMManager();
    (manager as any).providerOrder = ['groq', 'gemini'];
    (manager as any).geminiFallbackModel = 'gemini-2.5-flash';

    let groqAttempts = 0;
    let geminiPrimaryAttempts = 0;
    let geminiFallbackAttempts = 0;

    (manager as any).adapters.set('groq', {
      provider: 'groq',
      async complete() {
        groqAttempts++;
        const err: any = new Error('Groq 503 Service Unavailable');
        err.status = 503;
        throw err;
      }
    });

    (manager as any).adapters.set('gemini', {
      provider: 'gemini',
      async complete(key: string, model: string) {
        if (model === 'gemini-3-flash-preview') {
          geminiPrimaryAttempts++;
          const err: any = new Error('Gemini 503 Overloaded');
          err.status = 503;
          throw err;
        }
        if (model === 'gemini-2.5-flash') {
          geminiFallbackAttempts++;
          return JSON.stringify({ verified: true, modelUsed: 'gemini-2.5-flash' });
        }
        throw new Error(`Unexpected model: ${model}`);
      }
    });

    (manager as any).keyStates.set('groq', [{
      key: 'groq-k', maskedKey: 'groq...k', disabled: false, cooldownUntil: null, failureCount: 0
    }]);
    (manager as any).keyStates.set('gemini', [{
      key: 'gem-k', maskedKey: 'gem...k', disabled: false, cooldownUntil: null, failureCount: 0
    }]);

    const res = await manager.complete({
      system: 'Test system',
      user: 'Test user'
    });

    assert.strictEqual(groqAttempts, 1, 'Groq should fail once on 503');
    assert.strictEqual(geminiPrimaryAttempts, 1, 'Gemini primary should fail once on 503');
    assert.strictEqual(geminiFallbackAttempts, 1, 'Gemini fallback model should succeed');
    assert.strictEqual(res.model, 'gemini-2.5-flash');

    console.log('✅ Test 3 PASS: 503 correctly failed over from Groq -> Gemini primary -> Gemini fallback model.');
    passedTests++;
  } catch (err: any) {
    console.error('❌ Test 3 FAIL:', err.message);
  }

  // TEST 4: Failover on 413 Payload Too Large across providers
  console.log('\n--- Test 4: Failover on 413 Payload Too Large across providers ---');
  try {
    const manager = new LLMManager();
    (manager as any).providerOrder = ['groq', 'gemini'];

    let groq413Attempts = 0;
    let geminiSuccessAttempts = 0;

    (manager as any).adapters.set('groq', {
      provider: 'groq',
      async complete() {
        groq413Attempts++;
        const err: any = new Error('Groq 413 Payload Too Large (Rate limit on tokens per minute)');
        err.status = 413;
        throw err;
      }
    });

    (manager as any).adapters.set('gemini', {
      provider: 'gemini',
      async complete() {
        geminiSuccessAttempts++;
        return JSON.stringify({ verified: true, provider: 'gemini' });
      }
    });

    (manager as any).keyStates.set('groq', [{
      key: 'groq-k', maskedKey: 'groq...k', disabled: false, cooldownUntil: null, failureCount: 0
    }]);
    (manager as any).keyStates.set('gemini', [{
      key: 'gem-k', maskedKey: 'gem...k', disabled: false, cooldownUntil: null, failureCount: 0
    }]);

    const res = await manager.complete({
      system: 'Test system',
      user: 'Test user'
    });

    assert.strictEqual(groq413Attempts, 1, 'Groq 413 should fail over immediately');
    assert.strictEqual(geminiSuccessAttempts, 1, 'Gemini should succeed on failover');
    assert.strictEqual(res.provider, 'gemini');

    console.log('✅ Test 4 PASS: 413 correctly failed over immediately to next provider.');
    passedTests++;
  } catch (err: any) {
    console.error('❌ Test 4 FAIL:', err.message);
  }

  console.log(`\n========================================================`);
  console.log(`FAILOVER SUITE RESULT: ${passedTests}/4 PASSED`);
  console.log(`========================================================\n`);

  if (passedTests !== 4) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runFailoverSuite();

