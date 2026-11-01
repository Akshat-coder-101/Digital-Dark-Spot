import React, { useMemo, useState } from 'react';
import { useReport } from './ReportContext';
import { useNavigate } from 'react-router-dom';
import {
  VerifiedCheckIcon,
  CrackIcon,
  SeedIcon,
  WiltIcon
} from '@/components/common/Icons';
import {
  AlertCircle,
  Check,
  Clock,
  Copy,
  ExternalLink,
  Layers,
  ListChecks,
  ShieldCheck
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { generateStructuredSummary } from '@/lib/summaryGenerator';
import { Button } from '@/components/ui/button';

export const SummaryTab: React.FC = () => {
  const { report } = useReport();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  // Compute parameter statuses fallback if not attached
  const parameterStatuses = useMemo(() => {
    if (report.parameterStatuses && report.parameterStatuses.length > 0) {
      return report.parameterStatuses;
    }
    // Fallback: derive from coverageMatrix
    return (report.coverageMatrix || []).map(row => {
      const claims = (report.claims || []).filter(c => c.attribute === row.attribute);
      const uniqueSourceIds = Array.from(new Set(claims.map(c => c.source_id)));
      let status: 'found' | 'single_source' | 'conflict' | 'gap' | 'stale' = 'found';
      let statusLabel = 'Found';
      if (row.overallStatus === 'conflict') {
        status = 'conflict';
        statusLabel = 'Conflict';
      } else if (claims.length === 0) {
        status = 'gap';
        statusLabel = 'Gap';
      } else if (uniqueSourceIds.length === 1) {
        status = 'single_source';
        statusLabel = 'Single source';
      } else if (row.overallStatus === 'thin') {
        status = 'single_source';
        statusLabel = 'Single source';
      }

      return {
        parameter: row.attribute,
        label: row.attributeLabel || row.attribute,
        status,
        statusLabel,
        claims,
        sourcesCount: uniqueSourceIds.length,
        sourceIds: uniqueSourceIds,
        keyValue: claims[0]?.value || 'Not found in the sources reviewed',
        sortRank: status === 'conflict' ? 1 : (status === 'gap' ? 2 : (status === 'single_source' ? 4 : 5))
      };
    });
  }, [report]);

  const summary = useMemo(() => {
    return generateStructuredSummary({
      question: report.question,
      sources: report.sources || [],
      parameterStatuses,
      claims: report.claims || [],
      conflicts: report.conflicts || [],
      freshness: report.freshnessWarnings || [],
      checklist: report.checklist || []
    });
  }, [report, parameterStatuses]);

  const handleCopy = () => {
    navigator.clipboard.writeText(summary.copyableMarkdown).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleInspect = (claimId?: string, param?: string) => {
    if (claimId) {
      navigate(`/report/${report.id}/evidence/${encodeURIComponent(claimId)}`);
    } else if (param) {
      navigate(`/report/${report.id}/evidence/${encodeURIComponent(param)}`);
    }
  };

  return (
    <div className="space-y-7 max-w-[76ch]">
      {/* 1. Header with Badge & Copy Action */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-seed/10">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xs bg-rind/10 text-rind border border-rind/25 text-xs font-semibold font-mono">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{summary.badge}</span>
          </span>
          <span className="text-xs text-seed-muted">
            • Verified evidence synthesis
          </span>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleCopy}
          className="text-xs cursor-pointer inline-flex items-center gap-1.5"
          title="Copy full summary as formatted Markdown"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-rind" />
              <span>Copied summary!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 text-seed-muted" />
              <span>Copy summary</span>
            </>
          )}
        </Button>
      </div>

      {/* 2. Overview: 4 to 6 plain sentences */}
      <section className="space-y-3">
        <h3 className="font-heading font-extrabold text-base sm:text-lg text-seed tracking-tight">
          Executive Overview
        </h3>
        <div className="p-4 rounded-sm border border-seed/10 bg-seed/2 text-sm leading-relaxed text-seed space-y-2.5">
          {summary.overview.map((sentence, idx) => (
            <p key={idx} className="leading-relaxed">
              {sentence}
            </p>
          ))}
        </div>
      </section>

      {/* 3. Decision Parameters: All parameters, none omitted */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-heading font-extrabold text-base sm:text-lg text-seed tracking-tight">
            Decision Parameters ({summary.parameterSections.length})
          </h3>
          <span className="text-xs font-mono text-seed-muted">
            Click Inspect to view verbatim quotes
          </span>
        </div>

        <div className="space-y-3">
          {summary.parameterSections.map((sec) => (
            <div
              key={sec.parameter}
              className={cn(
                "p-3.5 rounded-sm border transition-colors space-y-2",
                sec.status === 'conflict'
                  ? "bg-crack/5 border-crack/30"
                  : sec.status === 'gap'
                    ? "bg-seed/2 border-seed/15"
                    : sec.status === 'single_source'
                      ? "bg-pith border-seed/15"
                      : "bg-pith border-seed/10"
              )}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-rind px-1.5 py-0.2 rounded-2xs bg-rind/10 border border-rind/20">
                    [{sec.marker}]
                  </span>
                  <h4 className="font-heading font-bold text-sm text-seed">
                    {sec.heading}
                  </h4>
                </div>

                <div className="flex items-center gap-2">
                  {sec.status === 'conflict' && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded-2xs bg-crack/15 text-crack border border-crack/30">
                      <CrackIcon className="w-3 h-3 text-crack" />
                      <span>Conflict</span>
                    </span>
                  )}
                  {sec.status === 'gap' && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded-2xs bg-flesh/10 text-flesh border border-flesh/20">
                      <SeedIcon className="w-3 h-3 text-flesh" />
                      <span>Gap (0 sources)</span>
                    </span>
                  )}
                  {sec.status === 'single_source' && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded-2xs bg-seed/5 text-seed-muted border border-seed/15">
                      <AlertCircle className="w-3 h-3 text-seed-muted" />
                      <span>Single source</span>
                    </span>
                  )}
                  {sec.status === 'found' && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded-2xs bg-rind/10 text-rind border border-rind/25">
                      <VerifiedCheckIcon className="w-3 h-3 text-rind" />
                      <span>Found ({sec.sourcesCount} sources)</span>
                    </span>
                  )}
                  {sec.status === 'stale' && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded-2xs bg-wilt/15 text-wilt border border-wilt/30">
                      <WiltIcon className="w-3 h-3 text-wilt" />
                      <span>Stale</span>
                    </span>
                  )}

                  {sec.inspectClaimId && (
                    <button
                      type="button"
                      onClick={() => handleInspect(sec.inspectClaimId, sec.parameter)}
                      className="inline-flex items-center gap-1 text-xs text-rind hover:underline font-mono cursor-pointer ml-1"
                    >
                      <span>Inspect</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              <p className="text-xs sm:text-sm text-seed/90 leading-relaxed font-sans">
                {sec.text}
              </p>

              {sec.claims.length > 0 && (
                <div className="pt-1.5 border-t border-seed/5 flex flex-wrap gap-2 text-[11px] text-seed-muted font-mono">
                  {sec.claims.map((cl) => (
                    <button
                      key={cl.id}
                      type="button"
                      onClick={() => handleInspect(cl.id)}
                      className="hover:text-rind hover:underline inline-flex items-center gap-1 cursor-pointer"
                      title={cl.quote}
                    >
                      <span>• {cl.sourceDomain}: &ldquo;{cl.value}&rdquo;</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 4. Other Details: All verified claims that did not map to a parameter */}
      {summary.otherDetails.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-rind" />
            <h3 className="font-heading font-extrabold text-base sm:text-lg text-seed tracking-tight">
              Other Verified Details ({summary.otherDetails.reduce((sum, g) => sum + g.claims.length, 0)})
            </h3>
          </div>

          <div className="p-3.5 rounded-sm border border-seed/10 bg-pith space-y-3">
            {summary.otherDetails.map((group) => (
              <div key={group.theme} className="space-y-1.5">
                <span className="text-xs font-mono font-semibold uppercase tracking-wider text-seed-muted block">
                  {group.theme}
                </span>
                <ul className="space-y-1.5 text-xs text-seed">
                  {group.claims.map((cl) => (
                    <li key={cl.id} className="flex items-start justify-between gap-3">
                      <span className="leading-relaxed">
                        • {cl.value}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleInspect(cl.id)}
                        className="text-[11px] font-mono text-rind hover:underline shrink-0 cursor-pointer"
                      >
                        {cl.sourceDomain} →
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 5. Dates and Freshness */}
      {(summary.datesAndFreshness.passedDeadlines.length > 0 ||
        summary.datesAndFreshness.upcomingDates.length > 0 ||
        summary.datesAndFreshness.cycleWarnings.length > 0 ||
        summary.datesAndFreshness.undatedWarnings.length > 0) && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-wilt" />
            <h3 className="font-heading font-extrabold text-base sm:text-lg text-seed tracking-tight">
              Dates & Freshness
            </h3>
          </div>

          <div className="p-3.5 rounded-sm border border-seed/10 bg-pith space-y-2 text-xs">
            {summary.datesAndFreshness.passedDeadlines.map((pd, idx) => (
              <div key={idx} className="flex items-start justify-between gap-2 text-gap">
                <span>⚠️ <strong>Passed Deadline:</strong> {pd.label} was &ldquo;{pd.date}&rdquo;</span>
                <button
                  type="button"
                  onClick={() => handleInspect(pd.claimId)}
                  className="text-[11px] font-mono text-rind hover:underline shrink-0"
                >
                  {pd.sourceDomain} →
                </button>
              </div>
            ))}

            {summary.datesAndFreshness.upcomingDates.map((ud, idx) => (
              <div key={idx} className="flex items-start justify-between gap-2 text-seed">
                <span>📅 <strong>Upcoming Milestone:</strong> {ud.label} is &ldquo;{ud.date}&rdquo;</span>
                <button
                  type="button"
                  onClick={() => handleInspect(ud.claimId)}
                  className="text-[11px] font-mono text-rind hover:underline shrink-0"
                >
                  {ud.sourceDomain} →
                </button>
              </div>
            ))}

            {summary.datesAndFreshness.cycleWarnings.map((cw, idx) => (
              <div key={idx} className="text-wilt">
                ⏳ <strong>Cycle Notice:</strong> {cw.text}
              </div>
            ))}

            {summary.datesAndFreshness.undatedWarnings.length > 0 && (
              <div className="text-seed-muted">
                ℹ️ {summary.datesAndFreshness.undatedWarnings.length} reviewed source(s) provide no detected publication date or cycle tag.
              </div>
            )}
          </div>
        </section>
      )}

      {/* 6. What to Verify Next: Top items with link to full checklist */}
      {summary.verifyNext.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ListChecks className="w-4 h-4 text-rind" />
              <h3 className="font-heading font-extrabold text-base sm:text-lg text-seed tracking-tight">
                What to Verify Next
              </h3>
            </div>
            <button
              type="button"
              onClick={() => navigate(`/report/${report.id}/checklist`)}
              className="text-xs font-mono text-rind hover:underline inline-flex items-center gap-1 cursor-pointer"
            >
              <span>View full checklist ({report.checklist?.length || 0}) →</span>
            </button>
          </div>

          <div className="space-y-2">
            {summary.verifyNext.map((item) => (
              <div
                key={item.id}
                className="p-3 rounded-sm border border-seed/10 bg-pith flex items-start gap-3"
              >
                <span
                  className={cn(
                    "text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-2xs uppercase shrink-0 mt-0.5",
                    item.priority === 'High'
                      ? "bg-crack/20 text-crack border border-crack/30"
                      : "bg-rind/15 text-rind border border-rind/25"
                  )}
                >
                  {item.priority}
                </span>
                <div className="space-y-0.5">
                  <h5 className="font-heading font-bold text-xs text-seed">
                    {item.title}
                  </h5>
                  <p className="text-xs text-seed-muted leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
