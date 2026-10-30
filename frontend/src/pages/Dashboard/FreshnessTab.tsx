import React from 'react';
import { useReport } from './ReportContext';
import { StatusTag } from '@/components/common/StatusTag';
import { WiltIcon, VerifiedCheckIcon } from '@/components/common/Icons';
import { EmptyState } from '@/components/ui/empty-state';
import { Calendar, AlertCircle, CheckCircle2, Clock } from 'lucide-react';

export const FreshnessTab: React.FC = () => {
  const { report } = useReport();

  if (report.freshnessWarnings.length === 0) {
    return (
      <EmptyState
        icon={<VerifiedCheckIcon className="w-7 h-7 text-rind" />}
        title="All Sources are Fresh & Dated"
        description="All reviewed documents have current, verified dates within the last 18 months."
      />
    );
  }

  // Group sources by fresh vs flagged
  const flaggedSourceIds = new Set(report.freshnessWarnings.map((w) => w.source_id));
  const freshSources = report.sources.filter((s) => s.status === 'ready' && !flaggedSourceIds.has(s.id));

  return (
    <div className="space-y-6">
      {/* Editorial Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-seed/10 pb-4">
        <div>
          <h3 className="font-heading font-bold text-base sm:text-lg text-seed flex items-center gap-2">
            <WiltIcon className="w-4 h-4 text-wilt" />
            <span>Temporal & Freshness Audit ({report.freshnessWarnings.length} Flagged)</span>
          </h3>
          <p className="text-xs text-seed-muted">
            Audits publication dates, academic cycles, and uncorroborated third-party claims.
          </p>
        </div>
        <span className="text-xs font-mono px-2 py-0.5 rounded-xs bg-wilt/15 text-wilt border border-wilt/30 font-semibold">
          {report.freshnessWarnings.length} of {report.sources.length} sources flagged
        </span>
      </div>

      {/* Why Temporal Signals Matter Box */}
      <div className="p-4 rounded-sm border border-seed/10 bg-seed/[0.02] space-y-2">
        <div className="flex items-center gap-2 text-xs font-heading font-bold text-seed">
          <Clock className="w-3.5 h-3.5 text-crack" />
          <span>Why Temporal Verification is Critical</span>
        </div>
        <p className="text-xs text-seed-muted leading-relaxed">
          Aggregator websites frequently update article titles with the current year (e.g. &ldquo;2026&rdquo;) to capture search traffic, while leaving outdated eligibility criteria, expired deadlines, or earlier cycle rules intact in the body text.
        </p>
      </div>

      {/* Flagged Sources Warnings List */}
      <div className="space-y-3.5">
        <h4 className="font-heading font-bold text-xs uppercase tracking-wider text-wilt flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 text-wilt" />
          <span>Flagged Sources Requiring Verification</span>
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {report.freshnessWarnings.map((warning) => (
            <div
              key={warning.id}
              className="p-4 sm:p-5 rounded-sm border border-seed/10 border-l-2 border-l-wilt bg-pith space-y-3 shadow-2xs"
            >
              <div className="flex items-center justify-between text-xs">
                <StatusTag status="stale" />
                <span className="font-mono text-[10px] px-1.5 py-0.5 rounded-xs bg-wilt/15 text-wilt border border-wilt/30 font-semibold">
                  {warning.warningType.replace('_', ' ').toUpperCase()}
                </span>
              </div>

              <div>
                <h5 className="font-heading font-bold text-sm text-seed">
                  {warning.source_title}
                </h5>
                <p className="text-[11px] font-mono text-seed-muted mt-0.5">
                  {warning.source_domain}
                </p>
              </div>

              <div className="p-2.5 rounded-xs bg-seed/[0.025] border border-seed/10 text-xs text-seed-muted space-y-1">
                <span className="font-semibold text-seed block">Risk Factor:</span>
                <p className="leading-relaxed">{warning.reason}</p>
              </div>

              <div className="pt-2 border-t border-seed/10 flex items-center justify-between text-xs text-seed-muted">
                <span className="flex items-center gap-1.5 font-mono text-[11px]">
                  <Calendar className="w-3.5 h-3.5 text-wilt" />
                  <span>Cycle: {warning.detectedCycle || warning.detectedDate || 'Undated'}</span>
                </span>
                <span className="text-[11px] font-medium text-wilt">
                  Do not rely without official notice
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Fresh / Verified Sources Reference */}
      {freshSources.length > 0 && (
        <div className="space-y-3 pt-2">
          <h4 className="font-heading font-bold text-xs uppercase tracking-wider text-rind flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-rind" />
            <span>Verified Sources with Active Dates ({freshSources.length})</span>
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {freshSources.map((source) => (
              <div
                key={source.id}
                className="p-3.5 rounded-xs border border-seed/10 bg-seed/[0.015] flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <h5 className="font-heading font-bold text-xs text-seed truncate">
                    {source.title}
                  </h5>
                  <p className="text-[11px] font-mono text-seed-muted truncate">
                    {source.domain}
                  </p>
                </div>
                <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-xs text-[10px] font-mono bg-rind/15 text-rind border border-rind/25">
                  <Calendar className="w-3 h-3" />
                  {source.detectedCycle || source.detectedDate || 'Active'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
