import React, { useState } from 'react';
import { useReport } from './ReportContext';
import { extractSchemeInfo } from '@/lib/scheme';
import { StatusTag } from '@/components/common/StatusTag';
import { useNavigate } from 'react-router-dom';
import { HelpCircle, ChevronDown, ChevronUp, ExternalLink, Clock } from 'lucide-react';
import { parseDeadlineFromText } from '@/lib/deadline';
import { cn } from '@/lib/utils';

// Helper to convert snake_case or raw strings to natural Sentence case
function formatSentenceCase(str: string): string {
  if (!str) return '';
  const clean = str.replace(/_/g, ' ').trim();
  return clean.charAt(0).toUpperCase() + clean.slice(1).toLowerCase();
}

// Highlight matched finding text within the full quote
function HighlightedQuote({ quote, value }: { quote: string; value: string }) {
  if (!quote) return null;
  if (!value) return <span>&ldquo;{quote}&rdquo;</span>;

  // Simple case-insensitive matching of key terms in value
  const cleanVal = value.trim();
  const lowerQuote = quote.toLowerCase();
  const lowerVal = cleanVal.toLowerCase();
  const matchIndex = lowerQuote.indexOf(lowerVal);

  if (matchIndex === -1) {
    return <span>&ldquo;{quote}&rdquo;</span>;
  }

  const before = quote.slice(0, matchIndex);
  const matched = quote.slice(matchIndex, matchIndex + cleanVal.length);
  const after = quote.slice(matchIndex + cleanVal.length);

  return (
    <span>
      &ldquo;{before}
      <mark className="bg-rind/20 text-rind font-semibold px-0.5 rounded-2xs">
        {matched}
      </mark>
      {after}&rdquo;
    </span>
  );
}

