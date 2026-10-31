import {
  ProviderName,
  KeyState,
  ProviderDiagnostic,
  LLMCompletionOptions,
  LLMResult,
  ProviderAdapter
} from './types.js';
import { geminiAdapter } from './adapters/gemini.js';
import { openaiAdapter } from './adapters/openai.js';
import { anthropicAdapter } from './adapters/anthropic.js';
import { groqAdapter } from './adapters/groq.js';
import { telemetry } from './telemetry.js';

export function maskKey(key: string): string {
  if (!key) return '';
  if (key.length <= 8) return '****';
  return `${key.slice(0, 4)}...${key.slice(-3)}`;
}

export function stripCodeFences(text: string): string {
  let cleaned = text.trim();
  // Remove markdown code fences ```json ... ``` or ``` ... ```
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```[a-zA-Z0-9_-]*\n?/, '');
    cleaned = cleaned.replace(/\n?```$/, '');
  }
  return cleaned.trim();
}

export class LLMManager {
  private adapters: Map<ProviderName, ProviderAdapter> = new Map();
  private keyStates: Map<ProviderName, KeyState[]> = new Map();
  private keyIndex: Map<ProviderName, number> = new Map();
  private models: Map<ProviderName, string> = new Map();
  private geminiFallbackModel: string = 'gemini-2.5-flash';
  private providerOrder: ProviderName[] = ['gemini', 'groq', 'openai', 'anthropic'];
  private consecutiveJsonFailures: Map<ProviderName, number> = new Map();

  constructor() {
    this.adapters.set('gemini', geminiAdapter);
    this.adapters.set('groq', groqAdapter);
    this.adapters.set('openai', openaiAdapter);
    this.adapters.set('anthropic', anthropicAdapter);

    this.reloadEnvironment();
  }

  public reloadEnvironment(): void {
    // Models
    this.models.set('gemini', process.env.GEMINI_MODEL || 'gemini-3-flash-preview');
    this.geminiFallbackModel = process.env.GEMINI_FALLBACK_MODEL || 'gemini-2.5-flash';
    this.models.set('groq', process.env.GROQ_MODEL || 'qwen/qwen3.8-27b');
    this.models.set('openai', process.env.OPENAI_MODEL || 'gpt-4o-mini');
    this.models.set('anthropic', process.env.ANTHROPIC_MODEL || 'claude-3-5-haiku-20241022');

    // Provider order
    const orderEnv = process.env.LLM_PROVIDER_ORDER || 'gemini,groq,openai,anthropic';
    this.providerOrder = orderEnv
      .split(',')
      .map(p => p.trim().toLowerCase())
      .filter((p): p is ProviderName => ['gemini', 'groq', 'openai', 'anthropic'].includes(p));

    if (this.providerOrder.length === 0) {
      this.providerOrder = ['gemini', 'groq', 'openai', 'anthropic'];
    }

    // Initialize keys for each provider
    this.initKeys('gemini', process.env.GEMINI_API_KEYS);
    this.initKeys('groq', process.env.GROQ_API_KEYS);
    this.initKeys('openai', process.env.OPENAI_API_KEYS);
    this.initKeys('anthropic', process.env.ANTHROPIC_API_KEYS);
  }

  private initKeys(provider: ProviderName, keysString?: string): void {
    const rawKeys = (keysString || '')
      .split(',')
      .map(k => k.trim())
      .filter(k => k.length > 0);

    const states: KeyState[] = rawKeys.map(k => ({
      key: k,
      maskedKey: maskKey(k),
      disabled: false,
      cooldownUntil: null,
      failureCount: 0
    }));

    this.keyStates.set(provider, states);
    this.keyIndex.set(provider, 0);
  }

  // Get an available key for a provider using round-robin
  private getNextKey(provider: ProviderName, allowCooldownFallback = false): KeyState | null {
    const states = this.keyStates.get(provider) || [];
    const now = Date.now();

    // Filter available keys: not disabled and not in cooldown
    let available = states.filter(s => {
      if (s.disabled) return false;
      if (s.cooldownUntil && s.cooldownUntil > now) return false;
      return true;
    });

    if (available.length === 0 && allowCooldownFallback) {
      available = states.filter(s => !s.disabled);
    }

    if (available.length === 0) return null;

    let idx = this.keyIndex.get(provider) || 0;
    // Round-robin selection
    const selected = available[idx % available.length];
    this.keyIndex.set(provider, (idx + 1) % available.length);
    return selected;
  }

  public recordKeyError(provider: ProviderName, keyState: KeyState, status?: number): void {
    keyState.failureCount++;
    const now = Date.now();

    if (status === 401 || status === 403) {
      // Disable key for the entire session
      keyState.disabled = true;
      console.warn(`[LLM] Key ${keyState.maskedKey} for ${provider} disabled for session (Auth Error ${status}).`);
    } else {
      // 429, 5xx, timeout, or network: cooldown for 60s
      keyState.cooldownUntil = now + 60_000;
      console.warn(`[LLM] Key ${keyState.maskedKey} for ${provider} placed in 60s cooldown (Error ${status || 'timeout/network'}).`);
    }
  }

