import {
  CoverageMatrixRow,
  ExtractedClaim,
  PossibleConflict,
  MatrixCellStatus
} from './types.js';
import { IngestedSource } from '../ingestion/types.js';
import { formatAttributeLabel } from './gaps.js';
import { areAttributesMatching } from './canonicalization.js';
import { isOfficialDomain } from '../search/adapters/tavily.js';

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

    const isPortalAttr = attr.includes('portal') || attr.includes('website') || attr.includes('official_link');
    const coveredSources = readySources.filter(s => {
      if (attrClaims.some(c => c.source_id === s.id)) return true;
      if (isPortalAttr && (
        isOfficialDomain(s.domain) ||
        s.domain.endsWith('.gov') || s.domain.includes('.gov.') || s.domain.endsWith('.nic.in') ||
        attrClaims.some(c => c.value.toLowerCase().includes(s.domain.toLowerCase()))
      )) return true;
      return false;
    });

    const coveredSourcesCount = coveredSources.length;
    const allCoveredAreStale = coveredSourcesCount > 0 && coveredSources.every(s => s.isStale);

    // Status precedence: Conflict > Gap > Stale > Single source (thin) > Found (covered)
    let overallStatus: 'covered' | 'gap' | 'conflict' | 'thin' = 'covered';
    if (hasConflict) {
      overallStatus = 'conflict';
    } else if (coveredSourcesCount === 0) {
      overallStatus = 'gap';
    } else if (allCoveredAreStale) {
      // If all covered sources are stale, it's flagged as thin or stale context
      overallStatus = coveredSourcesCount === 1 ? 'thin' : 'covered';
    } else if (coveredSourcesCount === 1 && readySources.length > 1) {
      overallStatus = 'thin';
    }

    const cells: CoverageMatrixRow['cells'] = {};

    for (const source of readySources) {
      const sourceClaim = attrClaims.find(c => c.source_id === source.id);

      let cellStatus: MatrixCellStatus = 'missing';
      let claimId: string | undefined = undefined;
      let val: string | undefined = undefined;

      const isGov = isOfficialDomain(source.domain) ||
                    source.domain.endsWith('.gov') ||
                    source.domain.includes('.gov.') ||
                    source.domain.endsWith('.nic.in') ||
                    source.domain.includes('.nic.');
      const isNamedPortal = attrClaims.some(c =>
        c.value.toLowerCase().includes(source.domain.toLowerCase()) ||
        (source.url && c.value.toLowerCase().includes(source.url.toLowerCase()))
      );

      if (!sourceClaim && isPortalAttr && (isGov || isNamedPortal)) {
        cellStatus = 'found';
        val = `Official portal: ${source.domain}`;
      } else if (sourceClaim) {
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
