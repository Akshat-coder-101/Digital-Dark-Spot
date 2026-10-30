import React from 'react';
import { useReport } from './ReportContext';
import { Card } from '@/components/ui/card';
import { StatusTag } from '@/components/common/StatusTag';
import { WiltIcon, VerifiedCheckIcon } from '@/components/common/Icons';
import { EmptyState } from '@/components/ui/empty-state';
import { Calendar } from 'lucide-react';

export const FreshnessTab: React.FC = () => {
  const { report } = useReport();

  if (report.freshnessWarnings.length === 0) {
    return (
      <EmptyState
        icon={<VerifiedCheckIcon className="w-8 h-8 text-rind" />}
        title="All Sources are Fresh & Dated"
        description="All reviewed documents have current, verified dates within the last 18 months."
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-heading font-bold text-xl text-seed flex items-center gap-2">
            <WiltIcon className="w-5 h-5 text-wilt" />
            Temporal & Freshness Warnings ({report.freshnessWarnings.length})
          </h3>
          <p className="text-xs text-seed-muted">
            Documents flagged as undated, older than 18 months, or belonging to earlier application cycles.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {report.freshnessWarnings.map((warning) => (
          <Card key={warning.id} className="p-5 border-l-4 border-l-wilt space-y-3">
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

            <div className="pt-2 border-t border-border flex items-center justify-between text-xs text-seed-muted">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-wilt" />
                Detected: {warning.detectedCycle || warning.detectedDate || 'No date found'}
              </span>
              <span className="font-semibold text-wilt">
                Flagged for verification
              </span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
