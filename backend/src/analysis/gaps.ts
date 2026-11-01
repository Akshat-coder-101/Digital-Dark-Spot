import { ExtractedClaim, PotentialGap, ParameterStatus } from './types.js';
import { areAttributesMatching } from './canonicalization.js';
import { computeParameterStatuses } from './parameterStatus.js';

export function formatAttributeLabel(attr: string): string {
  return attr
    .split('_')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export function detectGaps(
  expectedAttributes: string[] | ParameterStatus[],
  verifiedClaims: ExtractedClaim[] = [],
  totalSourceCount: number = 0,
  questionNeeds?: string[],
  explicitStatuses?: ParameterStatus[]
): PotentialGap[] {
  const gaps: PotentialGap[] = [];

  const isParamStatusArray = Array.isArray(expectedAttributes) &&
    expectedAttributes.length > 0 &&
    typeof expectedAttributes[0] === 'object' &&
    'parameter' in (expectedAttributes[0] as any);

  const statuses: ParameterStatus[] = explicitStatuses ||
    (isParamStatusArray
      ? (expectedAttributes as ParameterStatus[])
      : computeParameterStatuses(expectedAttributes as string[], verifiedClaims));

  // ABSOLUTE RULE: Only parameters with status === 'gap' (0 verified claims) are gaps
  for (const pStatus of statuses) {
    if (pStatus.status === 'gap') {
      const attr = pStatus.parameter;
      const label = pStatus.label || formatAttributeLabel(attr);

      gaps.push({
        id: `gap-${attr}`,
        attribute: attr,
        title: `Potential gap: ${label} not found in the sources reviewed`,
        description: `None of the reviewed sources contain verified evidence or details for "${label}". This critical decision parameter remains completely uncovered.`,
        type: 'total_gap',
        sourceCount: 0,
        supportingSourceIds: [],
        suggestedAction: pStatus.gapSuggestedAction || `Check official guidance or documentation specifically for "${label}".`,
        statusLabel: 'Potential gap',
        signalTag: 'AI-suggested'
      });
    }
  }

  return gaps;
}

