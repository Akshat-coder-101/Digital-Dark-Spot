import { FullAnalysisReport, PotentialGap } from '../analysis/types.js';
import { searchManager } from './manager.js';
import { processSource } from '../ingestion/fetcher.js';
import { extractClaimsAndAttributes } from '../analysis/extraction.js';
import { verifyClaimsVerbatim } from '../analysis/verifier.js';
import { detectGaps } from '../analysis/gaps.js';
import { detectConflicts } from '../analysis/conflicts.js';
import { computeParameterStatuses } from '../analysis/parameterStatus.js';
import { buildCoverageMatrix } from '../analysis/matrix.js';
import { buildPrioritizedChecklist } from '../analysis/checklist.js';
import { auditFreshness } from '../analysis/freshness.js';

export async function runSecondPassTargetedGapSearch(
  report: FullAnalysisReport
): Promise<FullAnalysisReport> {
  const highGaps = report.gaps.filter(g => g.type === 'total_gap');
  if (highGaps.length === 0 || !searchManager.hasAnyKeys()) {
    return report;
  }

  // Cap to max 2 targeted searches to avoid excess latency/quota
  const gapsToProbe = highGaps.slice(0, 2);
  let newlyIngestedSources = [...report.sources];
  let allVerifiedClaims = [...report.claims];

  for (const gap of gapsToProbe) {
    const attrName = gap.attribute.replace(/_/g, ' ');
    const targetedQuery = `${report.question} ${attrName} official terms guidelines`;

    try {
      const searchHits = await searchManager.search(targetedQuery, 2);
      if (searchHits.length === 0) {
        gap.description = `${gap.description} (Targeted search was performed; no relevant sources found).`;
        gap.title = `Potential gap: ${attrName} not found in the sources reviewed, including a targeted search`;
        continue;
      }

      // Fetch the best 1-2 pages safely
      let foundClosingClaim = false;
      for (const hit of searchHits.slice(0, 2)) {
        const ingested = await processSource({ type: 'url', value: hit.url, title: hit.title }, newlyIngestedSources.length);
        if (ingested.status === 'ready' && ingested.wordCount > 30) {
          newlyIngestedSources.push(ingested);

          // Extract claims
          const extraction = await extractClaimsAndAttributes(report.question, [ingested]);
          const matchingClaim = extraction.verified_claims.find(c => c.attribute === gap.attribute);

          if (matchingClaim) {
            allVerifiedClaims.push(matchingClaim);
            foundClosingClaim = true;
            break;
          }
        }
      }

      if (!foundClosingClaim) {
        gap.title = `Potential gap: ${attrName} not found in the sources reviewed, including a targeted search`;
        gap.description = `A targeted secondary search for "${attrName}" was executed across relevant external records, but no verified claim could be corroborated.`;
      }
    } catch (err) {
      console.warn(`[SecondPass] Targeted search failed for gap "${gap.attribute}":`, err);
      gap.title = `Potential gap: ${attrName} not found in the sources reviewed, including a targeted search`;
    }
  }

  // Re-run deterministic analysis with the new findings
  const updatedConflicts = detectConflicts(allVerifiedClaims, newlyIngestedSources);
  const updatedFreshness = auditFreshness(newlyIngestedSources, allVerifiedClaims);
  const updatedStatuses = computeParameterStatuses(
    report.expectedAttributes,
    allVerifiedClaims,
    updatedConflicts,
    updatedFreshness,
    newlyIngestedSources
  );
  const updatedGaps = detectGaps(
    report.expectedAttributes,
    allVerifiedClaims,
    newlyIngestedSources.length,
    undefined,
    updatedStatuses
  );
  const updatedMatrix = buildCoverageMatrix(
    report.expectedAttributes,
    newlyIngestedSources,
    allVerifiedClaims,
    updatedConflicts,
    updatedStatuses
  );
  const updatedChecklist = buildPrioritizedChecklist(
    updatedGaps,
    updatedConflicts,
    updatedFreshness,
    report.openQuestions,
    updatedStatuses
  );

  return {
    ...report,
    sources: newlyIngestedSources,
    claims: allVerifiedClaims,
    parameterStatuses: updatedStatuses,
    gaps: updatedGaps,
    conflicts: updatedConflicts,
    freshnessWarnings: updatedFreshness,
    coverageMatrix: updatedMatrix,
    checklist: updatedChecklist,
    metrics: {
      sourcesCount: newlyIngestedSources.length,
      gapsCount: updatedGaps.length,
      conflictsCount: updatedConflicts.length,
      staleCount: updatedFreshness.length,
      claimsCount: allVerifiedClaims.length,
      discardedClaimsCount: report.metrics.discardedClaimsCount
    }
  };
}

