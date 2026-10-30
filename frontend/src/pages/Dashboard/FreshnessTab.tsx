import React from 'react';
import { useReport } from './ReportContext';
import { StatusTag } from '@/components/common/StatusTag';
import { WiltIcon, VerifiedCheckIcon } from '@/components/common/Icons';
import { EmptyState } from '@/components/ui/empty-state';
import { Calendar } from 'lucide-react';

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-seed/10 pb-4">
        <div>
          <h3 className="font-heading font-bold text-lg text-seed flex items-center gap-2">
            <WiltIcon className="w-4 h-4 text-wilt" />
            <span>Temporal & Freshness Warnings ({report.freshnessWarnings.length})</span>
          </h3>
          <p className="text-xs text-seed-muted">
            Documents flagged as undated, older than 18 months, or belonging to earlier application cycles.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {report.freshnessWarnings.map((warning) => (
          <div
            key={warning.id}
            className="p-5 rounded-sm border border-seed/10 border-l-2 border-l-wilt bg-pith space-y-3"
          >
            <div className="flex items-center justify-between text-xs">
              <StatusTag status="stale" />
              <span className="font-mono text-[11px] text-seed-muted">
                {warning.warningType.replace('_', ' ').toUpperCase()}
              </span>
            </div>

            <div>
              <h4 className="font-heading font-bold text-base text-seed">
                {warning.source_title}
              </h4>
              <p className="text-xs font-mono text-seed-muted mt-0.5">
                Domain: {warning.source_domain}
              </p>
            </div>

            <p className="text-xs text-seed-muted leading-relaxed">
              {warning.reason}
            </p>

            <div className="pt-2 border-t border-seed/10 flex items-center justify-between text-xs text-seed-muted">
              <span className="flex items-center gap-1 font-mono text-[11px]">
                <Calendar className="w-3.5 h-3.5 text-wilt" />
                Detected: {warning.detectedCycle || warning.detectedDate || 'No date found'}
              </span>
              <span className="font-mono text-[11px] font-semibold text-wilt">
                Flagged for verification
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
