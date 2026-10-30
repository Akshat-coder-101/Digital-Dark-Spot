export interface SourceInput {
  id?: string;
  type: 'url' | 'text';
  value: string;
  title?: string;
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
  detectedDate: string | null;
  detectedCycle: string | null;
  isStale: boolean; // older than 18 months or earlier cycle
  isUndated: boolean;
  status: 'ready' | 'error';
  errorMessage?: string;
  fetchedAt: string;
}

