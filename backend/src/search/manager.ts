import {
  SearchProviderName,
  SearchAdapter,
  SearchResult,
  SearchKeyState,
  SearchProviderDiagnostic
} from './types.js';
import { tavilyAdapter } from './adapters/tavily.js';
import { braveAdapter } from './adapters/brave.js';
import { maskKey } from '../llm/manager.js';

export class SearchManager {
  private adapters: Map<SearchProviderName, SearchAdapter> = new Map();
  private keyStates: Map<SearchProviderName, SearchKeyState[]> = new Map();
  private keyIndex: Map<SearchProviderName, number> = new Map();
  private providerOrder: SearchProviderName[] = ['tavily', 'brave'];
  private cache: Map<string, { results: SearchResult[]; timestamp: number }> = new Map();

  constructor() {
    this.adapters.set('tavily', tavilyAdapter);
    this.adapters.set('brave', braveAdapter);
    this.reloadEnvironment();
  }

  public reloadEnvironment(): void {
    const orderEnv = process.env.SEARCH_PROVIDER_ORDER || 'tavily,brave';
    this.providerOrder = orderEnv
      .split(',')
      .map(p => p.trim().toLowerCase())
      .filter((p): p is SearchProviderName => ['tavily', 'brave'].includes(p));

    if (this.providerOrder.length === 0) {
      this.providerOrder = ['tavily', 'brave'];
    }

    this.initKeys('tavily', process.env.TAVILY_API_KEYS);
    this.initKeys('brave', process.env.BRAVE_API_KEYS);
  }

  private initKeys(provider: SearchProviderName, keysString?: string): void {
    const rawKeys = (keysString || '')
      .split(',')
      .map(k => k.trim())
      .filter(k => k.length > 0);

    const states: SearchKeyState[] = rawKeys.map(k => ({
      key: k,
      maskedKey: maskKey(k),
      disabled: false,
      cooldownUntil: null,
      failureCount: 0
    }));

    this.keyStates.set(provider, states);
    this.keyIndex.set(provider, 0);
  }

  private getNextKey(provider: SearchProviderName): SearchKeyState | null {
    const states = this.keyStates.get(provider) || [];
    const now = Date.now();

    const available = states.filter(s => {
      if (s.disabled) return false;
      if (s.cooldownUntil && s.cooldownUntil > now) return false;
      return true;
    });

    if (available.length === 0) return null;

    let idx = this.keyIndex.get(provider) || 0;
    const selected = available[idx % available.length];
    this.keyIndex.set(provider, (idx + 1) % available.length);
    return selected;
  }

  public recordKeyError(provider: SearchProviderName, keyState: SearchKeyState, status?: number): void {
    keyState.failureCount++;
    const now = Date.now();

    if (status === 401 || status === 403) {
      keyState.disabled = true;
      console.warn(`[Search] Key ${keyState.maskedKey} for ${provider} disabled for session (Auth Error ${status}).`);
    } else {
      keyState.cooldownUntil = now + 60_000;
      console.warn(`[Search] Key ${keyState.maskedKey} for ${provider} placed in 60s cooldown (Error ${status || 'network/timeout'}).`);
    }
  }

  public hasAnyKeys(): boolean {
    for (const [, states] of this.keyStates) {
      if (states.some(s => !s.disabled)) return true;
    }
    return false;
  }

  public getDiagnostics(): SearchProviderDiagnostic[] {
    const now = Date.now();
    return this.providerOrder.map(provider => {
      const states = this.keyStates.get(provider) || [];
      const activeKeys = states.filter(s => !s.disabled && (!s.cooldownUntil || s.cooldownUntil <= now));
      const inCooldownKeys = states.filter(s => !s.disabled && s.cooldownUntil && s.cooldownUntil > now);

      let maxCooldown = 0;
      for (const s of inCooldownKeys) {
        if (s.cooldownUntil) {
          const rem = Math.max(0, Math.ceil((s.cooldownUntil - now) / 1000));
          if (rem > maxCooldown) maxCooldown = rem;
        }
      }

      return {
        name: provider === 'tavily' ? 'Tavily Search' : 'Brave Search',
        provider,
        enabled: states.length > 0 && states.some(s => !s.disabled),
        keyCount: states.length,
        activeKeyCount: activeKeys.length,
        inCooldown: inCooldownKeys.length > 0 && activeKeys.length === 0,
        cooldownSecondsRemaining: maxCooldown
      };
    });
  }

  public async search(query: string, limit: number = 5): Promise<SearchResult[]> {
    const cacheKey = query.trim().toLowerCase();
    const cached = this.cache.get(cacheKey);
    // Cache valid for 30 minutes
    if (cached && Date.now() - cached.timestamp < 30 * 60 * 1000) {
      return cached.results;
    }

    if (!this.hasAnyKeys()) {
      throw new Error(
        'NO_SEARCH_KEYS_AVAILABLE: No active Tavily or Brave search API keys are configured. You can provide URLs manually or explore using sample data.'
      );
    }

    let lastError: Error | null = null;
    let attempts = 0;
    const maxAttempts = 3;

    for (const provider of this.providerOrder) {
      const adapter = this.adapters.get(provider);
      if (!adapter) continue;

      let keyState = this.getNextKey(provider);
      while (keyState && attempts < maxAttempts) {
        attempts++;
        try {
          const results = await adapter.search(keyState.key, query, limit);
          this.cache.set(cacheKey, { results, timestamp: Date.now() });
          return results;
        } catch (err: any) {
          lastError = err;
          const status = err.status || (err.message && err.message.match(/\b(400|401|403|404|429|500|502|503|504)\b/)?.[0] ? parseInt(err.message.match(/\b(400|401|403|404|429|500|502|503|504)\b/)[0]) : undefined);

          this.recordKeyError(provider, keyState, status);
          keyState = this.getNextKey(provider);
        }
      }
    }

    throw new Error(
      `Search providers failed (${attempts} attempts). Last error: ${lastError?.message || 'Unknown search error'}.`
    );
  }
}

export const searchManager = new SearchManager();

