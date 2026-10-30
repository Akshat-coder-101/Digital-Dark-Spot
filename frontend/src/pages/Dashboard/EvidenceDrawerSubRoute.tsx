import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useReport } from './ReportContext';
import { Drawer } from '@/components/ui/drawer';
import { StatusTag } from '@/components/common/StatusTag';
import { Button } from '@/components/ui/button';
import { ExternalLink, CheckCircle2, Calendar, Globe } from 'lucide-react';

export const EvidenceDrawerSubRoute: React.FC = () => {
  const { id, claimId } = useParams<{ id: string; claimId: string }>();
  const navigate = useNavigate();
  const { report } = useReport();

  // Find claim
  const claim = report.claims.find(c => c.id === claimId || c.source_id === claimId);
  // Find associated source
  const source = claim
    ? report.sources.find(s => s.id === claim.source_id)
    : report.sources.find(s => s.id === claimId);

  const handleClose = () => {
    navigate(`/report/${id}/summary`);
  };

  return (
    <Drawer
      open={true}
      onOpenChange={(open) => {
        if (!open) handleClose();
      }}
      title="Evidence & Ground Truth Audit"
      description={`Inspecting ${claim ? `Claim #${claim.id}` : `Source #${claimId}`}`}
    >
      <div className="space-y-6">
        {claim ? (
          <>
            {/* Attribute & Status header */}
            <div className="flex items-center justify-between">
              <StatusTag status="sourced" />
              <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-pith-muted text-seed">
                {claim.attribute}
              </span>
            </div>

            {/* Claim Normalized Value */}
            <div className="space-y-1">
              <span className="text-xs font-bold text-seed-muted uppercase tracking-wider">
                Extracted Claim Value:
              </span>
              <p className="font-heading text-lg font-bold text-seed">
                {claim.value}
              </p>
            </div>

            {/* Verbatim Quote Highlight Box */}
            <div className="p-4 rounded-xl bg-pith-muted/70 border border-border space-y-2">
              <div className="flex items-center justify-between text-xs text-seed-muted">
                <span className="font-bold uppercase tracking-wider text-[10px]">
                  Verbatim Source Excerpt:
                </span>
                <span className="text-rind font-semibold flex items-center gap-1 text-[11px]">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  100% Substring Match
                </span>
              </div>

              <blockquote className="p-3.5 rounded-lg bg-pith-card border-l-4 border-flesh text-sm italic text-seed leading-relaxed shadow-xs">
                "{claim.quote}"
              </blockquote>
            </div>

            {/* Source Origin Details */}
            {source && (
              <div className="p-4 rounded-xl border border-border bg-pith-card space-y-2 text-xs">
                <span className="font-bold uppercase tracking-wider text-[10px] text-seed-muted block">
                  Source Reference:
                </span>
                <div className="space-y-1.5 text-seed">
                  <p className="font-semibold">{source.title}</p>
                  <p className="text-seed-muted flex items-center gap-1.5 font-mono">
                    <Globe className="w-3.5 h-3.5" />
                    {source.domain}
                  </p>
                  <p className="text-seed-muted flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    Date / Cycle: {source.detectedDate || source.detectedCycle || 'Undated'}
                  </p>
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="pt-4 border-t border-border flex flex-col gap-2">
              {source?.url && (
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                >
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1.5"
                  >
                    <span>Open Original Source</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </Button>
              )}

              <Button variant="rind" size="sm" onClick={handleClose}>
                Done Inspecting
              </Button>
            </div>
          </>
        ) : (
          <div className="text-center py-8 space-y-3">
            <p className="text-sm text-seed-muted">
              Claim or source details could not be retrieved for ID "{claimId}".
            </p>
            <Button variant="rind" size="sm" onClick={handleClose}>
              Return to Summary
            </Button>
          </div>
        )}
      </div>
    </Drawer>
  );
};
