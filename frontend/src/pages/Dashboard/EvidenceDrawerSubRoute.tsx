import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useReport } from './ReportContext';
import { EvidenceDrawerMotion } from '@/components/motion/EvidenceDrawerMotion';
import { StatusTag } from '@/components/common/StatusTag';
import { SeedIcon } from '@/components/common/Icons';
import { Button } from '@/components/ui/button';
import { ExternalLink, CheckCircle2, Calendar, Globe, X, AlertCircle } from 'lucide-react';

export const EvidenceDrawerSubRoute: React.FC = () => {
  const { claimId } = useParams<{ claimId: string }>();
  const navigate = useNavigate();
  const { report } = useReport();

  // 1. Try finding claim
  const claim = report.claims.find(c => c.id === claimId || c.source_id === claimId || c.attribute === claimId);
  // 2. Try finding associated source
  const source = claim
    ? report.sources.find(s => s.id === claim.source_id)
    : report.sources.find(s => s.id === claimId);

  // 3. Try finding matching gap or matrix row for an attribute
  const gap = report.gaps.find(g => g.id === claimId || g.attribute === claimId);
  const matrixRow = report.coverageMatrix.find(m => m.attribute === claimId);

  const handleClose = () => {
    // Navigate back to the previous tab or default to summary
    navigate(-1);
  };

  return (
    <EvidenceDrawerMotion
      open={true}
      onClose={handleClose}
      width="max-w-[440px]"
    >
      <div className="p-6 space-y-6 flex flex-col min-h-full bg-pith">
        {/* Header bar */}
        <div className="flex items-center justify-between pb-4 border-b border-seed/10">
          <div>
            <span className="font-mono text-[10px] uppercase tracking-wider text-seed-muted block">
              Forensic Evidence Inspection
            </span>
            <h3 className="font-heading font-bold text-base sm:text-lg text-seed">
              {claim
                ? `Evidence Claim #${claim.id}`
                : gap || matrixRow
                ? `Parameter: ${gap?.attribute || matrixRow?.attribute}`
                : `Document #${claimId}`}
            </h3>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 rounded-xs text-seed-muted hover:text-seed hover:bg-seed/5 transition-colors cursor-pointer"
            aria-label="Close evidence drawer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* CASE A: Claim found */}
        {claim ? (
          <div className="space-y-6 flex-1">
            {/* 1. Status label */}
            <div className="flex items-center justify-between">
              <StatusTag status="sourced" />
              <span className="font-mono text-xs px-2 py-0.5 rounded-xs bg-seed/5 text-seed font-semibold border border-seed/10">
                {claim.attribute}
              </span>
            </div>

            {/* 2. One-line finding */}
            <div className="space-y-1">
              <span className="font-mono text-[10px] uppercase tracking-wider text-seed-muted block">
                Extracted Finding
              </span>
              <p className="font-heading text-lg font-bold text-seed leading-snug">
                {claim.value}
              </p>
            </div>

            {/* 3. Verbatim quote highlighted within surrounding context */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono text-[10px] uppercase tracking-wider text-seed-muted">
                  Verified Raw Substring
                </span>
                <span className="text-rind text-[11px] font-mono font-semibold inline-flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Verbatim Substring Match
                </span>
              </div>

              <blockquote className="p-4 rounded-xs bg-seed/[0.02] border-l-2 border-flesh text-xs italic text-seed leading-relaxed shadow-xs">
                &ldquo;{claim.quote}&rdquo;
              </blockquote>
            </div>

            {/* 4. Source Title, Domain, Date Status */}
            {source && (
              <div className="p-4 rounded-xs border border-seed/10 bg-seed/[0.015] space-y-2.5 text-xs">
                <span className="font-mono text-[10px] uppercase tracking-wider text-seed-muted block">
                  Ground-Truth Source
                </span>
                <div className="space-y-1.5 text-seed">
                  <p className="font-semibold text-sm">{source.title}</p>
                  <p className="text-seed-muted flex items-center gap-1.5 font-mono text-[11px]">
                    <Globe className="w-3.5 h-3.5 opacity-60" />
                    <span>{source.domain}</span>
                    <span>•</span>
                    <span>{source.type === 'url' ? 'Web URL' : 'Pasted text'}</span>
                  </p>
                  <p className="text-seed-muted flex items-center gap-1.5 font-mono text-[11px]">
                    <Calendar className="w-3.5 h-3.5 opacity-60" />
                    <span>Date status: {source.detectedDate || source.detectedCycle || 'Undated document'}</span>
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
                    className="flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>Open Original Source</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </Button>
              )}

              <Button variant="rind" size="sm" onClick={handleClose} className="w-full text-xs cursor-pointer">
                Done Inspecting
              </Button>
            </div>
          </div>
        ) : gap || matrixRow ? (
          /* CASE B: Gap / Missing Parameter */
          <div className="space-y-6 flex-1">
            {/* 1. Status label */}
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-xs text-xs font-mono font-bold bg-seed text-pith">
                <SeedIcon className="w-3 h-3 fill-current" />
                <span>Potential Gap</span>
              </span>
              <span className="font-mono text-xs px-2 py-0.5 rounded-xs bg-seed/5 text-seed font-semibold border border-seed/10">
                {gap?.attribute || matrixRow?.attribute}
              </span>
            </div>

            {/* 2. One-line finding */}
            <div className="space-y-1">
              <span className="font-mono text-[10px] uppercase tracking-wider text-seed-muted block">
                Gap Finding
              </span>
              <p className="font-heading text-base sm:text-lg font-bold text-seed leading-snug">
                Potential gap: {matrixRow?.attributeLabel || gap?.attribute || claimId} not found in the sources reviewed
              </p>
            </div>

            {/* 3. Description / Explanation */}
            <div className="p-3.5 rounded-xs bg-seed/[0.02] border border-seed/10 space-y-1.5">
              <span className="text-[10px] font-mono uppercase tracking-wider text-seed-muted block">
                Audit Summary
              </span>
              <p className="text-xs text-seed-muted leading-relaxed">
                {gap?.description || "This expected parameter was not mentioned in any of the reviewed primary documents, leaving applicants with unverified rules."}
              </p>
            </div>

            {/* 4. List of sources reviewed + Not found in the sources reviewed */}
            <div className="space-y-2">
              <span className="font-mono text-[10px] uppercase tracking-wider text-seed-muted block">
                Reviewed Sources Audited
              </span>
              <div className="space-y-1.5">
                {report.sources.map((s, idx) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between p-2.5 rounded-xs border border-seed/10 bg-pith text-xs"
                  >
                    <div className="min-w-0 pr-2">
                      <p className="font-medium text-seed truncate">S{idx + 1}: {s.title}</p>
                      <p className="text-[10px] font-mono text-seed-muted">{s.domain}</p>
                    </div>
                    <span className="text-[10px] font-mono text-seed-muted/70 shrink-0 italic">
                      Not found in the sources reviewed
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Action button */}
            <div className="pt-6 border-t border-seed/10 mt-auto">
              <Button variant="rind" size="sm" onClick={handleClose} className="w-full text-xs cursor-pointer">
                Done Inspecting
              </Button>
            </div>
          </div>
        ) : (
          /* CASE C: Not found fallback */
          <div className="text-center py-12 space-y-3">
            <AlertCircle className="w-6 h-6 text-seed-muted mx-auto" />
            <p className="text-xs text-seed-muted">
              Claim or parameter details could not be retrieved for identifier &ldquo;{claimId}&rdquo;.
            </p>
            <Button variant="rind" size="sm" onClick={handleClose} className="cursor-pointer">
              Return to Summary
            </Button>
          </div>
        )}
      </div>
    </EvidenceDrawerMotion>
  );
};
