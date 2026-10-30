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
            Expected decision parameters completely missing from sources or lacking independent corroboration.
          </p>
        </div>
      </div>

      {/* 1. Total Gaps Section */}
      {totalGaps.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <SeedIcon className="w-3.5 h-3.5 fill-current text-seed" />
            <h4 className="font-heading font-bold text-xs uppercase tracking-wider text-seed">
              Total Gaps — Not Found in Any Source ({totalGaps.length})
            </h4>
          </div>

          {/* If single gap, render full-width spotlight layout without awkward vacant half */}
          {totalGaps.length === 1 ? (
            <div className="p-5 sm:p-6 rounded-sm border border-seed/20 border-l-4 border-l-seed bg-pith shadow-2xs">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-2 text-xs">
                    <StatusTag status="gap" />
                    <span className="font-heading font-bold text-xs text-seed">
                      {formatSentenceCase(totalGaps[0].attribute)}
                    </span>
                  </div>
                  <h5 className="font-heading font-extrabold text-base sm:text-lg text-seed leading-snug">
                    Potential Gap: {formatSentenceCase(totalGaps[0].attribute)} is completely missing from all reviewed documents
                  </h5>
                  <p className="text-xs sm:text-sm text-seed-muted leading-relaxed">
                    {totalGaps[0].description}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-seed-muted pt-1">
                    <span className="font-mono font-semibold text-seed">Cross-source verification:</span>
                    <span className="px-2 py-0.5 rounded-2xs bg-seed/5 text-seed border border-seed/15 text-[11px] font-mono">
                      0 sources confirmed
                    </span>
                  </div>
                </div>

                <div className="md:w-80 shrink-0 space-y-3 p-4 rounded-xs bg-seed/[0.03] border border-seed/12 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <span className="font-heading text-xs font-bold text-seed flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-seed" />
                      Recommended Action
                    </span>
                    <p className="text-xs leading-relaxed text-seed-muted">
                      {totalGaps[0].suggestedAction}
                    </p>
                  </div>
                  <div className="pt-2 border-t border-seed/10 flex justify-end">
                    <button
                      type="button"
                      onClick={() => navigate(`/report/${report.id}/evidence/${encodeURIComponent(totalGaps[0].attribute)}`)}
                      className="text-xs font-semibold text-rind hover:underline inline-flex items-center gap-1 cursor-pointer"
                    >
                      Inspect in Evidence Drawer
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {totalGaps.map((gap) => {
                const attrName = formatSentenceCase(gap.attribute);
                return (
                  <div
                    key={gap.id}
                    className="p-5 rounded-sm border border-seed/10 border-l-2 border-l-seed bg-pith flex flex-col justify-between space-y-3.5 shadow-2xs"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between text-xs">
                        <StatusTag status="gap" />
                        <span className="font-sans text-xs text-seed-muted font-medium">
                          {attrName}
                        </span>
                      </div>
                      <h5 className="font-heading font-bold text-sm sm:text-base text-seed leading-snug">
                        Potential gap: {attrName} not found
                      </h5>
                      <p className="text-xs text-seed-muted leading-relaxed">
                        {gap.description}
                      </p>
                    </div>

                    <div className="space-y-3 pt-2 border-t border-seed/10">
                      <div className="p-3 rounded-xs bg-seed/[0.02] border border-seed/10 text-xs text-seed space-y-1">
                        <span className="font-sans text-[11px] font-semibold text-seed block">
                          Recommended Action:
                        </span>
                        <p className="leading-relaxed text-seed-muted">{gap.suggestedAction}</p>
                      </div>

                      <div className="flex justify-end">
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
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 2. Thin Coverage Section */}
      {thinGaps.length > 0 && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-wilt" />
            <h4 className="font-heading font-bold text-xs uppercase tracking-wider text-seed">
              Thin Coverage — Single Source Only ({thinGaps.length})
            </h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {thinGaps.map((gap, idx) => {
              const attrName = formatSentenceCase(gap.attribute);
              const isLastOdd = idx === thinGaps.length - 1 && thinGaps.length % 2 === 1;

              return (
                <div
                  key={gap.id}
                  className={`p-5 rounded-sm border border-seed/10 border-l-2 border-l-wilt bg-pith flex flex-col justify-between space-y-3.5 shadow-2xs ${
                    isLastOdd ? 'md:col-span-2' : ''
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <StatusTag status="uncertain" customLabel="Thin Coverage" />
                      <span className="font-sans text-xs text-seed-muted font-medium">
                        {attrName}
                      </span>
                    </div>

                    <h5 className="font-heading font-bold text-sm sm:text-base text-seed leading-snug">
                      Potential gap: {attrName} has only single-source coverage
                    </h5>
                    <p className="text-xs text-seed-muted leading-relaxed">
                      {gap.description}
                    </p>
                  </div>

                  <div className="space-y-3 pt-2 border-t border-seed/10">
                    <div className="p-3 rounded-xs bg-seed/[0.02] border border-seed/10 text-xs text-seed space-y-1">
                      <span className="font-sans text-[11px] font-semibold text-seed block">
                        Recommended Action:
                      </span>
                      <p className="leading-relaxed text-seed-muted">{gap.suggestedAction}</p>
                    </div>

                    <div className="flex justify-end">
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
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