export const SummaryTab: React.FC = () => {
  const { report } = useReport();
  const navigate = useNavigate();
  const [expandedClaims, setExpandedClaims] = useState<Record<string, boolean>>({});

  const toggleExpand = (claimId: string) => {
    setExpandedClaims((prev) => ({
      ...prev,
      [claimId]: !prev[claimId]
    }));
  };

  // Group claims by attribute
  const claimsByAttribute = report.claims.reduce((acc, claim) => {
    const key = claim.attribute || 'general_provisions';
    if (!acc[key]) acc[key] = [];
    acc[key].push(claim);
    return acc;
  }, {} as Record<string, typeof report.claims>);

  const attributeKeys = Object.keys(claimsByAttribute);
  const schemeInfo = extractSchemeInfo(report);

  // Check whether summary has genuine text
  const hasRealSummary = Boolean(report.summary && report.summary.trim().length > 0);

  return (
    <div className="space-y-6">
      {/* 0. Investigated Scheme Identity Banner */}
      <div className="p-4 sm:p-5 rounded-sm border border-rind/25 bg-rind/[0.04] flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rind" />
            <span className="text-[11px] font-mono uppercase tracking-wider text-rind font-bold">
              Identified Scholarship / Target Scheme
            </span>
          </div>
          <h2 className="font-heading font-extrabold text-base sm:text-lg text-seed">
            {schemeInfo.name}
          </h2>
          <p className="text-xs text-seed-muted">
            {schemeInfo.cycle ? `Application cycle: ${schemeInfo.cycle} • ` : ''}
            Primary authority: <span className="font-mono text-seed font-medium">{schemeInfo.officialDomain || 'Verified primary notice'}</span>
          </p>
        </div>
        {schemeInfo.hasOfficialSource && (
          <div className="px-2.5 py-1 rounded-xs bg-rind/15 border border-rind/30 text-rind text-xs font-semibold flex items-center gap-1.5 self-start sm:self-center font-sans">
            <span>Official Portal Identified</span>
          </div>
        )}
      </div>

      {/* 1. Summary Block (Renamed from Executive Synthesis, hidden if empty, tagged "AI-suggested") */}
      {hasRealSummary && (
        <div className="p-5 sm:p-6 rounded-sm border border-seed/10 bg-pith space-y-3 shadow-2xs">
          <div className="flex items-center justify-between border-b border-seed/10 pb-3">
            <div className="space-y-0.5">
              <h3 className="font-heading font-bold text-base sm:text-lg text-seed">
                Summary
              </h3>
              <p className="text-xs text-seed-muted">
                Synthesized across {report.metrics.sourcesCount} reviewed primary documents
              </p>
            </div>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-xs bg-seed/5 text-seed-muted text-[11px] font-sans font-medium border border-seed/15">
              AI-suggested
            </span>
          </div>
          <p className="text-xs sm:text-sm leading-relaxed text-seed font-normal pt-1">
            {report.summary}
          </p>
        </div>
      )}

      {/* 2. CLAIMS: Grouped by Attribute, with expandable full quotes & deadline chips */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-seed/10 pb-3">
          <div className="flex items-center gap-2">
            <h3 className="font-heading font-bold text-base sm:text-lg text-seed">
              Extracted Grounded Claims
            </h3>
            <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-xs bg-rind/10 text-rind border border-rind/20">
              {report.claims.length} Verbatim Quotes
            </span>
          </div>
          <span className="text-xs text-seed-muted">
            Grouped by expected parameter • Expand to read full source quote
          </span>
        </div>

        <div className="space-y-4">
          {attributeKeys.map((attrKey) => {
            const claims = claimsByAttribute[attrKey];
            const readableAttrName = formatSentenceCase(claims[0]?.attribute || attrKey);

            return (
              <div
                key={attrKey}
                className="rounded-sm border border-seed/10 bg-pith overflow-hidden shadow-2xs"
              >
                {/* Group Header */}
                <div className="px-4 py-2.5 bg-seed/[0.025] border-b border-seed/10 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-heading font-bold text-xs sm:text-sm text-seed">
                      {readableAttrName}
                    </span>
                    <span className="text-[10px] font-mono text-seed-muted">
                      ({claims.length} claim{claims.length === 1 ? '' : 's'})
                    </span>
                  </div>
                </div>

                {/* Group Claims List */}
                <div className="divide-y divide-seed/10">
                  {claims.map((claim) => {
                    const isExpanded = Boolean(expandedClaims[claim.id]);
                    const deadline = parseDeadlineFromText(claim.attribute, claim.value);

                    return (
                      <div key={claim.id} className="p-3.5 sm:p-4 space-y-2 hover:bg-seed/[0.01] transition-colors">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div className="space-y-1 min-w-0 flex-1">
                            {/* Tags & Deadline chip */}
                            <div className="flex flex-wrap items-center gap-2">
                              <StatusTag status="sourced" size="sm" />

                              {/* Deadline Chip */}
                              {deadline && (
                                <span
                                  className={cn(
                                    "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-xs text-[11px] font-medium border",
                                    deadline.isPassed
                                      ? "bg-flesh/10 text-flesh border-flesh/20"
                                      : "bg-crack/10 text-crack border-crack/25"
                                  )}
                                  title="Computed in client from source text"
                                >
                                  <Clock className="w-3 h-3 shrink-0" />
                                  <span>{deadline.text}</span>
                                  <span className="text-[10px] text-seed-muted/70 font-normal">
                                    (from source text)
                                  </span>
                                </span>
                              )}

                              <span className="text-xs text-seed-muted font-sans truncate">
                                {claim.source_title}
                              </span>
                            </div>

                            {/* One-line Finding */}
                            <h4 className="font-heading font-bold text-sm text-seed pt-0.5">
                              {claim.value}
                            </h4>
                          </div>

                          {/* Action controls */}
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => toggleExpand(claim.id)}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-xs border border-seed/15 text-[11px] font-medium text-seed-muted hover:text-seed hover:bg-seed/5 transition-colors cursor-pointer"
                              aria-expanded={isExpanded}
                            >
                              <span>{isExpanded ? 'Hide quote' : 'View quote'}</span>
                              {isExpanded ? (
                                <ChevronUp className="w-3 h-3" />
                              ) : (
                                <ChevronDown className="w-3 h-3" />
                              )}
                            </button>

                            <button
                              type="button"
                              onClick={() => navigate(`/report/${report.id}/evidence/${encodeURIComponent(claim.id)}`)}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-xs border border-rind/20 bg-rind/5 text-[11px] font-medium text-rind hover:bg-rind/10 transition-colors cursor-pointer"
                              title="Inspect full context in Evidence Drawer"
                            >
                              <span>Inspect</span>
                              <ExternalLink className="w-3 h-3" />
                            </button>
                          </div>
                        </div>

                        {/* Full Quote (NEVER clipped mid-sentence, matched text highlighted) */}
                        {isExpanded && (
                          <div className="pt-2">
                            <blockquote className="p-3 rounded-xs bg-seed/[0.03] border-l-2 border-flesh text-xs italic text-seed-muted leading-relaxed font-sans">
                              <HighlightedQuote quote={claim.quote} value={claim.value} />
                            </blockquote>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Open Questions (Tagged "AI-suggested" for each) */}
      {report.openQuestions.length > 0 && (
        <div className="p-5 sm:p-6 rounded-sm border border-seed/10 bg-pith space-y-4 shadow-2xs">
          <div className="flex items-center justify-between border-b border-seed/10 pb-3">
            <div className="flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-crack" />
              <h3 className="font-heading font-bold text-base sm:text-lg text-seed">
                Critical Open Questions to Verify
              </h3>
            </div>
            <span className="text-xs text-seed-muted font-mono">
              {report.openQuestions.length} Identified
            </span>
          </div>

          <ul className="space-y-3">
            {report.openQuestions.map((q, idx) => (
              <li
                key={idx}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-xs border border-seed/10 bg-seed/[0.015]"
              >
                <div className="flex items-start gap-2.5 min-w-0">
                  <span className="w-4 h-4 rounded-full bg-crack/10 text-crack flex items-center justify-center text-[10px] font-mono font-bold shrink-0 mt-0.5">
                    ?
                  </span>
                  <span className="text-xs sm:text-sm text-seed leading-relaxed">
                    {q}
                  </span>
                </div>
                <span className="self-start sm:self-auto shrink-0 px-1.5 py-0.5 rounded-xs bg-seed/5 text-seed-muted text-[10px] font-sans font-medium border border-seed/15">
                  AI-suggested
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
