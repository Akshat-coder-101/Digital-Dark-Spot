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

    // Gemini should have been attempted 2 times (initial + 1 retry with strict reminder)
    assert.strictEqual(geminiAttempts, 2, 'Gemini should be attempted twice (initial + retry) on invalid JSON');
    assert.strictEqual(groqAttempts, 1, 'Groq should have been called as fallback');
    assert.strictEqual(res.provider, 'groq', 'Fallback should resolve to groq');
    assert.strictEqual(res.data.verified, true, 'Result data should be from groq');

    const geminiKey = (manager as any).keyStates.get('gemini')[0];
    const now = Date.now();
    assert(geminiKey.cooldownUntil && geminiKey.cooldownUntil > now, 'Gemini key should be placed in cooldown');
    const remainingSeconds = Math.round((geminiKey.cooldownUntil - now) / 1000);
    assert(remainingSeconds >= 55 && remainingSeconds <= 65, `Cooldown should be ~60 seconds (got ${remainingSeconds}s)`);

    console.log(`✅ Test 2 PASS: 2 consecutive invalid JSON responses triggered 60s cooldown (${remainingSeconds}s set) and immediate failover to Groq.`);
    passedTests++;
  } catch (err: any) {
    console.error('❌ Test 2 FAIL:', err.message);
  }

  console.log(`\n========================================================`);
  console.log(`FAILOVER SUITE RESULT: ${passedTests}/2 PASSED`);
  console.log(`========================================================\n`);

  if (passedTests !== 2) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runFailoverSuite();
