export type SourceOriginType = 'real' | 'user_url' | 'user_text' | 'sample' | 'limited' | 'unavailable';

export type UsefulnessStatus = 'READY' | 'NEEDS_ATTENTION' | 'FAILED';
export type CredibilityHint = 'institutional' | 'general';

export interface SourceInput {
  id?: string;
  type: 'url' | 'text';
  value: string;
  title?: string;
  domain?: string;
  detectedDate?: string;
  rawContent?: string;
  snippet?: string;
  sourceType?: SourceOriginType;
}

export interface IngestedSource {
  id: string;
  type: 'url' | 'text';
  url?: string;
  domain: string;
  title: string;
  rawText: string;
  cleanedText: string;
  wordCount: number;
  textCharacterCount: number;
  claimsExtracted: number;
  claimsDiscarded: number;
  usefulnessStatus: UsefulnessStatus;
  credibilityHint: CredibilityHint;
  detectedDate: string | null;
  detectedCycle: string | null;
  isStale: boolean; // older than 18 months or earlier cycle
  isUndated: boolean;
  status: 'ready' | 'error';
  isLimited?: boolean;
  isUnavailable?: boolean;
  errorMessage?: string;
  fetchedAt: string;
  sourceType?: SourceOriginType;
}
