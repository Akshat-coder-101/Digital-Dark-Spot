import {
  CoverageMatrixRow,
  ExtractedClaim,
  PossibleConflict,
  MatrixCellStatus
} from './types.js';
import { IngestedSource } from '../ingestion/types.js';
import { formatAttributeLabel } from './gaps.js';
import { areAttributesMatching } from './canonicalization.js';

export function buildCoverageMatrix(
  expectedAttributes: string[],
  sources: IngestedSource[],
  claims: ExtractedClaim[],
  conflicts: PossibleConflict[]
): CoverageMatrixRow[] {
  const readySources = sources.filter(s => s.status === 'ready');
  const matrix: CoverageMatrixRow[] = [];

  for (const attr of expectedAttributes) {
    const attrClaims = claims.filter(c => areAttributesMatching(c.attribute, attr));
    const hasConflict = conflicts.some(c => areAttributesMatching(c.attribute, attr));

    let overallStatus: 'covered' | 'gap' | 'conflict' | 'thin' = 'covered';
    if (attrClaims.length === 0) {
      overallStatus = 'gap';
    } else if (hasConflict) {
      overallStatus = 'conflict';
    } else if (attrClaims.length === 1 && readySources.length > 1) {
      overallStatus = 'thin';
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
        } else if (source.isStale) {
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
      attributeLabel: formatAttributeLabel(attr),
      overallStatus,
      cells
    });
  }

  return matrix;
}

