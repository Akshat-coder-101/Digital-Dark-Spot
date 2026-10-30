import { IngestedSource } from '../ingestion/types.js';

export interface ExtractedClaim {
  id: string;
  source_id: string;
  source_title: string;
  source_domain: string;
  attribute: string;
  value: string;
  quote: string;
  verified: boolean;
  charOffset?: number;
}

export interface RawLLMExtraction {
  expected_attributes: string[];
  claims: Array<{
    source_id: string;
    attribute: string;
    value: string;
    quote: string;
  }>;
  open_questions: string[];
  summary?: string;
}

export interface ExtractionResult {
  expected_attributes: string[];
  verified_claims: ExtractedClaim[];
  discarded_claims_count: number;
  open_questions: string[];
  summary: string;
  provider: string;
  model: string;
}
