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
  private providerOrder: ProviderName[] = ['gemini', 'openai', 'anthropic'];

  constructor() {
    this.adapters.set('gemini', geminiAdapter);
    this.adapters.set('openai', openaiAdapter);
    this.adapters.set('anthropic', anthropicAdapter);

    this.reloadEnvironment();
  }

  public reloadEnvironment(): void {
    // Models
    this.models.set('gemini', process.env.GEMINI_MODEL || 'gemini-1.5-flash');
    this.models.set('openai', process.env.OPENAI_MODEL || 'gpt-4o-mini');
    this.models.set('anthropic', process.env.ANTHROPIC_MODEL || 'claude-3-5-haiku-20241022');

    // Provider order
    const orderEnv = process.env.LLM_PROVIDER_ORDER || 'gemini,openai,anthropic';
    this.providerOrder = orderEnv
      .split(',')
      .map(p => p.trim().toLowerCase())
      .filter((p): p is ProviderName => ['gemini', 'openai', 'anthropic'].includes(p));

    if (this.providerOrder.length === 0) {
      this.providerOrder = ['gemini', 'openai', 'anthropic'];
    }

    // Initialize keys for each provider
    this.initKeys('gemini', process.env.GEMINI_API_KEYS);
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
  private getNextKey(provider: ProviderName): KeyState | null {
    const states = this.keyStates.get(provider) || [];
    const now = Date.now();

    // Filter available keys: not disabled and not in cooldown
    const available = states.filter(s => {
      if (s.disabled) return false;
      if (s.cooldownUntil && s.cooldownUntil > now) return false;
      return true;
    });

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
    const maxTotalAttempts = 3;

    for (const provider of this.providerOrder) {
      const adapter = this.adapters.get(provider);
      const model = this.models.get(provider);
      if (!adapter || !model) continue;

      let keyState = this.getNextKey(provider);
      while (keyState && attempts < maxTotalAttempts) {
        attempts++;
        try {
          // Attempt completion
          let rawText = await adapter.complete(keyState.key, model, options);
          let cleaned = stripCodeFences(rawText);

          // Try parsing JSON
          let parsed: any;
          try {
            parsed = JSON.parse(cleaned);
          } catch (jsonErr) {
            // Retry once with a "valid JSON only" reminder
            console.warn(`[LLM] JSON parse failure from ${provider}. Retrying with strict JSON prompt reminder...`);
            const retryOptions: LLMCompletionOptions = {
              ...options,
              user: `${options.user}\n\nCRITICAL ERROR: Your previous response was not valid JSON. You MUST return ONLY a raw valid JSON object with no markdown fences, no explanation, and no formatting errors.`
            };

            rawText = await adapter.complete(keyState.key, model, retryOptions);
            cleaned = stripCodeFences(rawText);
            parsed = JSON.parse(cleaned);
          }

          // Optional zod validation
          if (options.zodSchema) {
            parsed = options.zodSchema.parse(parsed);
          }

          // Success!
          return {
            data: parsed as T,
            provider,
            model,
            cached: false,
            attempts
          };
        } catch (err: any) {
          lastError = err;
          const status = err.status || (err.message && err.message.match(/\b(400|401|403|404|429|500|502|503|504)\b/)?.[0] ? parseInt(err.message.match(/\b(400|401|403|404|429|500|502|503|504)\b/)[0]) : undefined);

          this.recordKeyError(provider, keyState, status);

          // Short backoff before next attempt (100ms * attempt)
          await new Promise(r => setTimeout(r, attempts * 100));

          // Try next key for same provider, if available
          keyState = this.getNextKey(provider);
        }
      }
    }

    throw new Error(
      `All LLM provider attempts failed (${attempts} attempts). Last error: ${lastError?.message || 'Unknown error'}. Please verify API keys or use sample data.`
    );
  }
}

export const llmManager = new LLMManager();
