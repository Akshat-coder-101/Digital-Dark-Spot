import {
  ChecklistItem,
  PotentialGap,
  PossibleConflict,
  FreshnessWarning
} from './types.js';
import { formatAttributeLabel } from './gaps.js';

/**
 * Derives a topic-tailored source type recommendation rather than a generic boilerplate phrase.
 */
export function deriveSourceTypeForAttribute(attr: string): string {
  const a = attr.toLowerCase();
  if (
    a.includes('gpu') ||
    a.includes('tgp') ||
    a.includes('vram') ||
    a.includes('spec') ||
    a.includes('display') ||
    a.includes('ram') ||
    a.includes('cpu') ||
    a.includes('cooling') ||
    a.includes('battery') ||
    a.includes('hardware')
  ) {
    return 'Manufacturer technical specification sheet';
  }
  if (a.includes('warranty') || a.includes('return') || a.includes('refund') || a.includes('policy')) {
    return 'Authorized retailer warranty & return terms';
  }
  if (a.includes('price') || a.includes('cost') || a.includes('fee') || a.includes('discount')) {
    return 'Official retail catalog or pricing schedule';
  }
  if (a.includes('deadline') || a.includes('due') || a.includes('date') || a.includes('timeline')) {
    return 'Official notification & gazette bulletin';
  }
  if (a.includes('document') || a.includes('certificate') || a.includes('id_proof') || a.includes('filing')) {
    return 'Primary administrative submission portal';
  }
  if (a.includes('criteria') || a.includes('prerequisite') || a.includes('qualification') || a.includes('financial')) {
    return 'Official regulatory guidelines';
  }
  return 'Primary authoritative documentation';
}

export function buildPrioritizedChecklist(
  gaps: PotentialGap[],
  conflicts: PossibleConflict[],
  freshness: FreshnessWarning[],
  openQuestions: string[] = []
): ChecklistItem[] {
  const items: ChecklistItem[] = [];
  const seenKeys = new Set<string>();
  let itemCounter = 1;

  // 1. HIGH PRIORITY: All active conflicts
  for (const conf of conflicts) {
    if (conf.attribute === 'other_details') continue;
    const label = formatAttributeLabel(conf.attribute);
    const key = `conflict-${conf.attribute}`;
    if (seenKeys.has(key)) continue;
    seenKeys.add(key);

    const sType = deriveSourceTypeForAttribute(conf.attribute);
    items.push({
      id: `check-${itemCounter++}`,
      priority: 'High',
      title: `Resolve conflicting ${label} specifications`,
      description: `Discrepancy: "${conf.sourceA.source_title}" (${conf.sourceA.source_domain}) states "${conf.sourceA.value}", while "${conf.sourceB.source_title}" (${conf.sourceB.source_domain}) states "${conf.sourceB.value}".`,
      relatedAttribute: conf.attribute,
      suggestedOfficialSource: sType,
      signalTag: 'Sourced',
      checked: false
    });
  }

  // 2. HIGH PRIORITY: Passed Deadlines
  for (const fresh of freshness) {
    if (fresh.warningType === 'deadline_passed') {
      const key = `deadline-${fresh.source_id}-${fresh.detectedDate}`;
      if (seenKeys.has(key)) continue;
      seenKeys.add(key);

      items.push({
        id: `check-${itemCounter++}`,
        priority: 'High',
        title: `Re-verify passed deadline (${fresh.detectedDate})`,
        description: `Source "${fresh.source_title}" (${fresh.source_domain}) specifies a deadline that passed on ${fresh.detectedDate}. Verify if amendments or current cycles apply.`,
        suggestedOfficialSource: 'Official notification & gazette bulletin',
        signalTag: 'Sourced',
        checked: false
      });
    }
  }

  // 3. HIGH PRIORITY: Missing items that the question explicitly needs (Total Gaps)
  for (const gap of gaps) {
    if (gap.type === 'total_gap') {
      if (gap.attribute === 'other_details') continue;
      const key = `gap-${gap.attribute}`;
      if (seenKeys.has(key)) continue;
      seenKeys.add(key);

      const label = formatAttributeLabel(gap.attribute);
      const sType = deriveSourceTypeForAttribute(gap.attribute);

      items.push({
        id: `check-${itemCounter++}`,
        priority: 'High',
        title: `Obtain verified specifications for ${label}`,
        description: `None of the reviewed sources provide verified details for "${label}". Must be confirmed before decision.`,
        relatedAttribute: gap.attribute,
        suggestedOfficialSource: sType,
        signalTag: 'AI-suggested',
        checked: false
      });
    }
  }

  // 4. MEDIUM PRIORITY: Thin single-source coverage
  for (const gap of gaps) {
    if (gap.type === 'thin_coverage') {
      if (gap.attribute === 'other_details') continue;
      const key = `thin-${gap.attribute}`;
      if (seenKeys.has(key)) continue;
      seenKeys.add(key);

      const label = formatAttributeLabel(gap.attribute);
      const sType = deriveSourceTypeForAttribute(gap.attribute);

      items.push({
        id: `check-${itemCounter++}`,
        priority: 'Medium',
        title: `Corroborate single-source claim for ${label}`,
        description: `"${label}" was referenced by only one source without independent corroboration.`,
        relatedAttribute: gap.attribute,
        suggestedOfficialSource: sType,
        signalTag: 'Uncertain',
        checked: false
      });
    }
  }

  // 5. MEDIUM & LOW PRIORITY: Earlier cycles, undated sources
  for (const fresh of freshness) {
    if (fresh.warningType === 'earlier_cycle') {
      const key = `cycle-${fresh.source_id}`;
      if (seenKeys.has(key)) continue;
      seenKeys.add(key);

      items.push({
        id: `check-${itemCounter++}`,
        priority: 'Medium',
        title: `Verify ${fresh.detectedCycle} cycle terms against current notice`,
        description: `Source "${fresh.source_title}" (${fresh.source_domain}) references an earlier cycle (${fresh.detectedCycle}). Verify current guidelines.`,
        suggestedOfficialSource: 'Current period official notice',
        signalTag: 'Sourced',
        checked: false
      });
    } else if (fresh.warningType === 'undated') {
      const key = `undated-${fresh.source_id}`;
      if (seenKeys.has(key)) continue;
      seenKeys.add(key);

      items.push({
        id: `check-${itemCounter++}`,
        priority: 'Medium',
        title: `Audit undated claims in ${fresh.source_title.slice(0, 45)}`,
        description: `Source "${fresh.source_title}" (${fresh.source_domain}) provides no publication date or cycle tag. Confirm details are current.`,
        suggestedOfficialSource: 'Dated primary announcement',
        signalTag: 'Uncertain',
        checked: false
      });
    }
  }

  // 6. LOW PRIORITY: General AI-suggested checks (Never in High, grouped at bottom)
  for (const q of openQuestions.slice(0, 3)) {
    const key = `open-q-${q.slice(0, 30)}`;
    if (seenKeys.has(key)) continue;
    seenKeys.add(key);

    items.push({
      id: `check-${itemCounter++}`,
      priority: 'Low',
      title: `General check: ${q}`,
      description: `Open question unaddressed by current sources: "${q}"`,
      suggestedOfficialSource: 'Authoritative primary documentation',
      signalTag: 'AI-suggested',
      checked: false
    });
  }

  return items;
}
