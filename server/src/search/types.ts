export type SearchProviderName = 'tavily' | 'brave';

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  date?: string;
  domain: string;
  isOfficial: boolean;
  score?: number;
  limited?: boolean; // true if page fetch failed and snippet fallback used
  rawContent?: string;
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
  error?: string;
  createdAt: string;
}
