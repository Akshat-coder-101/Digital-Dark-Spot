import React from 'react';
import { useReport } from './ReportContext';
import { StatusTag } from '@/components/common/StatusTag';
import { SeedIcon } from '@/components/common/Icons';
import { EmptyState } from '@/components/ui/empty-state';
import { ShieldCheck, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

function formatSentenceCase(str: string): string {
  if (!str) return '';
  const clean = str.replace(/_/g, ' ').trim();
  return clean.charAt(0).toUpperCase() + clean.slice(1).toLowerCase();
}

export const GapsTab: React.FC = () => {
  const { report } = useReport();
  const navigate = useNavigate();

  if (report.gaps.length === 0) {
    return (
      <EmptyState
        icon={<ShieldCheck className="w-7 h-7 text-rind" />}
        title="No potential gaps found in the sources reviewed"
        description="All expected parameters in this audit pass were identified in the reviewed primary documents."
      />
    );
  }

  const totalGaps = report.gaps.filter((g) => g.type === 'total_gap');
  const thinGaps = report.gaps.filter((g) => g.type === 'thin_coverage');

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between border-b border-seed/10 pb-4">
        <div>
          <h3 className="font-heading font-bold text-lg text-seed">
            Potential Information Gaps ({report.gaps.length})
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
            <h4 className="font-heading font-bold text-xs uppercase tracking-wider text-seed">
              Total Gaps — Not Found in Any Source ({totalGaps.length})
            </h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {totalGaps.map((gap) => {
              const attrName = formatSentenceCase(gap.attribute);

              return (
                <div
                  key={gap.id}
                  className="p-5 rounded-sm border border-seed/10 border-l-2 border-l-seed bg-pith space-y-3.5 shadow-2xs"
                >
                  <div className="flex items-center justify-between text-xs">
                    <StatusTag status="gap" />
                    <span className="font-sans text-xs text-seed-muted font-medium">
                      {attrName}
                    </span>
                  </div>

                  <div>
                    <h5 className="font-heading font-bold text-sm sm:text-base text-seed leading-snug">
                      Potential gap: {attrName} not found in the sources reviewed
                    </h5>
                    <p className="text-xs text-seed-muted mt-1 leading-relaxed">
                      {gap.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-[11px] font-sans border-t border-seed/10 pt-2 text-seed-muted">
                    <span>Cross-source verification:</span>
                    <span className="text-seed-muted/80 italic">0 sources confirmed</span>
                  </div>

                  <div className="p-3 rounded-xs bg-seed/[0.02] border border-seed/10 text-xs text-seed space-y-1">
                    <span className="font-sans text-[11px] font-semibold text-seed block">
                      Recommended Action:
                    </span>
                    <p className="leading-relaxed text-seed-muted">{gap.suggestedAction}</p>
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      onClick={() => navigate(`/report/${report.id}/evidence/${encodeURIComponent(gap.attribute)}`)}
                      className="text-xs font-semibold text-rind hover:underline inline-flex items-center gap-1 cursor-pointer"
                    >
                      Inspect in Evidence Drawer
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Thin Coverage Section */}
      {thinGaps.length > 0 && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-wilt" />
            <h4 className="font-heading font-bold text-xs uppercase tracking-wider text-seed">
              Thin Coverage — Single Source Only ({thinGaps.length})
            </h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {thinGaps.map((gap) => {
              const attrName = formatSentenceCase(gap.attribute);

              return (
                <div
                  key={gap.id}
                  className="p-5 rounded-sm border border-seed/10 border-l-2 border-l-wilt bg-pith space-y-3.5 shadow-2xs"
                >
                  <div className="flex items-center justify-between text-xs">
                    <StatusTag status="uncertain" customLabel="Thin Coverage" />
                    <span className="font-sans text-xs text-seed-muted font-medium">
                      {attrName}
                    </span>
                  </div>

                  <div>
                    <h5 className="font-heading font-bold text-sm sm:text-base text-seed leading-snug">
                      Potential gap: {attrName} has only single-source coverage
                    </h5>
                    <p className="text-xs text-seed-muted mt-1 leading-relaxed">
                      {gap.description}
                    </p>
                  </div>

                  <div className="p-3 rounded-xs bg-seed/[0.02] border border-seed/10 text-xs text-seed space-y-1">
                    <span className="font-sans text-[11px] font-semibold text-seed block">
                      Recommended Action:
                    </span>
                    <p className="leading-relaxed text-seed-muted">{gap.suggestedAction}</p>
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      onClick={() => navigate(`/report/${report.id}/evidence/${encodeURIComponent(gap.attribute)}`)}
                      className="text-xs font-semibold text-rind hover:underline inline-flex items-center gap-1 cursor-pointer"
                    >
                      Inspect in Evidence Drawer
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
