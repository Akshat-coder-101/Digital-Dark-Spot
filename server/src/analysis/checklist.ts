import {
  ChecklistItem,
  PotentialGap,
  PossibleConflict,
  FreshnessWarning
} from './types.js';
import { formatAttributeLabel } from './gaps.js';

export function buildPrioritizedChecklist(
  gaps: PotentialGap[],
  conflicts: PossibleConflict[],
  freshness: FreshnessWarning[],
  openQuestions: string[]
): ChecklistItem[] {
  const items: ChecklistItem[] = [];
  let itemCounter = 1;

  // 1. HIGH PRIORITY: All active conflicts
  for (const conf of conflicts) {
    const label = formatAttributeLabel(conf.attribute);
    items.push({
      id: `check-${itemCounter++}`,
      priority: 'High',
      title: `Resolve conflicting ${label} specifications`,
      description: `Discrepancy detected: "${conf.sourceA.source_title}" states "${conf.sourceA.value}", while "${conf.sourceB.source_title}" reports "${conf.sourceB.value}".`,
      relatedAttribute: conf.attribute,
      suggestedOfficialSource: 'Official Regulatory Document or Primary Governing Portal',
      signalTag: 'Sourced',
      checked: false
    });
  }

  // Critical attribute keywords for High priority gaps
  const criticalKeywords = ['deadline', 'eligibility', 'income', 'requirement', 'portal', 'link', 'renewal'];

  // 2. HIGH & MEDIUM PRIORITY: Gaps
  for (const gap of gaps) {
    const isCritical = criticalKeywords.some(kw => gap.attribute.includes(kw));
    const label = formatAttributeLabel(gap.attribute);

    if (gap.type === 'total_gap') {
      items.push({
        id: `check-${itemCounter++}`,
        priority: isCritical ? 'High' : 'Medium',
        title: `Confirm official policy for ${label}`,
        description: `No reviewed source covers "${label}". Verify whether mandatory criteria, limits, or steps apply.`,
        relatedAttribute: gap.attribute,
        suggestedOfficialSource: 'Official Application Guidelines / Terms of Service',
        signalTag: 'AI-suggested',
        checked: false
      });
    } else if (gap.type === 'thin_coverage') {
      items.push({
        id: `check-${itemCounter++}`,
        priority: 'Medium',
        title: `Cross-verify ${label} against secondary authority`,
        description: `Reported by only a single source without confirmation from other reviewed material.`,
        relatedAttribute: gap.attribute,
        suggestedOfficialSource: 'Accredited Institutional Notice / FAQ page',
        signalTag: 'Uncertain',
        checked: false
      });
    }
  }

  // 3. LOW PRIORITY: Freshness & Stale warnings
  for (const fresh of freshness) {
    if (fresh.warningType === 'earlier_cycle') {
      items.push({
        id: `check-${itemCounter++}`,
        priority: 'Medium',
        title: `Verify ${fresh.detectedCycle} cycle terms against current notice`,
        description: `Source "${fresh.source_title}" references an earlier cycle. Verify current cycle updates with official secretariat.`,
        suggestedOfficialSource: 'Current Year Official Notification Bulletin',
        signalTag: 'Sourced',
        checked: false
      });
    } else if (fresh.warningType === 'undated') {
      items.push({
        id: `check-${itemCounter++}`,
        priority: 'Low',
        title: `Audit undated claims in "${fresh.source_title.slice(0, 40)}"`,
        description: `This source has no timestamp or cycle marker. Confirm if details remain valid today.`,
        suggestedOfficialSource: 'Official Administrative Helpdesk / Dated Circular',
        signalTag: 'Uncertain',
        checked: false
      });
    }
  }

  // 4. Incorporate Open Questions if space permits
  for (const oq of openQuestions.slice(0, 2)) {
    items.push({
      id: `check-${itemCounter++}`,
      priority: 'Medium',
      title: oq,
      description: 'Key open question identified during information synthesis.',
      suggestedOfficialSource: 'Primary Authority Documentation',
      signalTag: 'AI-suggested',
      checked: false
    });
  }

  return items;
}
