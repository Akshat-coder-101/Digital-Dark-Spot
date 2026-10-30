import React from 'react';
import { useReport } from './ReportContext';
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
        icon={<ShieldCheck className="w-7 h-7 text-rind" />}
        title="Zero Information Gaps Detected"
        description="All expected decision parameters were successfully covered with verified evidence across the reviewed sources."
      />
    );
  }

  const totalGaps = report.gaps.filter(g => g.type === 'total_gap');
  const thinGaps = report.gaps.filter(g => g.type === 'thin_coverage');

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between border-b border-seed/10 pb-4">
        <div>
          <h3 className="font-heading font-bold text-lg text-seed">
            Identified Information Gaps ({report.gaps.length})
          </h3>
          <p className="text-xs text-seed-muted">
            Expected parameters missing from sources or lacking independent corroboration.
          </p>
        </div>
      </div>

      {/* Total Gaps Section */}
      {totalGaps.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <SeedIcon className="w-3.5 h-3.5 fill-current text-seed" />
            <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-seed">
              Total Gaps — Not Found in Any Source ({totalGaps.length})
            </h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {totalGaps.map((gap) => (
              <div
                key={gap.id}
                className="p-5 rounded-sm border border-seed/10 border-l-2 border-l-seed bg-pith space-y-3"
              >
                <div className="flex items-center justify-between text-xs">
                  <StatusTag status="gap" />
                  <span className="font-mono text-[11px] text-seed-muted uppercase">
                    {gap.attribute}
                  </span>
                </div>

                <div>
                  <h5 className="font-heading font-bold text-sm sm:text-base text-seed leading-snug">
                    {gap.title}
                  </h5>
                  <p className="text-xs text-seed-muted mt-1 leading-relaxed">
                    {gap.description}
                  </p>
                </div>

                <div className="p-3 rounded-xs bg-seed/[0.02] border border-seed/10 text-xs text-seed space-y-1">
                  <span className="font-mono text-[10px] text-seed-muted uppercase tracking-wider block">
                    Recommended Action:
                  </span>
                  <p className="leading-relaxed">{gap.suggestedAction}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Thin Coverage Section */}
      {thinGaps.length > 0 && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-wilt" />
            <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-seed">
              Thin Coverage — Single Source Only ({thinGaps.length})
            </h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {thinGaps.map((gap) => (
              <div
                key={gap.id}
                className="p-5 rounded-sm border border-seed/10 border-l-2 border-l-wilt bg-pith space-y-3"
              >
                <div className="flex items-center justify-between text-xs">
                  <StatusTag status="uncertain" customLabel="Thin Coverage" />
                  <span className="font-mono text-[11px] text-seed-muted uppercase">
                    {gap.attribute}
                  </span>
                </div>

                <div>
                  <h5 className="font-heading font-bold text-sm sm:text-base text-seed leading-snug">
                    {gap.title}
                  </h5>
                  <p className="text-xs text-seed-muted mt-1 leading-relaxed">
                    {gap.description}
                  </p>
                </div>

                <div className="p-3 rounded-xs bg-seed/[0.02] border border-seed/10 text-xs text-seed space-y-1">
                  <span className="font-mono text-[10px] text-seed-muted uppercase tracking-wider block">
                    Recommended Action:
                  </span>
                  <p className="leading-relaxed">{gap.suggestedAction}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bottom Checklist Nav CTA */}
      <div className="p-4 rounded-sm border border-seed/10 bg-seed/[0.01] flex items-center justify-between">
        <div>
          <h5 className="font-heading font-bold text-sm text-seed">
            Want to verify these gaps systematically?
          </h5>
          <p className="text-xs text-seed-muted">
            The verification checklist organizes next steps by risk priority.
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
      </div>
    </div>
  );
};