  public getDiagnostics(): ProviderDiagnostic[] {
    const now = Date.now();
    return this.providerOrder.map(provider => {
      const states = this.keyStates.get(provider) || [];
      const model = this.models.get(provider) || 'unknown';

      const activeKeys = states.filter(s => !s.disabled && (!s.cooldownUntil || s.cooldownUntil <= now));
      const inCooldownKeys = states.filter(s => !s.disabled && s.cooldownUntil && s.cooldownUntil > now);

      let maxCooldownRemaining = 0;
      for (const s of inCooldownKeys) {
        if (s.cooldownUntil) {
          const rem = Math.max(0, Math.ceil((s.cooldownUntil - now) / 1000));
          if (rem > maxCooldownRemaining) maxCooldownRemaining = rem;
        }
      }

      const nameMap: Record<ProviderName, string> = {
        gemini: 'Google Gemini',
        groq: 'Groq',
        openai: 'OpenAI',
        anthropic: 'Anthropic'
      };

      return {
        name: nameMap[provider],
        provider,
        enabled: states.length > 0 && states.some(s => !s.disabled),
        model,
        keyCount: states.length,
        activeKeyCount: activeKeys.length,
        inCooldown: inCooldownKeys.length > 0 && activeKeys.length === 0,
        cooldownSecondsRemaining: maxCooldownRemaining
      };
    });
  }

  public hasAnyKeys(): boolean {
    for (const [, states] of this.keyStates) {
      if (states.some(s => !s.disabled)) return true;
    }
    return false;
  }

  public async complete<T = any>(options: LLMCompletionOptions): Promise<LLMResult<T>> {
    if (!this.hasAnyKeys()) {
      throw new Error(
        'NO_KEYS_AVAILABLE: No active LLM API keys are configured. You can explore the system offline by selecting "Use sample data".'
      );
    }

    let lastError: Error | null = null;
    let attempts = 0;

    // Ordered failover across enabled providers and models (primary -> stable fallback)
    const targets: Array<{ provider: ProviderName; model: string; label: string }> = [];
    for (const provider of this.providerOrder) {
      const primaryModel = this.models.get(provider);
      if (primaryModel) {
        targets.push({ provider, model: primaryModel, label: `${provider}:${primaryModel}` });
      }
      if (provider === 'gemini' && this.geminiFallbackModel && this.geminiFallbackModel !== primaryModel) {
        targets.push({ provider: 'gemini', model: this.geminiFallbackModel, label: `gemini-fallback:${this.geminiFallbackModel}` });
      }
    }

    for (const target of targets) {
      const adapter = this.adapters.get(target.provider);
      if (!adapter) continue;

      let keyState = this.getNextKey(target.provider, target.label.includes('fallback'));
      if (!keyState) continue;

      attempts++;
      const callStart = Date.now();
      const inChars = (options.user?.length || 0) + (options.system?.length || 0);

      try {
        // Attempt completion
        let rawText = await adapter.complete(keyState.key, target.model, options);
        let cleaned = stripCodeFences(rawText);

        // Try parsing JSON and validating schema
        let parsed: any;
        try {
          parsed = JSON.parse(cleaned);
          if (options.zodSchema) {
            parsed = options.zodSchema.parse(parsed);
          }
        } catch (jsonErr: any) {
          const fails = (this.consecutiveJsonFailures.get(target.provider) || 0) + 1;
          this.consecutiveJsonFailures.set(target.provider, fails);
          console.warn(`[LLM] JSON parse failure #${fails} from ${target.label}: ${jsonErr.message}`);

          if (fails >= 2) {
            const cooldownUntil = Date.now() + 5 * 60 * 1000;
            const states = this.keyStates.get(target.provider) || [];
            for (const s of states) {
              s.cooldownUntil = cooldownUntil;
            }
            console.warn(`[LLM] Provider ${target.provider} placed in cooldown. Failing over.`);
            telemetry.logCall({
              provider: target.label,
              sourceId: options.sourceId,
              inputChars: inChars,
              outputChars: rawText.length,
              durationMs: Date.now() - callStart,
              attempt: attempts,
              outcome: 'failover',
              cooldownWaitMs: 5 * 60 * 1000
            });
            continue;
          }

          // Retry once with a "valid JSON only" reminder
          console.warn(`[LLM] Retrying ${target.label} once with strict JSON prompt reminder...`);
          const retryOptions: LLMCompletionOptions = {
            ...options,
            user: `${options.user}\n\nCRITICAL ERROR: Your previous response was not valid JSON. You MUST return ONLY a raw valid JSON object with no markdown fences, no explanation, and no formatting errors.`
          };

          rawText = await adapter.complete(keyState.key, target.model, retryOptions);
          cleaned = stripCodeFences(rawText);
          parsed = JSON.parse(cleaned);
          if (options.zodSchema) {
            parsed = options.zodSchema.parse(parsed);
          }
        }

        // Reset consecutive failure count on success
        this.consecutiveJsonFailures.set(target.provider, 0);

        const durationMs = Date.now() - callStart;
        telemetry.logCall({
          provider: target.label,
          sourceId: options.sourceId,
          inputChars: inChars,
          outputChars: rawText.length,
          durationMs,
          attempt: attempts,
          outcome: 'success'
        });

        // Success!
        return {
          data: parsed as T,
          provider: target.provider,
          model: target.model,
          cached: false,
          attempts
        };
      } catch (err: any) {
        lastError = err;
        const durationMs = Date.now() - callStart;
        const msg = String(err.message || '');
        const match = msg.match(/\b(400|401|403|404|413|429|500|502|503|504)\b/);
        const status = err.status || (match ? parseInt(match[0], 10) : undefined);

        this.recordKeyError(target.provider, keyState, status);
        console.warn(`[LLM Failover] Target ${target.label} failed with status ${status || 'network error'}. Failing over across providers/models...`);

        telemetry.logCall({
          provider: target.label,
          sourceId: options.sourceId,
          inputChars: inChars,
          outputChars: 0,
          durationMs,
          attempt: attempts,
          outcome: 'failover'
        });

        // Short backoff (150ms)
        await new Promise(r => setTimeout(r, 150));
      }
    }

    throw new Error(
      `All LLM provider attempts failed (${attempts} attempts). Last error: ${lastError?.message || 'Unknown error'}. Please verify API keys or use sample data.`
    );
  }
}

export const llmManager = new LLMManager();

