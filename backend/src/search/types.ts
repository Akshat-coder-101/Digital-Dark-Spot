export type SearchProviderName = 'gemini' | 'tavily' | 'brave';

export interface SearchResult {
  title: string;
  url: string;
  originalUrl?: string;
  snippet: string;
  date?: string;
  domain: string;
  isOfficial: boolean;
  score?: number;
  limited?: boolean; // true if page fetch failed and snippet fallback used
  unavailable?: boolean; // true if retrieval completely failed
  isLowText?: boolean; // true if source is unlikely to hold extractable structured text
  rawContent?: string;
  sourceType?: string;
  relevanceHint?: string;
}

export interface SearchKeyState {
  key: string;
  maskedKey: string;
  disabled: boolean;
  cooldownUntil: number | null;
  failureCount: number;
}

export interface SearchProviderDiagnostic {
  name: string;
  provider: SearchProviderName;
  enabled: boolean;
  keyCount: number;
  activeKeyCount: number;
  inCooldown: boolean;
  cooldownSecondsRemaining: number;
}

export interface SearchAdapter {
  provider: SearchProviderName;
  search: (apiKey: string, query: string, limit?: number) => Promise<SearchResult[]>;
}

export interface DiscoveryJob {
  id: string;
  question: string;
  status: 'searching' | 'fetching' | 'ready' | 'error';
  progressPercent: number;
  message: string;
  queriesGenerated: string[];
  sourcesFound: SearchResult[];
  suggestedAttributes?: string[];
  error?: string;
  createdAt: string;
}

