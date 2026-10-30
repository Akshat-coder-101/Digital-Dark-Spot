import React from 'react';
import { useReport } from './ReportContext';
import { StatusTag } from '@/components/common/StatusTag';
import { CrackIcon, VerifiedCheckIcon } from '@/components/common/Icons';
import { CrackLineDraw } from '@/components/motion/CrackLineDraw';
import { EmptyState } from '@/components/ui/empty-state';
import { ExternalLink, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const ConflictsTab: React.FC = () => {
  const { report } = useReport();
  const navigate = useNavigate();

  if (report.conflicts.length === 0) {
    return (
      <EmptyState
        icon={<VerifiedCheckIcon className="w-7 h-7 text-rind" />}
        title="Zero Contradictions Found"
        description="All reviewed sources align on the extracted parameters with no conflicting values."
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-seed/10 pb-4">
        <div>
          <h3 className="font-heading font-bold text-lg text-seed flex items-center gap-2">
            <CrackIcon className="w-4 h-4 text-crack" />
            <span>Possible Contradictions & Conflicts ({report.conflicts.length})</span>
          </h3>
          <p className="text-xs text-seed-muted">
            Inconsistent or conflicting values detected across different sources for the same parameter.
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {report.conflicts.map((conflict) => (
          <div
            key={conflict.id}
            className="border border-seed/10 rounded-sm bg-pith overflow-hidden"
          >
            {/* Conflict Top Header */}
            <div className="px-5 py-3 border-b border-seed/10 bg-seed/[0.02] flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <StatusTag status="conflict" />
                <span className="font-mono text-xs text-seed font-bold uppercase tracking-wider">
                  {conflict.attribute}
                </span>
              </div>
              <span className="text-[11px] font-mono text-crack font-semibold inline-flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                Possible conflict across 2 sources
              </span>
            </div>

            {/* Split Comparison Grid */}
            <div className="grid grid-cols-1 md:grid-cols-11 items-stretch p-5 gap-4">
              {/* Left Column: Source A */}
              <div className="md:col-span-5 flex flex-col justify-between space-y-3 p-4 rounded-xs border-l-2 border-l-crack bg-seed/[0.01]">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-seed-muted font-mono">
                    <span className="font-bold uppercase tracking-wider text-seed">Source A</span>
                    <span className="text-[11px]">{conflict.sourceA.source_domain}</span>
                  </div>
                  <h4 className="font-heading font-bold text-sm text-seed">
                    {conflict.sourceA.source_title}
                  </h4>
                  {conflict.sourceA.dateStatus && (
                    <span className="inline-block text-[10px] font-mono px-1.5 py-0.2 rounded-xs bg-pith text-seed-muted border border-seed/10">
                      Date Status: {conflict.sourceA.dateStatus}
                    </span>
                  )}

                  <div className="pt-2">
                    <span className="text-[11px] font-mono uppercase tracking-wider text-seed-muted block">Reported Value:</span>
                    <span className="font-bold text-sm text-seed">{conflict.sourceA.value}</span>
                  </div>

                  <blockquote className="p-2.5 rounded-xs bg-seed/[0.02] border-l border-crack text-xs italic text-seed line-clamp-3">
                    "{conflict.sourceA.quote}"
                  </blockquote>
                </div>

                <div className="pt-2 border-t border-seed/10 flex justify-end">
                  <button
                    type="button"
                    onClick={() => navigate(`/report/${report.id}/evidence/${conflict.sourceA.source_id}`)}
                    className="text-xs font-semibold text-rind hover:underline inline-flex items-center gap-1 cursor-pointer"
                  >
                    Inspect Quote Evidence
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Fracture Divider in Middle */}
              <div className="md:col-span-1 flex flex-col items-center justify-center py-2 md:py-0">
                <div className="hidden md:block w-[1px] h-10 bg-seed/10" />
                <div className="my-1 text-crack flex items-center justify-center">
                  <CrackLineDraw width={60} height={28} strokeWidth={2.5} />
                </div>
                <div className="hidden md:block w-[1px] h-10 bg-seed/10" />
              </div>

              {/* Right Column: Source B */}
              <div className="md:col-span-5 flex flex-col justify-between space-y-3 p-4 rounded-xs border-l-2 border-l-crack bg-seed/[0.01]">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-seed-muted font-mono">
                    <span className="font-bold uppercase tracking-wider text-seed">Source B</span>
                    <span className="text-[11px]">{conflict.sourceB.source_domain}</span>
                  </div>
                  <h4 className="font-heading font-bold text-sm text-seed">
                    {conflict.sourceB.source_title}
                  </h4>
                  {conflict.sourceB.dateStatus && (
                    <span className="inline-block text-[10px] font-mono px-1.5 py-0.2 rounded-xs bg-pith text-seed-muted border border-seed/10">
                      Date Status: {conflict.sourceB.dateStatus}
                    </span>
                  )}

                  <div className="pt-2">
                    <span className="text-[11px] font-mono uppercase tracking-wider text-seed-muted block">Reported Value:</span>
                    <span className="font-bold text-sm text-seed">{conflict.sourceB.value}</span>
                  </div>

                  <blockquote className="p-2.5 rounded-xs bg-seed/[0.02] border-l border-crack text-xs italic text-seed line-clamp-3">
                    "{conflict.sourceB.quote}"
                  </blockquote>
                </div>

                <div className="pt-2 border-t border-seed/10 flex justify-end">
                  <button
                    type="button"
                    onClick={() => navigate(`/report/${report.id}/evidence/${conflict.sourceB.source_id}`)}
                    className="text-xs font-semibold text-rind hover:underline inline-flex items-center gap-1 cursor-pointer"
                  >
                    Inspect Quote Evidence
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>

            {/* Bottom Verification Guidance */}
            <div className="px-5 py-2.5 bg-seed/[0.02] border-t border-seed/10 text-xs text-seed-muted flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-crack" />
              <span>
                <strong className="text-seed">Verification Guidance:</strong> Cross-examine the original notices from both authorities before relying on either value.
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
