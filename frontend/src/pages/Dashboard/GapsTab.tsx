import React from 'react';
import { useReport } from './ReportContext';
import { Card } from '@/components/ui/card';
import { StatusTag } from '@/components/common/StatusTag';
import { SeedIcon } from '@/components/common/Icons';
import { EmptyState } from '@/components/ui/empty-state';
import { ShieldCheck, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const GapsTab: React.FC = () => {
  const { report } = useReport();
  const navigate = useNavigate();

  if (report.gaps.length === 0) {
    return (
      <EmptyState
        icon={<ShieldCheck className="w-8 h-8 text-rind" />}
        title="Zero Information Gaps Detected"
        description="All expected decision parameters were successfully covered with verified evidence across the reviewed sources."
      />
    );
  }

  const totalGaps = report.gaps.filter(g => g.type === 'total_gap');
  const thinGaps = report.gaps.filter(g => g.type === 'thin_coverage');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-heading font-bold text-xl text-seed">
            Identified Information Gaps ({report.gaps.length})
          </h3>
          <p className="text-xs text-seed-muted">
            Expected parameters missing from sources or lacking independent corroboration.
          </p>
        </div>
      </div>

      {/* Total Gaps Section */}
      {totalGaps.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-seed-muted flex items-center gap-1.5">
            <SeedIcon className="w-3.5 h-3.5 fill-current" />
            Total Gaps — Not Found in Any Source ({totalGaps.length})
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {totalGaps.map((gap) => (
              <Card key={gap.id} className="p-5 border-l-4 border-l-seed hover:shadow-md transition-shadow">
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <StatusTag status="gap" />
                    <span className="font-mono text-[11px] text-seed-muted uppercase">
                      {gap.attribute}
                    </span>
                  </div>

                  <div>
                    <h5 className="font-heading font-bold text-base text-seed leading-snug">
                      {gap.title}
                    </h5>
                    <p className="text-xs text-seed-muted mt-1 leading-relaxed">
                      {gap.description}
                    </p>
                  </div>

                  <div className="p-2.5 rounded-xl bg-pith-muted/60 border border-border text-xs text-seed space-y-1">
                    <span className="font-bold text-[11px] text-seed-muted uppercase tracking-wider block">
                      Recommended Action:
                    </span>
                    <p>{gap.suggestedAction}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Thin Coverage Section */}
      {thinGaps.length > 0 && (
        <div className="space-y-3 pt-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-seed-muted flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-wilt" />
            Thin Coverage — Single Source Only ({thinGaps.length})
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {thinGaps.map((gap) => (
              <Card key={gap.id} className="p-5 border-l-4 border-l-wilt hover:shadow-md transition-shadow">
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <StatusTag status="uncertain" customLabel="Thin Coverage" />
                    <span className="font-mono text-[11px] text-seed-muted uppercase">
                      {gap.attribute}
                    </span>
                  </div>

                  <div>
                    <h5 className="font-heading font-bold text-base text-seed leading-snug">
                      {gap.title}
                    </h5>
                    <p className="text-xs text-seed-muted mt-1 leading-relaxed">
                      {gap.description}
                    </p>
                  </div>

                  <div className="p-2.5 rounded-xl bg-pith-muted/60 border border-border text-xs text-seed space-y-1">
                    <span className="font-bold text-[11px] text-seed-muted uppercase tracking-wider block">
                      Recommended Action:
                    </span>
                    <p>{gap.suggestedAction}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Bottom Checklist Nav CTA */}
      <Card className="p-5 bg-pith-muted/40 border-border flex items-center justify-between">
        <div>
          <h5 className="font-heading font-bold text-sm text-seed">
            Want to verify these gaps systematically?
          </h5>
          <p className="text-xs text-seed-muted">
            The generated action checklist organizes verification steps by priority.
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate(`/report/${report.id}/checklist`)}
          className="text-xs font-bold text-rind hover:underline inline-flex items-center gap-1 cursor-pointer"
        >
          View Checklist
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </Card>
    </div>
  );
};
