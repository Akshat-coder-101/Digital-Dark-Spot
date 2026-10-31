import React, { useMemo } from 'react';
import { useReport } from './ReportContext';
import { useNavigate } from 'react-router-dom';
import {
  VerifiedCheckIcon,
  CrackIcon,
  SeedIcon,
  WiltIcon
} from '@/components/common/Icons';
import {
  AlertTriangle,
  Clock,
  AlertCircle,
  ExternalLink,
  HelpCircle,
  Calendar
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { areAttributesMatching } from '@/lib/canonicalization';
import { IngestedSource, ExtractedClaim, FreshnessWarning, PotentialGap } from '@/lib/types';

function formatSentenceCase(str: string): string {
  if (!str) return '';
  const clean = str.replace(/_/g, ' ').trim();
  return clean.charAt(0).toUpperCase() + clean.slice(1).toLowerCase();
}

interface SummaryBullet {
  id: string;
  category: 'cycle' | 'conflict' | 'date' | 'gap' | 'single_source' | 'confirmed';
  icon: React.ComponentType<{ className?: string }>;
  text: string;
  valueOrDate?: string;
  sourceCountText?: string;
  targetLink?: string;
  claimId?: string;
}

export const SummaryTab: React.FC = () => {
  const { report } = useReport();
  const navigate = useNavigate();

  const fullSourcesCount = report.sources.filter((s: IngestedSource) => s.status === 'ready' && !s.isLimited && s.sourceType !== 'limited').length;
  const limitedSourcesCount = report.sources.filter((s: IngestedSource) => s.isLimited || s.sourceType === 'limited').length;

  const todayIso = new Date().toISOString().split('T')[0];

  // Deterministically construct 5 to 7 finding-grounded summary bullets
  const summaryBullets = useMemo<SummaryBullet[]>(() => {
    const bullets: SummaryBullet[] = [];

    // 1. Cycle notice if any
    const cycleWarning = report.freshnessWarnings?.find((w: FreshnessWarning) => w.warningType === 'earlier_cycle');
    const cycle = report.cycleNotice || cycleWarning?.detectedCycle;
    if (cycle) {
      bullets.push({
        id: 'bullet-cycle',
        category: 'cycle',
        icon: WiltIcon,
        text: typeof cycle === 'string' && cycle.includes('The reviewed sources refer to')
          ? cycle
          : `The reviewed sources refer to the "${cycle}" cycle, which precedes the current decision period. Treat dates and values as potentially outdated.`,
        sourceCountText: `${report.sources.length} sources`,
        targetLink: `/report/${report.id}/freshness`
      });
    }

    // 2. Conflicts (up to 2)
    for (const cf of (report.conflicts || []).slice(0, 2)) {
      const v1 = cf.sourceA?.value || 'Option A';
      const v2 = cf.sourceB?.value || 'Option B';
      const s1 = cf.sourceA?.source_domain || 'Source 1';
      const s2 = cf.sourceB?.source_domain || 'Source 2';
      const claim = (report.claims || []).find((c: ExtractedClaim) => c.source_id === cf.sourceA?.source_id);
      bullets.push({
        id: `bullet-conflict-${cf.id}`,
        category: 'conflict',
        icon: CrackIcon,
        text: `Contradiction on ${formatSentenceCase(cf.attribute)}: ${s1} states "${v1}", while ${s2} states "${v2}".`,
        valueOrDate: `${v1} vs ${v2}`,
        sourceCountText: '2 sources',
        claimId: claim?.id,
        targetLink: `/report/${report.id}/conflicts`
      });
    }

    // 3. Passed or imminent dates
    const passedDeadlineClaim = (report.claims || []).find((c: ExtractedClaim) => c.isDeadlinePassed);
    if (passedDeadlineClaim) {
      bullets.push({
        id: `bullet-date-${passedDeadlineClaim.id}`,
        category: 'date',
        icon: Clock,
        text: `Application or submission deadline has passed: ${formatSentenceCase(passedDeadlineClaim.attribute)} was "${passedDeadlineClaim.value}".`,
        valueOrDate: passedDeadlineClaim.value,
        sourceCountText: `via ${passedDeadlineClaim.source_domain}`,
        claimId: passedDeadlineClaim.id
      });
    } else {
      // Check for any upcoming date
      const upcomingClaim = (report.claims || []).find((c: ExtractedClaim) => {
        if (!c.value) return false;
        const dateMatch = c.value.match(/\b\d{4}-\d{2}-\d{2}\b/);
        return Boolean(dateMatch && dateMatch[0] >= todayIso);
      });
      if (upcomingClaim) {
        bullets.push({
          id: `bullet-date-${upcomingClaim.id}`,
          category: 'date',
          icon: Calendar,
          text: `Key upcoming date for ${formatSentenceCase(upcomingClaim.attribute)}: "${upcomingClaim.value}".`,
          valueOrDate: upcomingClaim.value,
          sourceCountText: `via ${upcomingClaim.source_domain}`,
          claimId: upcomingClaim.id
        });
      }
    }

    // 4. Gaps (needs only)
    const questionNeedsGaps = (report.gaps || []).filter((g: PotentialGap) => g.type === 'total_gap');
    for (const g of questionNeedsGaps.slice(0, 2)) {
      bullets.push({
        id: `bullet-gap-${g.id}`,
        category: 'gap',
        icon: SeedIcon,
        text: `Unaddressed requirement: "${formatSentenceCase(g.attribute)}" is not documented in any of the ${report.sources.length} reviewed sources.`,
        sourceCountText: '0 sources',
        targetLink: `/report/${report.id}/gaps`
      });
    }

    // 5. Single-source highlights
    const singleSourceClaim = (report.claims || []).find((c: ExtractedClaim) => {
      const matchingClaims = (report.claims || []).filter((other: ExtractedClaim) => areAttributesMatching(other.attribute, c.attribute));
      const uniqueSources = new Set(matchingClaims.map((m: ExtractedClaim) => m.source_id));
      return uniqueSources.size === 1;
    });
    if (singleSourceClaim && bullets.length < 6) {
      bullets.push({
        id: `bullet-single-${singleSourceClaim.id}`,
        category: 'single_source',
        icon: AlertCircle,
        text: `${formatSentenceCase(singleSourceClaim.attribute)} is stated as "${singleSourceClaim.value}" by only 1 source (${singleSourceClaim.source_domain}) and unconfirmed by others.`,
        valueOrDate: singleSourceClaim.value,
        sourceCountText: '1 source',
        claimId: singleSourceClaim.id
      });
    }

    // 6. Confirmed items (one or two where multiple sources agree)
    const confirmedParams: string[] = [];
    for (const c of report.claims || []) {
      if (confirmedParams.length >= 2 || bullets.length >= 7) break;
      const matchingClaims = (report.claims || []).filter((other: ExtractedClaim) => areAttributesMatching(other.attribute, c.attribute));
      const uniqueSources = new Set(matchingClaims.map((m: ExtractedClaim) => m.source_id));
      if (uniqueSources.size >= 2 && !confirmedParams.includes(c.attribute)) {
        confirmedParams.push(c.attribute);
        bullets.push({
          id: `bullet-confirmed-${c.id}`,
          category: 'confirmed',
          icon: VerifiedCheckIcon,
          text: `${formatSentenceCase(c.attribute)} is confirmed as "${c.value}" across ${uniqueSources.size} reviewed sources.`,
          valueOrDate: c.value,
          sourceCountText: `${uniqueSources.size} sources`,
          claimId: c.id
        });
      }
    }

    // Ensure 5 to 7 bullets
    return bullets.slice(0, 7);
  }, [report, todayIso]);

  const handleEvidenceClick = (bullet: SummaryBullet) => {
    if (bullet.claimId) {
      navigate(`/report/${report.id}/evidence/${encodeURIComponent(bullet.claimId)}`);
    } else if (bullet.targetLink) {
      navigate(bullet.targetLink);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top 3 Signal Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Conflicts */}
        <div
          onClick={() => navigate(`/report/${report.id}/conflicts`)}
          className={cn(
            "p-3.5 rounded-sm border transition-colors cursor-pointer space-y-1.5",
            report.conflicts.length > 0
              ? "bg-crack/5 border-crack/20 hover:border-crack/40"
              : "bg-pith border-seed/10"
          )}
        >
          <div className="flex items-center justify-between text-xs">
            <span className="font-heading font-bold text-seed flex items-center gap-1.5">
              <AlertTriangle className={cn("w-3.5 h-3.5", report.conflicts.length > 0 ? "text-crack" : "text-seed-muted")} />
              Possible Conflicts
            </span>
            <span className="font-mono font-bold text-xs text-crack">{report.conflicts.length}</span>
          </div>
          <p className="text-[11px] text-seed-muted leading-relaxed">
            {report.conflicts.length > 0
              ? `${report.conflicts.length} discrepancy across source values requires verification.`
              : 'Zero contradictions found across reviewed sources.'}
          </p>
        </div>

        {/* Outdated / Freshness */}
        <div
          onClick={() => navigate(`/report/${report.id}/freshness`)}
          className={cn(
            "p-3.5 rounded-sm border transition-colors cursor-pointer space-y-1.5",
            report.freshnessWarnings.length > 0
              ? "bg-wilt/5 border-wilt/20 hover:border-wilt/40"
              : "bg-pith border-seed/10"
          )}
        >
          <div className="flex items-center justify-between text-xs">
            <span className="font-heading font-bold text-seed flex items-center gap-1.5">
              <Clock className={cn("w-3.5 h-3.5", report.freshnessWarnings.length > 0 ? "text-wilt" : "text-seed-muted")} />
              Outdated & Temporal
            </span>
            <span className="font-mono font-bold text-xs text-wilt">{report.freshnessWarnings.length}</span>
          </div>
          <p className="text-[11px] text-seed-muted leading-relaxed">
            {report.freshnessWarnings.length > 0
              ? `${report.freshnessWarnings.length} notice with passed deadlines, stale dates, or unversioned text.`
              : 'All reviewed sources are dated and current.'}
          </p>
        </div>

        {/* Potential Gaps */}
        <div
          onClick={() => navigate(`/report/${report.id}/gaps`)}
          className={cn(
            "p-3.5 rounded-sm border transition-colors cursor-pointer space-y-1.5",
            report.gaps.length > 0
              ? "bg-seed/2 border-seed/15 hover:border-rind/30"
              : "bg-pith border-seed/10"
          )}
        >
          <div className="flex items-center justify-between text-xs">
            <span className="font-heading font-bold text-seed flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-rind" />
              Potential Gaps
            </span>
            <span className="font-mono font-bold text-xs text-seed">{report.gaps.length}</span>
          </div>
          <p className="text-[11px] text-seed-muted leading-relaxed">
            {report.gaps.length > 0
              ? `${report.gaps.length} parameter missing from the reviewed sources.`
              : 'All expected decision parameters are covered.'}
          </p>
        </div>
      </div>

      {/* SUMMARY BLOCK: Structured Findings Bullets */}
      <div className="p-5 sm:p-6 rounded-sm border border-seed/10 bg-pith space-y-4 shadow-2xs">
        <div className="flex items-center justify-between border-b border-seed/10 pb-3">
          <div className="space-y-0.5">
            <h3 className="font-heading font-bold text-base sm:text-lg text-seed">
              Summary
            </h3>
            <p className="text-xs text-seed-muted">
              Based on {report.sources.length} reviewed sources ({fullSourcesCount} full, {limitedSourcesCount} limited)
            </p>
          </div>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-xs bg-seed/5 text-seed-muted text-[11px] font-sans font-medium border border-seed/15">
            AI-suggested
          </span>
        </div>

        {/* 5 to 7 Finding Bullets */}
        <ul className="space-y-3 pt-1" role="list">
          {summaryBullets.map((bullet) => {
            const IconComp = bullet.icon;
            return (
              <li
                key={bullet.id}
                onClick={() => handleEvidenceClick(bullet)}
                className="flex items-start justify-between gap-3 p-3 rounded-xs border border-seed/10 bg-seed/1 hover:bg-seed/2 transition-colors cursor-pointer group"
              >
                <div className="flex items-start gap-2.5 min-w-0 flex-1">
                  <IconComp className={cn(
                    "w-4 h-4 shrink-0 mt-0.5",
                    bullet.category === 'conflict' ? "text-crack" :
                    bullet.category === 'cycle' || bullet.category === 'date' ? "text-wilt" :
                    bullet.category === 'gap' ? "text-flesh" :
                    bullet.category === 'confirmed' ? "text-rind" :
                    "text-seed-muted"
                  )} />
                  <div className="space-y-1 min-w-0">
                    <p className="text-xs sm:text-sm text-seed leading-relaxed font-sans group-hover:text-seed">
                      {bullet.text}
                    </p>
                    {bullet.sourceCountText && (
                      <span className="text-[10px] font-mono text-seed-muted">
                        Evidence: {bullet.sourceCountText}
                      </span>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  className="shrink-0 text-rind hover:underline inline-flex items-center gap-1 text-xs font-mono font-medium pt-0.5"
                  title="Inspect finding in evidence drawer"
                >
                  <span>Inspect</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Open Questions (if any) */}
      {report.openQuestions.length > 0 && (
        <div className="p-5 sm:p-6 rounded-sm border border-seed/10 bg-pith space-y-4 shadow-2xs">
          <div className="flex items-center justify-between border-b border-seed/10 pb-3">
            <div className="flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-crack" />
              <h3 className="font-heading font-bold text-base text-seed">
                Open Questions to Resolve
              </h3>
            </div>
            <span className="text-xs text-seed-muted font-mono">
              {report.openQuestions.length} pending
            </span>
          </div>

          <ul className="space-y-2">
            {report.openQuestions.map((q: string, idx: number) => (
              <li
                key={idx}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-xs border border-seed/10 bg-seed/1.5"
              >
                <div className="flex items-start gap-2.5 min-w-0">
                  <span className="w-4 h-4 rounded-full bg-crack/10 text-crack flex items-center justify-center text-[10px] font-mono font-bold shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <span className="text-xs text-seed font-sans leading-relaxed">
                    {q}
                  </span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-xs bg-seed/5 text-seed-muted border border-seed/10 shrink-0 self-start sm:self-auto">
                  AI-suggested
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
