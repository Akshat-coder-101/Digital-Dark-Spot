import React from 'react';
import { useReport } from './ReportContext';
import { Card } from '@/components/ui/card';
import { StatusTag } from '@/components/common/StatusTag';
import { CrackIcon, VerifiedCheckIcon } from '@/components/common/Icons';
import { EmptyState } from '@/components/ui/empty-state';
import { ExternalLink, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const ConflictsTab: React.FC = () => {
  const { report } = useReport();
  const navigate = useNavigate();

  if (report.conflicts.length === 0) {
    return (
      <EmptyState
        icon={<VerifiedCheckIcon className="w-8 h-8 text-rind" />}
        title="Zero Contradictions Found"
        description="All reviewed sources align on the extracted facts with no conflicting values."
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-heading font-bold text-xl text-seed flex items-center gap-2">
            <CrackIcon className="w-5 h-5 text-crack" />
            Possible Contradictions & Conflicts ({report.conflicts.length})
          </h3>
          <p className="text-xs text-seed-muted">
            Inconsistent or conflicting values detected across different sources for the same parameter.
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {report.conflicts.map((conflict) => (
          <Card key={conflict.id} className="overflow-hidden border-crack/40 shadow-sm">
            {/* Conflict Header */}
            <div className="p-4 bg-crack-subtle/40 border-b border-crack/20 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <StatusTag status="conflict" />
                <span className="font-mono text-xs text-seed font-bold uppercase">
                  {conflict.attribute}
                </span>
              </div>
              <span className="text-xs text-crack font-semibold flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                Possible conflict across 2 sources
              </span>
            </div>

            {/* Two-Column Split Card with Jagged Divider */}
            <div className="grid grid-cols-1 md:grid-cols-11 items-stretch p-6 gap-4 relative">
              {/* Left Column: Source A */}
              <div className="md:col-span-5 flex flex-col justify-between space-y-4 p-4 rounded-xl bg-pith-muted/50 border border-border">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-seed-muted">
                    <span className="font-bold uppercase tracking-wider text-seed">Source A</span>
                    <span className="font-mono text-[11px]">{conflict.sourceA.source_domain}</span>
                  </div>
                  <h4 className="font-heading font-bold text-sm text-seed">
                    {conflict.sourceA.source_title}
                  </h4>
                  {conflict.sourceA.dateStatus && (
                    <span className="inline-block text-[11px] px-2 py-0.5 rounded bg-pith text-seed-muted">
                      Date Status: {conflict.sourceA.dateStatus}
                    </span>
                  )}

                  <div className="pt-2">
                    <span className="text-xs text-seed-muted font-medium block">Reported Value:</span>
                    <span className="font-bold text-sm text-seed">{conflict.sourceA.value}</span>
                  </div>

                  <blockquote className="p-2.5 rounded-lg bg-pith-card border-l-2 border-crack text-xs italic text-seed line-clamp-3">
                    "{conflict.sourceA.quote}"
                  </blockquote>
                </div>

                <div className="pt-2 border-t border-border flex justify-end">
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

              {/* Jagged Divider in Middle */}
              <div className="md:col-span-1 flex flex-col items-center justify-center py-2 md:py-0">
                <div className="hidden md:block w-px h-16 bg-crack/30" />
                <div className="w-8 h-8 rounded-full bg-crack-subtle border-2 border-crack/50 flex items-center justify-center my-1 text-crack shadow-xs">
                  <CrackIcon className="w-4 h-4" />
                </div>
                <div className="hidden md:block w-px h-16 bg-crack/30" />
              </div>

              {/* Right Column: Source B */}
              <div className="md:col-span-5 flex flex-col justify-between space-y-4 p-4 rounded-xl bg-pith-muted/50 border border-border">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-seed-muted">
                    <span className="font-bold uppercase tracking-wider text-seed">Source B</span>
                    <span className="font-mono text-[11px]">{conflict.sourceB.source_domain}</span>
                  </div>
                  <h4 className="font-heading font-bold text-sm text-seed">
                    {conflict.sourceB.source_title}
                  </h4>
                  {conflict.sourceB.dateStatus && (
                    <span className="inline-block text-[11px] px-2 py-0.5 rounded bg-pith text-seed-muted">
                      Date Status: {conflict.sourceB.dateStatus}
                    </span>
                  )}

                  <div className="pt-2">
                    <span className="text-xs text-seed-muted font-medium block">Reported Value:</span>
                    <span className="font-bold text-sm text-seed">{conflict.sourceB.value}</span>
                  </div>

                  <blockquote className="p-2.5 rounded-lg bg-pith-card border-l-2 border-crack text-xs italic text-seed line-clamp-3">
                    "{conflict.sourceB.quote}"
                  </blockquote>
                </div>

                <div className="pt-2 border-t border-border flex justify-end">
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

            {/* Bottom Warning Banner */}
            <div className="px-6 py-3 bg-pith-muted/30 border-t border-border text-xs text-seed-muted flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-crack" />
              <span>
                <strong>Verification Guidance:</strong> Verify using the latest official authority notice before relying on these figures.
              </span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
