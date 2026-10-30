import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useReport } from './ReportContext';
import { EvidenceDrawerMotion } from '@/components/motion/EvidenceDrawerMotion';
import { StatusTag } from '@/components/common/StatusTag';
import { Button } from '@/components/ui/button';
import { ExternalLink, CheckCircle2, Calendar, Globe, X } from 'lucide-react';

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
    <EvidenceDrawerMotion
      open={true}
      onClose={handleClose}
      width="max-w-[440px]"
    >
      <div className="p-6 space-y-6 flex flex-col min-h-full">
        {/* Header bar */}
        <div className="flex items-center justify-between pb-4 border-b border-seed/10">
          <div>
            <span className="font-mono text-[10px] uppercase tracking-wider text-seed-muted block">
              Forensic Evidence Inspection
            </span>
            <h3 className="font-heading font-bold text-lg text-seed">
              {claim ? `Claim #${claim.id}` : `Source #${claimId}`}
            </h3>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 rounded-xs text-seed-muted hover:text-seed hover:bg-seed/5 transition-colors cursor-pointer"
            aria-label="Close drawer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {claim ? (
          <div className="space-y-6 flex-1">
            {/* 1. Status label & Attribute */}
            <div className="flex items-center justify-between">
              <StatusTag status="sourced" />
              <span className="font-mono text-xs px-2 py-0.5 rounded-xs bg-seed/5 text-seed font-semibold border border-seed/10">
                {claim.attribute}
              </span>
            </div>

            {/* 2. Finding / Extracted Value */}
            <div className="space-y-1">
              <span className="font-mono text-[10px] uppercase tracking-wider text-seed-muted block">
                Extracted Fact / Value
              </span>
              <p className="font-heading text-lg font-bold text-seed leading-snug">
                {claim.value}
              </p>
            </div>

            {/* 3. Highlighted Verbatim Quote with Left Border Rule */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono text-[10px] uppercase tracking-wider text-seed-muted">
                  Raw Source Substring
                </span>
                <span className="text-rind text-[11px] font-mono font-semibold inline-flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Verified Verbatim Substring
                </span>
              </div>

              <blockquote className="p-3.5 rounded-sm bg-seed/[0.02] border-l-2 border-flesh text-xs italic text-seed leading-relaxed">
                "{claim.quote}"
              </blockquote>
            </div>

            {/* 4. Source Title, Domain, Date Status */}
            {source && (
              <div className="p-4 rounded-sm border border-seed/10 bg-seed/[0.01] space-y-2 text-xs">
                <span className="font-mono text-[10px] uppercase tracking-wider text-seed-muted block">
                  Ground-Truth Document
                </span>
                <div className="space-y-1.5 text-seed">
                  <p className="font-semibold">{source.title}</p>
                  <p className="text-seed-muted flex items-center gap-1.5 font-mono text-[11px]">
                    <Globe className="w-3.5 h-3.5 opacity-60" />
                    {source.domain}
                  </p>
                  <p className="text-seed-muted flex items-center gap-1.5 font-mono text-[11px]">
                    <Calendar className="w-3.5 h-3.5 opacity-60" />
                    Detected: {source.detectedDate || source.detectedCycle || 'Undated document'}
                  </p>
                </div>
              </div>
            )}

            {/* 5. Action Controls */}
            <div className="pt-6 border-t border-seed/10 flex flex-col gap-2 mt-auto">
              {source?.url && (
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="w-full text-xs"
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

              <Button variant="rind" size="sm" onClick={handleClose} className="w-full text-xs">
                Done Inspecting
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 space-y-3">
            <p className="text-xs text-seed-muted">
              Claim or source details could not be retrieved for identifier "{claimId}".
            </p>
            <Button variant="rind" size="sm" onClick={handleClose}>
              Return to Summary
            </Button>
          </div>
        )}
      </div>
    </EvidenceDrawerMotion>
  );
};
