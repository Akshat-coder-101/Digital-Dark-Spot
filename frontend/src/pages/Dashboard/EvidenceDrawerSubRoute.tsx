import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useReport } from './ReportContext';
import { EvidenceDrawerMotion } from '@/components/motion/EvidenceDrawerMotion';
import { StatusTag } from '@/components/common/StatusTag';
import { SeedIcon, CrackIcon } from '@/components/common/Icons';
import { Button } from '@/components/ui/button';
import {
  ExternalLink,
  CheckCircle2,
  Calendar,
  Globe,
  X,
  AlertCircle,
  ShieldCheck,
  FileText,
  Clock,
  HelpCircle
} from 'lucide-react';

function formatSentenceCase(str: string): string {
  if (!str) return '';
  const clean = str.replace(/_/g, ' ').trim();
  return clean.charAt(0).toUpperCase() + clean.slice(1).toLowerCase();
}

/**
 * Renders the verbatim quote highlighted directly in its authentic surrounding source text.
 * Shows up to 120 characters before and 120 characters after.
 */
function VerbatimContextViewer({ fullText, quote }: { fullText?: string; quote: string }) {
  if (!fullText || !quote) {
    return (
      <blockquote className="p-4 rounded-xs bg-seed/3 border-l-3 border-rind text-xs italic text-seed leading-relaxed">
        &ldquo;{quote}&rdquo;
      </blockquote>
    );
  }

  const idx = fullText.indexOf(quote);
  if (idx === -1) {
    return (
      <blockquote className="p-4 rounded-xs bg-seed/3 border-l-3 border-rind text-xs italic text-seed leading-relaxed">
        &ldquo;{quote}&rdquo;
      </blockquote>
    );
  }

  // Show exactly up to 120 characters before and 120 characters after
  const start = Math.max(0, idx - 120);
  const end = Math.min(fullText.length, idx + quote.length + 120);
  const before = (start > 0 ? '… ' : '') + fullText.slice(start, idx);
  const after = fullText.slice(idx + quote.length, end) + (end < fullText.length ? ' …' : '');

  return (
    <div className="p-4 rounded-xs bg-seed/3 border border-seed/12 text-xs leading-relaxed text-seed-muted font-sans space-y-2">
      <div className="text-[11px] font-mono text-seed-muted/80 pb-1 border-b border-seed/10 flex items-center justify-between">
        <span>Raw Document Excerpt (120 chars context)</span>
        <span className="text-[10px] text-rind font-semibold inline-flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3 text-rind" />
          Verbatim Substring Match
        </span>
      </div>
      <div>
        <span>{before}</span>
        <mark className="bg-rind/25 text-seed font-semibold px-1 py-0.5 rounded-2xs border border-rind/30">
          &ldquo;{quote}&rdquo;
        </mark>
        <span>{after}</span>
      </div>
    </div>
  );
}

