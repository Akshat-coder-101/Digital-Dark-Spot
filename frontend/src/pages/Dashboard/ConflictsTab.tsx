import React from 'react';
import { useReport } from './ReportContext';
import { StatusTag } from '@/components/common/StatusTag';
import { CrackIcon, VerifiedCheckIcon } from '@/components/common/Icons';
import { EmptyState } from '@/components/ui/empty-state';
import { ExternalLink, AlertTriangle, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

function formatSentenceCase(str: string): string {
  if (!str) return '';
  const clean = str.replace(/_/g, ' ').trim();
  return clean.charAt(0).toUpperCase() + clean.slice(1).toLowerCase();
}

export const ConflictsTab: React.FC = () => {
  const { report } = useReport();
  const navigate = useNavigate();

  if (report.conflicts.length === 0) {
    return (
      <EmptyState
        icon={<VerifiedCheckIcon className="w-7 h-7 text-rind" />}
        title="No possible conflicts found in the sources reviewed"
        description="All reviewed sources align on the extracted parameters with no conflicting values detected."
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
        {report.conflicts.map((conflict) => {
          const claimA = report.claims.find(c =>
            (c.attribute === conflict.attribute || c.original_attribute === conflict.attribute) &&
            c.source_id === conflict.sourceA.source_id
          );
          const claimB = report.claims.find(c =>
            (c.attribute === conflict.attribute || c.original_attribute === conflict.attribute) &&
            c.source_id === conflict.sourceB.source_id
          );

          const targetA = claimA?.id || `${conflict.attribute}:${conflict.sourceA.source_id}`;
          const targetB = claimB?.id || `${conflict.attribute}:${conflict.sourceB.source_id}`;

          const isSourceAOfficial =
            conflict.sourceA.source_domain.includes('.gov') ||
            conflict.sourceA.source_domain.includes('.nic') ||
            conflict.sourceA.source_domain.includes('.edu');

          const isSourceBOfficial =
            conflict.sourceB.source_domain.includes('.gov') ||
            conflict.sourceB.source_domain.includes('.nic') ||
            conflict.sourceB.source_domain.includes('.edu');

          return (
            <div
              key={conflict.id}
              className="border border-seed/10 rounded-sm bg-pith overflow-hidden shadow-xs space-y-0"
            >
              {/* Conflict Header */}
              <div className="px-5 py-3.5 border-b border-seed/10 bg-seed/[0.02] flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <StatusTag status="conflict" />
                  <span className="font-heading text-sm text-seed font-extrabold">
                    {formatSentenceCase(conflict.attribute)}
                  </span>
                </div>
                <span className="text-xs font-mono text-crack font-bold inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-xs bg-crack/10 border border-crack/20">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Possible conflict across 2 sources
                </span>
              </div>

              {/* Side-by-Side Comparison Grid */}
              <div className="relative p-5 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-5 items-stretch">
                {/* Central VS Badge (Hidden on mobile) */}
                <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-pith border border-crack/40 shadow-sm items-center justify-center font-heading font-extrabold text-xs text-crack tracking-tight">
                  VS
                </div>

                {/* Left Side: Source A */}
                <div className="flex flex-col justify-between space-y-4 p-4.5 rounded-sm border border-seed/10 border-l-3 border-l-crack bg-seed/[0.01]">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-1.5">
                        {isSourceAOfficial ? (
                          <span className="px-2 py-0.5 rounded-2xs bg-rind/15 text-rind border border-rind/25 text-[10px] font-mono font-bold flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3" />
                            Official Source (A)
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-2xs bg-seed/10 text-seed border border-seed/15 text-[10px] font-mono font-semibold">
                            Source (A)
                          </span>
                        )}
                        <span className="font-mono text-[11px] text-seed-muted">
                          {conflict.sourceA.source_domain}
                        </span>
                      </div>

                      {conflict.sourceA.dateStatus && (
                        <span className="text-[10px] font-mono text-seed-muted">
                          {conflict.sourceA.dateStatus}
                        </span>
                      )}
                    </div>

                    <h4 className="font-heading font-bold text-sm text-seed leading-snug">
                      {conflict.sourceA.source_title}
                    </h4>

                    {/* Reported Value Box */}
                    <div className="p-3 rounded-xs bg-crack/[0.06] border border-crack/30 space-y-1">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-crack font-bold block">
                        Reported Requirement:
                      </span>
                      <div className="font-heading font-extrabold text-sm sm:text-base text-seed">
                        {conflict.sourceA.value}
                      </div>
                    </div>

                    {/* Verbatim Excerpt */}
                    <blockquote className="p-3 rounded-xs bg-seed/[0.025] border-l-2 border-seed/20 text-xs italic text-seed leading-relaxed font-sans">
                      &ldquo;{conflict.sourceA.quote}&rdquo;
                    </blockquote>
                  </div>

                  <div className="pt-2 border-t border-seed/10 flex justify-end">
                    <button
                      type="button"
                      onClick={() => navigate(`/report/${report.id}/evidence/${encodeURIComponent(targetA)}`)}
                      className="text-xs font-semibold text-rind hover:underline inline-flex items-center gap-1 cursor-pointer"
                    >
                      Inspect Source Evidence
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Right Side: Source B */}
                <div className="flex flex-col justify-between space-y-4 p-4.5 rounded-sm border border-seed/10 border-l-3 border-l-crack bg-seed/[0.01]">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-1.5">
                        {isSourceBOfficial ? (
                          <span className="px-2 py-0.5 rounded-2xs bg-rind/15 text-rind border border-rind/25 text-[10px] font-mono font-bold flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3" />
                            Official Source (B)
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-2xs bg-crack/15 text-crack border border-crack/25 text-[10px] font-mono font-semibold">
                            Secondary Guide (B)
                          </span>
                        )}
                        <span className="font-mono text-[11px] text-seed-muted">
                          {conflict.sourceB.source_domain}
                        </span>
                      </div>

                      {conflict.sourceB.dateStatus && (
                        <span className="text-[10px] font-mono text-seed-muted">
                          {conflict.sourceB.dateStatus}
                        </span>
                      )}
                    </div>

                    <h4 className="font-heading font-bold text-sm text-seed leading-snug">
                      {conflict.sourceB.source_title}
                    </h4>

                    {/* Reported Value Box */}
                    <div className="p-3 rounded-xs bg-crack/[0.06] border border-crack/30 space-y-1">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-crack font-bold block">
                        Reported Requirement:
                      </span>
                      <div className="font-heading font-extrabold text-sm sm:text-base text-seed">
                        {conflict.sourceB.value}
                      </div>
                    </div>

                    {/* Verbatim Excerpt */}
                    <blockquote className="p-3 rounded-xs bg-seed/[0.025] border-l-2 border-seed/20 text-xs italic text-seed leading-relaxed font-sans">
                      &ldquo;{conflict.sourceB.quote}&rdquo;
                    </blockquote>
                  </div>

                  <div className="pt-2 border-t border-seed/10 flex justify-end">
                    <button
                      type="button"
                      onClick={() => navigate(`/report/${report.id}/evidence/${encodeURIComponent(targetB)}`)}
                      className="text-xs font-semibold text-rind hover:underline inline-flex items-center gap-1 cursor-pointer"
                    >
                      Inspect Source Evidence
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Actionable Resolution Banner */}
              <div className="px-5 py-3 border-t border-seed/10 bg-seed/[0.02] flex items-center justify-between flex-wrap gap-2 text-xs">
                <div className="flex items-center gap-2 text-seed">
                  <span className="w-2 h-2 rounded-full bg-crack" />
                  <span className="font-heading font-bold text-seed">Resolution Guidance:</span>
                  <span className="text-seed-muted">
                    Conflicting requirements for <strong className="text-seed">{formatSentenceCase(conflict.attribute)}</strong> detected. Always prioritize the official portal (<span className="font-mono text-rind font-semibold">{conflict.sourceA.source_domain}</span>) before applying.
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
