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

export interface PotentialGap {
  id: string;
  attribute: string;
  title: string;
  description: string;
  type: 'total_gap' | 'thin_coverage';
  sourceCount: number;
  supportingSourceIds: string[];
  suggestedAction: string;
  statusLabel: 'Potential gap';
  signalTag: 'AI-suggested' | 'Uncertain';
}

export interface PossibleConflict {
  id: string;
  attribute: string;
  title: string;
  description: string;
  sourceA: {
    source_id: string;
    source_title: string;
    source_domain: string;
    value: string;
    quote: string;
    dateStatus?: string;
  };
  sourceB: {
    source_id: string;
    source_title: string;
    source_domain: string;
    value: string;
    quote: string;
    dateStatus?: string;
  };
  statusLabel: 'Possible conflict';
  signalTag: 'Sourced';
}

export interface FreshnessWarning {
  id: string;
  source_id: string;
  source_title: string;
  source_domain: string;
  warningType: 'undated' | 'stale_date' | 'earlier_cycle';
  reason: string;
  detectedDate: string | null;
  detectedCycle: string | null;
  statusLabel: 'Potentially stale';
  signalTag: 'Sourced';
}

export type MatrixCellStatus = 'found' | 'missing' | 'conflict' | 'stale';

export interface CoverageMatrixRow {
  attribute: string;
  attributeLabel: string;
  overallStatus: 'covered' | 'gap' | 'conflict' | 'thin';
  cells: Record<string, {
    sourceId: string;
    status: MatrixCellStatus;
    claimId?: string;
    value?: string;
  }>;
}

export interface ChecklistItem {
  id: string;
  priority: 'High' | 'Medium' | 'Low';
  title: string;
  description: string;
  relatedAttribute?: string;
  suggestedOfficialSource: string;
  signalTag: 'AI-suggested' | 'Sourced' | 'Uncertain';
  checked?: boolean;
}

export interface FullAnalysisReport {
  id: string;
  question: string;
  summary: string;
  analyzedWith: {
    provider: string;
    model: string;
    cached: boolean;
  };
  metrics: {
    sourcesCount: number;
    gapsCount: number;
    conflictsCount: number;
    staleCount: number;
    claimsCount: number;
    discardedClaimsCount: number;
  };
  expectedAttributes: string[];
  sources: IngestedSource[];
  claims: ExtractedClaim[];
  gaps: PotentialGap[];
  conflicts: PossibleConflict[];
  freshnessWarnings: FreshnessWarning[];
  coverageMatrix: CoverageMatrixRow[];
  checklist: ChecklistItem[];
  openQuestions: string[];
  createdAt: string;
}

export type AnalysisStage =
  | 'Fetching'
  | 'Reading'
  | 'Comparing'
  | 'Checking dates'
  | 'Building checklist'
  | 'Done'
  | 'Error';

export interface JobProgress {
  id: string;
  stage: AnalysisStage;
  stageIndex: number;
  totalStages: number;
  progressPercent: number;
  currentAction: string;
  sourcesStatus: Array<{ id: string; title: string; status: 'pending' | 'ready' | 'error' }>;
  error?: string;
  reportId?: string;
}
