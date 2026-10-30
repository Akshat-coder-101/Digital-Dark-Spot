import React from 'react';
import { useReport } from './ReportContext';
import { StatusTag } from '@/components/common/StatusTag';
import { useNavigate } from 'react-router-dom';
import { HelpCircle, ShieldAlert } from 'lucide-react';

export const SummaryTab: React.FC = () => {
  const { report } = useReport();
  const navigate = useNavigate();

  return (
    <div className="space-y-8">
      {/* Executive Summary */}
      <div className="p-6 rounded-sm border border-seed/10 bg-pith space-y-3">
        <div className="flex items-center justify-between border-b border-seed/10 pb-3">
          <div className="space-y-0.5">
            <h3 className="font-heading font-bold text-lg text-seed">
              Executive Synthesis
            </h3>
            <p className="text-xs text-seed-muted">
              Synthesized across {report.metrics.sourcesCount} reviewed documents
            </p>
          </div>
          <StatusTag status="ai_suggested" customLabel="AI Synthesis" />
        </div>
        <p className="text-sm sm:text-base leading-relaxed text-seed font-normal pt-1">
          {report.summary}
        </p>
      </div>

      {/* Verified Claims Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-seed/10 pb-3">
          <div className="flex items-center gap-2">
            <h3 className="font-heading font-bold text-base text-seed">
              Verified Grounded Claims
            </h3>
            <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-xs bg-rind/10 text-rind border border-rind/20">
              {report.claims.length} Verbatim Quotes
            </span>
          </div>
          <span className="text-xs text-seed-muted hidden sm:inline-block">Click any quote to inspect verbatim source context</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {report.claims.map((claim) => (
            <div
              key={claim.id}
              onClick={() => navigate(`/report/${report.id}/evidence/${claim.id}`)}
              className="p-4 rounded-sm border border-seed/10 bg-pith hover:border-rind/40 transition-colors cursor-pointer group flex flex-col justify-between space-y-3"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <StatusTag status="sourced" size="sm" />
                  <span className="font-mono text-[10px] text-seed-muted uppercase">
                    {claim.attribute}
                  </span>
                </div>

                <div>
                  <h4 className="font-heading font-bold text-sm text-seed group-hover:text-rind transition-colors">
                    {claim.value}
                  </h4>
                  <blockquote className="mt-2 p-2.5 rounded-xs bg-seed/[0.02] border-l-2 border-flesh text-xs italic text-seed-muted line-clamp-2">
                    "{claim.quote}"
                  </blockquote>
                </div>
              </div>

              <div className="pt-2 border-t border-seed/10 flex items-center justify-between text-[11px] text-seed-muted">
                <span className="truncate max-w-[200px] font-mono text-[11px]">{claim.source_title}</span>
                <span className="text-rind font-medium group-hover:underline inline-flex items-center gap-1 font-mono text-[11px]">
                  Inspect →
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Open Questions */}
      {report.openQuestions.length > 0 && (
        <div className="p-6 rounded-sm border border-seed/10 bg-pith space-y-4">
          <div className="flex items-center justify-between border-b border-seed/10 pb-3">
            <div className="flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-crack" />
              <h3 className="font-heading font-bold text-base text-seed">Critical Open Questions to Verify</h3>
            </div>
            <span className="text-xs text-seed-muted font-mono">
              {report.openQuestions.length} Identified
            </span>
          </div>

          <ul className="space-y-2.5">
            {report.openQuestions.map((q, idx) => (
              <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-seed">
                <span className="w-4 h-4 rounded-full bg-crack/10 text-crack flex items-center justify-center text-[10px] font-mono font-bold shrink-0 mt-0.5">
                  ?
                </span>
                <span className="leading-relaxed">{q}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Discarded Claims Transparency Banner */}
      <div className="p-4 rounded-sm border border-seed/10 bg-seed/[0.01] flex items-start gap-3 text-xs text-seed-muted">
        <ShieldAlert className="w-4 h-4 text-rind shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <p className="font-semibold text-seed">
            Verbatim Verification Integrity
          </p>
          <p>
            {report.metrics.discardedClaimsCount === 0
              ? 'All candidate claims extracted by the model were 100% verified against raw source text.'
              : `${report.metrics.discardedClaimsCount} unverified candidate claims were strictly discarded because their quotes were not found verbatim in the source texts.`}
          </p>
        </div>
      </div>
    </div>
  );
};
