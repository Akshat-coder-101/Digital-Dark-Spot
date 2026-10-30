import React from 'react';
import { useReport } from './ReportContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { StatusTag } from '@/components/common/StatusTag';
import { useNavigate } from 'react-router-dom';
import { HelpCircle, ExternalLink, ShieldAlert } from 'lucide-react';

export const SummaryTab: React.FC = () => {
  const { report } = useReport();
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      {/* Executive Summary */}
      <Card className="p-6">
        <CardHeader className="p-0 mb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">Executive Synthesis</CardTitle>
            <StatusTag status="ai_suggested" customLabel="AI Synthesis" />
          </div>
          <CardDescription className="text-xs">
            Synthesized across {report.metrics.sourcesCount} reviewed documents
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <p className="text-sm md:text-base leading-relaxed text-seed font-medium">
            {report.summary}
          </p>
        </CardContent>
      </Card>

      {/* Verified Claims Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-heading font-bold text-lg text-seed flex items-center gap-2">
            <span>Verified Grounded Claims</span>
            <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-full bg-rind/15 text-rind">
              {report.claims.length} Verbatim Quotes
            </span>
          </h3>
          <span className="text-xs text-seed-muted">Click any quote to inspect verbatim source context</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {report.claims.map((claim) => (
            <Card
              key={claim.id}
              onClick={() => navigate(`/report/${report.id}/evidence/${claim.id}`)}
              className="p-4 hover:border-rind/50 transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <StatusTag status="sourced" size="sm" />
                  <span className="font-mono text-[11px] text-seed-muted uppercase">
                    {claim.attribute}
                  </span>
                </div>

                <div>
                  <h4 className="font-heading font-bold text-sm text-seed group-hover:text-rind transition-colors">
                    {claim.value}
                  </h4>
                  <blockquote className="mt-1.5 p-2 rounded-lg bg-pith-muted/60 border-l-2 border-flesh text-xs italic text-seed-muted line-clamp-2">
                    "{claim.quote}"
                  </blockquote>
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-border flex items-center justify-between text-[11px] text-seed-muted">
                <span className="truncate max-w-[200px]">{claim.source_title}</span>
                <span className="text-rind font-medium group-hover:underline flex items-center gap-1">
                  Inspect
                  <ExternalLink className="w-3 h-3" />
                </span>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Open Questions */}
      {report.openQuestions.length > 0 && (
        <Card className="p-6">
          <CardHeader className="p-0 mb-4">
            <div className="flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-crack" />
              <CardTitle className="text-lg">Critical Open Questions to Verify</CardTitle>
            </div>
            <CardDescription className="text-xs">
              Questions left ambiguous or unaddressed across all reviewed documents
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <ul className="space-y-2.5">
              {report.openQuestions.map((q, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-sm text-seed">
                  <span className="w-5 h-5 rounded-full bg-crack/15 text-crack flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    ?
                  </span>
                  <span className="leading-relaxed">{q}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Discarded Claims Transparency Banner */}
      <div className="p-4 rounded-xl border border-border bg-pith-card/40 flex items-start gap-3 text-xs text-seed-muted">
        <ShieldAlert className="w-4 h-4 text-rind shrink-0 mt-0.5" />
        <div className="space-y-1">
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
