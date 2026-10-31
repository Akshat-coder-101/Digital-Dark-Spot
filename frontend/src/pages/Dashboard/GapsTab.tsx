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

  // Group gaps by attribute to reduce repetitive clutter
  const gapsByAttribute = React.useMemo(() => {
    const map = new Map<string, typeof report.gaps>();
    for (const g of report.gaps) {
      const list = map.get(g.attribute) || [];
      list.push(g);
      map.set(g.attribute, list);
    }
    return Array.from(map.entries());
  }, [report.gaps]);

  if (report.gaps.length === 0) {
    return (
      <EmptyState
        icon={<ShieldCheck className="w-7 h-7 text-rind" />}
        title="No potential gaps found in the sources reviewed"
        description="All expected parameters in this audit pass were identified in the reviewed primary documents."
      />
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between border-b border-seed/10 pb-4">
        <div>
          <h3 className="font-heading font-bold text-lg text-seed">
            Potential Information Gaps ({report.gaps.length} across {gapsByAttribute.length} attributes)
          </h3>
          <p className="text-xs text-seed-muted">
            Expected decision parameters completely missing from sources or lacking independent corroboration, grouped by attribute.
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {gapsByAttribute.map(([attr, attrGaps]) => {
          const attrLabel = formatSentenceCase(attr);
          return (
            <div key={attr} className="rounded-sm border border-seed/10 bg-pith overflow-hidden shadow-2xs">
              <div className="px-5 py-3 border-b border-seed/10 bg-seed/2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <SeedIcon className="w-3.5 h-3.5 fill-current text-seed" />
                  <h4 className="font-heading font-bold text-sm text-seed">
                    Attribute: {attrLabel}
                  </h4>
                </div>
                <span className="font-mono text-xs text-seed-muted">
                  {attrGaps.length} gap signal{attrGaps.length === 1 ? '' : 's'}
                </span>
              </div>

              <div className="p-5 divide-y divide-seed/10 space-y-4">
                {attrGaps.map((gap, gIdx) => (
                  <div key={gap.id || gIdx} className={`pt-4 first:pt-0 flex flex-col md:flex-row md:items-start justify-between gap-5`}>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <StatusTag status={gap.type === 'total_gap' ? 'gap' : 'single_source'} />
                        <span className="text-[11px] font-mono text-seed-muted">
                          {gap.type === 'total_gap' ? 'Not found in any source' : 'Thin single-source coverage'}
                        </span>
                      </div>
                      <h5 className="font-heading font-bold text-sm text-seed">
                        {gap.title || `Potential gap in ${attrLabel}`}
                      </h5>
                      <p className="text-xs text-seed-muted leading-relaxed">
                        {gap.description}
                      </p>
                    </div>

                    <div className="md:w-80 shrink-0 space-y-2 p-3.5 rounded-xs bg-seed/2.5 border border-seed/10">
                      <span className="font-sans text-[11px] font-semibold text-seed block">
                        Recommended Action:
                      </span>
                      <p className="text-xs text-seed-muted leading-relaxed">
                        {gap.suggestedAction}
                      </p>
                      <div className="pt-2 border-t border-seed/10 flex justify-end">
                        <button
                          type="button"
                          onClick={() => navigate(`/report/${report.id}/evidence/${encodeURIComponent(gap.attribute)}`)}
                          className="text-xs font-semibold text-rind hover:underline inline-flex items-center gap-1 cursor-pointer"
                        >
                          Inspect Evidence
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
