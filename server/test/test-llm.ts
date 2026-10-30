import dotenv from 'dotenv';
import path from 'path';
import { LLMManager, ProviderName } from '../src/llm/index.js';

// Load .env
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });
dotenv.config();

async function runLLMTests() {
  console.log('\n🍉 ========================================================');
  console.log('       DIGITAL DARK SPOT — LLM LAYER TEST SUITE            ');
  console.log('========================================================\n');

  const manager = new LLMManager();
  const diagnostics = manager.getDiagnostics();

  console.log('Current Provider Diagnostics:');
  for (const d of diagnostics) {
    const status = d.enabled ? 'ENABLED' : 'DISABLED';
    console.log(` • [${status}] ${d.name} (${d.model}) — Keys: ${d.keyCount} (Active: ${d.activeKeyCount})`);
  }
  console.log('');

  const enabledProviders = diagnostics.filter(d => d.enabled);

  if (enabledProviders.length === 0) {
    console.log('⚠️  No active provider keys found in .env.');
    console.log('   The system will automatically offer offline sample data to users.');
    console.log('   Testing mock/failover unit logic instead...\n');
  }

  // 1. Test live completions for any enabled provider
  for (const prov of enabledProviders) {
    process.stdout.write(`Testing provider: ${prov.name}... `);
    try {
      const res = await manager.complete({
        system: 'You are a testing assistant. Return ONLY JSON matching { "status": "ok", "provider": string }',
        user: 'Return test status now.'
      });

      if (res.data?.status === 'ok') {
        console.log(`✅ OK (Analyzed with: ${res.provider}, model: ${res.model})`);
      } else {
        console.log(`❌ FAIL (Invalid response: ${JSON.stringify(res.data)})`);
      }
    } catch (err: any) {
      console.log(`❌ FAIL: ${err.message}`);
    }
  }

  // 2. Test failover logic using a deliberately bad first key
  console.log('\n--- Testing Multi-Key Failover (Deliberately Bad Key First) ---');

  // Create an isolated manager instance with simulated key states:
  // Key 1: "invalid-bad-key-xyz"
  // If no live keys, simulate adapter responses
  const testManager = new LLMManager();

  // Test cooldown / disabling logic directly
  const badKey = {
    key: 'invalid-test-key-12345678',
    maskedKey: 'inva...678',
    disabled: false,
    cooldownUntil: null,
    failureCount: 0
  };

  // Simulate 401 Unauthorized
  testManager.recordKeyError('openai', badKey, 401);
  if (badKey.disabled === true) {
    console.log('✅ Auth Error (401/403) correctly disables invalid key for session.');
  } else {
    console.error('❌ Fail: 401 did not disable key.');
    process.exit(1);
  }

  // Simulate 429 Rate Limit
  const rateLimitedKey = {
    key: 'ratelimited-key-12345678',
    maskedKey: 'rate...678',
    disabled: false,
    cooldownUntil: null,
    failureCount: 0
  };
  testManager.recordKeyError('gemini', rateLimitedKey, 429);
  const now = Date.now();
  if (rateLimitedKey.cooldownUntil && rateLimitedKey.cooldownUntil > now) {
    const diffSec = Math.round((rateLimitedKey.cooldownUntil - now) / 1000);
    console.log(`✅ Rate Limit (429/5xx) correctly initiates key cooldown (~${diffSec}s remaining).`);
  } else {
    console.error('❌ Fail: 429 did not place key in cooldown.');
    process.exit(1);
  }

  // Test no-keys error contract
  const emptyManager = new LLMManager();
  // Clear keys
  (emptyManager as any).keyStates.clear();
  try {
    await emptyManager.complete({
      system: 'test',
      user: 'test'
    });
    console.error('❌ Fail: empty manager did not throw NO_KEYS_AVAILABLE');
    process.exit(1);
  } catch (err: any) {
    if (err.message.includes('NO_KEYS_AVAILABLE') && err.message.includes('Use sample data')) {
      console.log('✅ Empty key check correctly rejects with sample data offer.');
    } else {
      console.error(`❌ Unexpected error message: ${err.message}`);
      process.exit(1);
    }
  }

  // Test multi-key failover in action with mock adapter
  console.log('\n--- Testing End-to-End Key Rotation & Failover ---');
  const failoverManager = new LLMManager();

  // Register a mock adapter on failoverManager that fails on key1 and succeeds on key2
  let key1Attempts = 0;
  let key2Attempts = 0;

  (failoverManager as any).adapters.set('gemini', {
    provider: 'gemini',
    async complete(key: string, model: string, options: any) {
      if (key === 'bad-key-1') {
        key1Attempts++;
        const err: any = new Error('Gemini API error (401): API key invalid');
        err.status = 401;
        throw err;
      }
      if (key === 'good-key-2') {
        key2Attempts++;
        return JSON.stringify({ status: 'ok', source: 'good-key-2' });
      }
      throw new Error('Unknown key');
    }
  });

  // Inject 2 keys into gemini
  (failoverManager as any).keyStates.set('gemini', [
    { key: 'bad-key-1', maskedKey: 'bad-...y-1', disabled: false, cooldownUntil: null, failureCount: 0 },
    { key: 'good-key-2', maskedKey: 'good...y-2', disabled: false, cooldownUntil: null, failureCount: 0 }
  ]);
  (failoverManager as any).providerOrder = ['gemini'];

  const failoverRes = await failoverManager.complete({
    system: 'Return JSON',
    user: 'test failover'
  });

  if (failoverRes.data?.status === 'ok' && failoverRes.data?.source === 'good-key-2') {
    console.log(`✅ Failover verified: Attempted key 1 (${key1Attempts}x, failed with 401 & disabled), rotated to key 2 (${key2Attempts}x, succeeded).`);
  } else {
    console.error('❌ Failover did not succeed with key 2');
    process.exit(1);
  }

  console.log('\n🍉 LLM Layer Test Suite completed successfully!\n');
}

runLLMTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
