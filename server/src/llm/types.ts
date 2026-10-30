import { z } from 'zod';

export type ProviderName = 'gemini' | 'openai' | 'anthropic';

export interface LLMCompletionOptions {
  system: string;
  user: string;
  jsonSchema?: Record<string, any>;
  zodSchema?: z.ZodSchema<any>;
}

export interface LLMResult<T = any> {
  data: T;
  provider: ProviderName;
  model: string;
  cached: boolean;
  attempts: number;
}

export interface KeyState {
  key: string;
  maskedKey: string;
  disabled: boolean;
  cooldownUntil: number | null; // timestamp in ms
  failureCount: number;
}

export interface ProviderDiagnostic {
  name: string;
  provider: ProviderName;
  enabled: boolean;
  model: string;
  keyCount: number;
  activeKeyCount: number;
  inCooldown: boolean;
  cooldownSecondsRemaining: number;
}

export interface ProviderAdapter {
  provider: ProviderName;
  complete: (
    apiKey: string,
    model: string,
    options: LLMCompletionOptions
  ) => Promise<string>;
}
