import { ExtractedClaim, PotentialGap } from './types.js';
import { areAttributesMatching } from './canonicalization.js';

export function formatAttributeLabel(attr: string): string {
  return attr
    .split('_')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export function detectGaps(
  expectedAttributes: string[],
  verifiedClaims: ExtractedClaim[],
  totalSourceCount: number,
  questionNeeds?: string[]
): PotentialGap[] {
  const gaps: PotentialGap[] = [];
  const needsToAudit = questionNeeds && questionNeeds.length > 0 ? questionNeeds : expectedAttributes;

  for (const attr of needsToAudit) {
    const matchingClaims = verifiedClaims.filter(c => areAttributesMatching(c.attribute, attr));
    const label = formatAttributeLabel(attr);

    if (matchingClaims.length === 0) {
      // Total gap: 0 verified claims found across all reviewed sources
      gaps.push({
        id: `gap-${attr}`,
        attribute: attr,
        title: `Potential gap: ${label} not found in the sources reviewed`,
        description: `None of the reviewed sources contain verified evidence or details for "${label}". This critical decision parameter remains completely uncovered.`,
        type: 'total_gap',
        sourceCount: 0,
        supportingSourceIds: [],
        suggestedAction: `Check official guidance or application materials specifically for "${label}".`,
        statusLabel: 'Potential gap',
        signalTag: 'AI-suggested'
      });
    } else if (matchingClaims.length === 1 && totalSourceCount >= 2) {
      // Thin single-source coverage
      const source = matchingClaims[0];
      gaps.push({
        id: `thin-${attr}`,
        attribute: attr,
        title: `Potential gap: ${label} covered by single source only`,
        description: `"${label}" was referenced only by "${source.source_title}" without independent cross-verification from other sources reviewed.`,
        type: 'thin_coverage',
        sourceCount: 1,
        supportingSourceIds: [source.source_id],
        suggestedAction: `Verify whether "${label}" is corroborated by primary official notices.`,
        statusLabel: 'Potential gap',
        signalTag: 'Uncertain'
      });
    }
  }

  return gaps;
}

