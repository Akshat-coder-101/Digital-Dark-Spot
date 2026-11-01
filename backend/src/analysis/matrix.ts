import {
  CoverageMatrixRow,
  ExtractedClaim,
  PossibleConflict,
  MatrixCellStatus,
  ParameterStatus
} from './types.js';
import { IngestedSource } from '../ingestion/types.js';
import { formatAttributeLabel } from './gaps.js';
import { areAttributesMatching } from './canonicalization.js';
import { isOfficialDomain } from '../search/adapters/tavily.js';
import { computeParameterStatuses } from './parameterStatus.js';

export function buildCoverageMatrix(
  expectedAttributes: string[] | ParameterStatus[],
  sources: IngestedSource[],
  claims: ExtractedClaim[] = [],
  conflicts: PossibleConflict[] = [],
  explicitStatuses?: ParameterStatus[]
): CoverageMatrixRow[] {
  const readySources = sources.filter(s => s.status === 'ready');
  const matrix: CoverageMatrixRow[] = [];

  const isParamStatusArray = Array.isArray(expectedAttributes) &&
    expectedAttributes.length > 0 &&
    typeof expectedAttributes[0] === 'object' &&
    'parameter' in (expectedAttributes[0] as any);

  const statuses: ParameterStatus[] = explicitStatuses ||
    (isParamStatusArray
      ? (expectedAttributes as ParameterStatus[])
      : computeParameterStatuses(expectedAttributes as string[], claims, conflicts, [], sources));

  for (const pStatus of statuses) {
    const attr = pStatus.parameter;
    const attrClaims = pStatus.claims;
    const hasConflict = pStatus.status === 'conflict';

    // Status mapping from ParameterStatus
    let overallStatus: 'covered' | 'gap' | 'conflict' | 'thin' = 'covered';
    if (pStatus.status === 'conflict') {
      overallStatus = 'conflict';
    } else if (pStatus.status === 'gap') {
      overallStatus = 'gap';
    } else if (pStatus.status === 'single_source') {
      overallStatus = 'thin';
    } else if (pStatus.status === 'stale') {
      overallStatus = pStatus.sourcesCount === 1 ? 'thin' : 'covered';
    } else {
      overallStatus = 'covered';
    }

    const cells: CoverageMatrixRow['cells'] = {};

    for (const source of readySources) {
      const sourceClaim = attrClaims.find(c => c.source_id === source.id);

      let cellStatus: MatrixCellStatus = 'missing';
      let claimId: string | undefined = undefined;
      let val: string | undefined = undefined;

      if (sourceClaim) {
        claimId = sourceClaim.id;
        val = sourceClaim.value;
        if (hasConflict) {
          cellStatus = 'conflict';
        } else if (source.isStale || sourceClaim.isDeadlinePassed) {
          cellStatus = 'stale';
        } else {
          cellStatus = 'found';
        }
      }

      cells[source.id] = {
        sourceId: source.id,
        status: cellStatus,
        claimId,
        value: val
      };
    }

    matrix.push({
      attribute: attr,
      attributeLabel: pStatus.label || formatAttributeLabel(attr),
      overallStatus,
      cells
    });
  }

  return matrix;
}