export const EvidenceDrawerSubRoute: React.FC = () => {
  const { claimId } = useParams<{ claimId: string }>();
  const navigate = useNavigate();
  const { report } = useReport();

  const decodedId = decodeURIComponent(claimId || '');

  // 1. Exact match by claim.id
  let claim = report.claims.find(c => c.id === decodedId);

  // 2. If decodedId is attr:sourceId
  if (!claim && decodedId.includes(':')) {
    const [attr, srcId] = decodedId.split(':');
    claim = report.claims.find(c =>
      (c.attribute === attr || c.original_attribute === attr) &&
      (c.source_id === srcId || c.source_domain === srcId)
    );
  }

  // 3. If decodedId matches claim.attribute directly
  if (!claim) {
    claim = report.claims.find(c => c.attribute === decodedId || c.original_attribute === decodedId);
  }

  // 4. Fallback if decodedId is a sourceId
  if (!claim) {
    claim = report.claims.find(c => c.source_id === decodedId);
  }

  const activeAttr = claim ? (claim.attribute || claim.original_attribute) : decodedId;

  // Associated source
  const source = claim
    ? report.sources.find(s => s.id === claim.source_id)
    : report.sources.find(s => s.id === decodedId);

  // Associated gap, conflict, matrix row, freshness
  const gap = report.gaps.find(g => g.id === decodedId || g.attribute === activeAttr);
  const conflict = report.conflicts.find(c => c.attribute === activeAttr);
  const matrixRow = report.coverageMatrix.find(m => m.attribute === activeAttr);
  const freshnessWarning = source ? report.freshnessWarnings.find(f => f.source_id === source.id) : undefined;

  // Other sources on this item
  const otherClaims = report.claims.filter(c =>
    (c.attribute === activeAttr || c.original_attribute === activeAttr) &&
    (!claim || c.source_id !== claim.source_id)
  );

  const handleClose = () => {
    navigate(-1);
  };

  const isOfficial =
    source?.domain?.includes('.gov') ||
    source?.domain?.includes('.nic') ||
    source?.domain?.includes('.edu') ||
    (source as any)?.isOfficialDomain;

  // "Why this was flagged" explanation
  let whyFlaggedText = 'Sourced evidence verified against primary source text.';
  let whyFlaggedIcon = <CheckCircle2 className="w-3.5 h-3.5 text-rind shrink-0" />;

  if (conflict) {
    whyFlaggedText = conflict.description || 'Possible conflict detected between sources on this attribute.';
    whyFlaggedIcon = <CrackIcon className="w-3.5 h-3.5 text-crack shrink-0" />;
  } else if (gap) {
    whyFlaggedText = gap.description || 'Not found in the sources reviewed.';
    whyFlaggedIcon = <SeedIcon className="w-3.5 h-3.5 fill-current text-seed shrink-0" />;
  } else if (freshnessWarning) {
    whyFlaggedText = freshnessWarning.reason || 'Document is potentially outdated or references an earlier cycle.';
    whyFlaggedIcon = <Clock className="w-3.5 h-3.5 text-wilt shrink-0" />;
  } else if (claim && otherClaims.length === 0 && report.sources.length > 1) {
    whyFlaggedText = 'Single source coverage only. This parameter was not corroborated by other reviewed sources.';
    whyFlaggedIcon = <HelpCircle className="w-3.5 h-3.5 text-seed-muted shrink-0" />;
  }

  return (
    <EvidenceDrawerMotion
      open={true}
      onClose={handleClose}
      width="max-w-[560px]"
    >
      <div className="p-6 space-y-6 flex flex-col min-h-full bg-pith">
        {/* Header bar */}
        <div className="flex items-start justify-between pb-4 border-b border-seed/10 gap-3">
          <div>
            <span className="font-mono text-[10px] uppercase tracking-wider text-rind font-bold block">
              Evidence Inspection
            </span>
            <h3 className="font-heading font-extrabold text-lg text-seed leading-snug">
              {claim
                ? `Evidence: ${formatSentenceCase(claim.original_attribute || claim.attribute)}`
                : gap || matrixRow
                ? `Parameter: ${formatSentenceCase(gap?.attribute || matrixRow?.attribute || decodedId)}`
                : `Document Material`}
            </h3>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 rounded-xs text-seed-muted hover:text-seed hover:bg-seed/5 transition-colors cursor-pointer shrink-0 mt-1"
            aria-label="Close evidence drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* CASE A: Claim found */}
        {claim ? (
          <div className="space-y-6 flex-1">
            {/* 1. Status label & Parameter Tag */}
            <div className="flex items-center justify-between">
              <StatusTag status="sourced" />
              <span className="font-heading text-xs px-2.5 py-0.5 rounded-xs bg-seed/5 text-seed font-bold border border-seed/12">
                {formatSentenceCase(claim.original_attribute || claim.attribute)}
              </span>
            </div>

            {/* 2. Extracted Finding Box */}
            <div className="p-4 rounded-sm border border-seed/15 bg-seed/2 space-y-1.5">
              <span className="font-mono text-[10px] uppercase tracking-wider text-seed-muted font-bold block">
                Extracted Requirement / Value
              </span>
              <p className="font-heading text-base sm:text-lg font-extrabold text-seed leading-snug">
                {claim.value}
              </p>
            </div>

            {/* 3. Why this was flagged */}
            <div className="p-3.5 rounded-xs border border-seed/12 bg-seed/2 space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-heading font-bold text-seed">
                {whyFlaggedIcon}
                <span>Why this was flagged</span>
              </div>
              <p className="text-xs text-seed-muted leading-relaxed">
                {whyFlaggedText}
              </p>
            </div>

            {/* 4. Verbatim Context Viewer (120 chars each side) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono text-[10px] uppercase tracking-wider text-seed-muted font-bold">
                  Verbatim Text in Source Document
                </span>
                <span className="text-rind text-[11px] font-mono font-bold inline-flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Verbatim Substring Match
                </span>
              </div>

              <VerbatimContextViewer
                fullText={source?.cleanedText || source?.rawText}
                quote={claim.quote}
              />
            </div>

            {/* 5. Primary Source Material Card */}
            {source && (
              <div className="p-4 rounded-sm border border-seed/12 bg-pith space-y-2 text-xs">
                <span className="font-mono text-[10px] uppercase tracking-wider text-seed-muted font-bold block">
                  Reviewed Source Material
                </span>
                <div className="space-y-1.5 text-seed">
                  <div className="flex items-center gap-2">
                    {isOfficial ? (
                      <span className="px-2 py-0.5 rounded-2xs bg-rind/15 text-rind border border-rind/25 text-[10px] font-mono font-bold flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" />
                        Official Source
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-2xs bg-seed/10 text-seed border border-seed/15 text-[10px] font-mono font-semibold flex items-center gap-1">
                        <FileText className="w-3 h-3 text-seed-muted" />
                        Secondary Document
                      </span>
                    )}
                    <span className="font-bold text-xs truncate">{source.title}</span>
                  </div>

                  <p className="text-seed-muted flex items-center gap-1.5 font-mono text-[11px] pt-1">
                    <Globe className="w-3.5 h-3.5 opacity-60 text-rind" />
                    <span className="text-seed font-medium">{source.domain}</span>
                    <span>•</span>
                    <span>{source.type === 'url' ? 'Web URL' : 'Primary Text'}</span>
                  </p>
                  <p className="text-seed-muted flex items-center gap-1.5 font-mono text-[11px]">
                    <Calendar className="w-3.5 h-3.5 opacity-60" />
                    <span>Cycle / Date: <strong>{source.detectedDate || source.detectedCycle || 'Undated'}</strong></span>
                  </p>
                </div>
              </div>
            )}

            {/* 6. Other sources on this item */}
            <div className="space-y-2 pt-1">
              <span className="font-mono text-[10px] uppercase tracking-wider text-seed-muted font-bold block">
                Other sources on this item ({report.sources.length - 1})
              </span>
              <div className="space-y-1.5">
                {report.sources
                  .filter(s => !claim || s.id !== claim.source_id)
                  .map((s) => {
                    const match = otherClaims.find(c => c.source_id === s.id);
                    return (
                      <div
                        key={s.id}
                        className="p-2.5 rounded-xs border border-seed/10 bg-seed/1.5 flex items-center justify-between text-xs"
                      >
                        <div className="min-w-0 pr-2">
                          <p className="font-medium text-seed truncate">{s.title}</p>
                          <p className="text-[10px] font-mono text-seed-muted">{s.domain}</p>
                        </div>
                        <div className="shrink-0 text-right">
                          {match ? (
                            <span className="text-[11px] font-mono font-semibold text-rind">
                              Found: &ldquo;{match.value.slice(0, 30)}&rdquo;
                            </span>
                          ) : (
                            <span className="text-[11px] font-mono text-seed-muted/70 italic">
                              Not found in this source
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Action Controls */}
            <div className="pt-6 border-t border-seed/10 flex flex-col gap-2 mt-auto">
              {source?.url && (
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="w-full text-xs cursor-pointer"
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
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-xs text-xs font-mono font-bold bg-seed text-pith">
                <SeedIcon className="w-3 h-3 fill-current" />
                <span>Potential Gap</span>
              </span>
              <span className="font-heading text-xs px-2 py-0.5 rounded-xs bg-seed/5 text-seed font-bold border border-seed/10">
                {formatSentenceCase(gap?.attribute || matrixRow?.attribute || '')}
              </span>
            </div>

            {/* 2. Finding */}
            <div className="p-4 rounded-sm border border-seed/15 bg-seed/2 space-y-1">
              <span className="font-mono text-[10px] uppercase tracking-wider text-seed-muted font-bold block">
                Total Information Dark Spot
              </span>
              <p className="font-heading text-base sm:text-lg font-extrabold text-seed leading-snug">
                {formatSentenceCase(matrixRow?.attributeLabel || gap?.attribute || decodedId)} is not found in the sources reviewed
              </p>
            </div>

            {/* 3. Why this was flagged */}
            <div className="p-3.5 rounded-xs border border-seed/12 bg-seed/2 space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-heading font-bold text-seed">
                <SeedIcon className="w-3.5 h-3.5 fill-current text-seed" />
                <span>Why this was flagged</span>
              </div>
              <p className="text-xs text-seed-muted leading-relaxed">
                {gap?.description || "This expected decision parameter was completely unaddressed across all reviewed documents, leaving applicants with critical unknowns."}
              </p>
            </div>

            {/* 4. Other sources on this item */}
            <div className="space-y-2">
              <span className="font-mono text-[10px] uppercase tracking-wider text-seed-muted font-bold block">
                Other sources on this item ({report.sources.length})
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
                    <span className="text-[10px] font-mono text-seed-muted/80 shrink-0 italic">
                      Not found in this source
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
              Claim or parameter details could not be retrieved for identifier &ldquo;{decodedId}&rdquo;.
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
