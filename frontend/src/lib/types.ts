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
  isStale: boolean;
  isUndated: boolean;
  status: 'ready' | 'error';
  isLimited?: boolean;
  errorMessage?: string;
  fetchedAt: string;
  sourceType?: 'real' | 'user_url' | 'user_text' | 'sample' | 'limited' | 'unavailable';
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
  isDeadlinePassed?: boolean;
  isOutdated?: boolean;
  dateKind?: 'deadline' | 'validity' | 'publication' | 'opening' | 'event' | 'unknown';
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
  whyFlagged?: string;
  isWeak?: boolean;
  authorityDiscrepancy?: string;
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
  signalTag: 'Sourced';
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
    quote?: string;
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
  | 'Building checklist';
