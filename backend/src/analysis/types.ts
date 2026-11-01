import { IngestedSource } from '../ingestion/types.js';

export type ValueType = 'number' | 'money' | 'percent' | 'date' | 'list' | 'boolean' | 'text' | 'url';
export type DateKind = 'publication' | 'deadline' | 'validity' | 'unknown';

export interface TypedClaim {
  id: string;
  source_id: string;
  source_title: string;
  source_domain: string;
  attributeKey: string;
  valueType: ValueType;
  rawValue: string;
  normalizedValue: any;
  quote: string;
  subject?: string;
  qualifier?: string;
  dateKind?: DateKind;
  confidence: number;
}

export interface ExtractedClaim {
  id: string;
  source_id: string;
  source_title: string;
  source_domain: string;
  attribute: string;
  original_attribute?: string;
  value: string;
  quote: string;
  verified: boolean;
  charOffset?: number;
  qualifier?: string;
  subject?: string;
  valueType?: ValueType;
  normalizedValue?: any;
  isDeadlinePassed?: boolean;
  isOutdated?: boolean;
}

export interface RawLLMExtraction {
  expected_attributes: string[];
  claims: Array<{
    source_id: string;
    attribute: string;
    value: string;
    quote: string;
    qualifier?: string;
    subject?: string;
  }>;
  open_questions: string[];
  summary?: string;
}

export interface ExtractionResult {
  expected_attributes: string[];
  question_derived_needs?: string[];
  extra_parameters?: string[];
  other_details_count?: number;
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
  qualifier?: string;
  title: string;
  description: string;
  whyFlagged?: string;
  isWeak?: boolean;
  authorityDiscrepancy?: string;
  mayBeExplainedByEarlierCycle?: string;
  sourceA: {
    source_id: string;
    source_title: string;
    source_domain: string;
    original_attribute?: string;
    value: string;
    quote: string;
    dateStatus?: string;
  };
  sourceB: {
    source_id: string;
    source_title: string;
    source_domain: string;
    original_attribute?: string;
    value: string;
    quote: string;
    dateStatus?: string;
  };
  statusLabel: 'Possible conflict';
  signalTag: 'Sourced' | 'Uncertain';
}

export interface FreshnessWarning {
  id: string;
  source_id: string;
  source_title: string;
  source_domain: string;
  warningType: 'undated' | 'stale_date' | 'earlier_cycle' | 'deadline_passed';
  reason: string;
  detectedDate: string | null;
  detectedCycle: string | null;
  statusLabel: 'Potentially stale' | 'Potentially outdated' | 'No date found in the source text';
  signalTag: 'Sourced';
}

export type MatrixCellStatus = 'found' | 'missing' | 'conflict' | 'stale';

export interface CoverageMatrixRow {
  attribute: string;
  attributeLabel: string;
  overallStatus: 'covered' | 'gap' | 'conflict' | 'thin' | 'stale';
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

export interface ParameterStatus {
  parameter: string;
  label: string;
  status: 'found' | 'single_source' | 'conflict' | 'gap' | 'stale';
  statusLabel: string; // "Found" | "Single source" | "Conflict" | "Gap" | "Stale"
  claims: ExtractedClaim[];
  sourcesCount: number;
  sourceIds: string[];
  conflict?: PossibleConflict;
  isStale?: boolean;
  keyValue: string;
  gapSuggestedAction?: string;
  sortRank: number; // 1: conflict, 2: gap, 3: stale, 4: single_source, 5: found
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
    outdatedCount?: number;
    undatedCount?: number;
    claimsCount: number;
    discardedClaimsCount: number;
  };
  expectedAttributes: string[];
  questionDerivedNeeds?: string[];
  extraParameters?: string[];
  otherDetailsCount?: number;
  cycleNotice?: string;
  sources: IngestedSource[];
  claims: ExtractedClaim[];
  parameterStatuses?: ParameterStatus[];
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
  sourcesStatus: Array<{ id: string; title: string; status: 'pending' | 'ready' | 'error'; reason?: string }>;
  error?: string;
  reportId?: string;
}
