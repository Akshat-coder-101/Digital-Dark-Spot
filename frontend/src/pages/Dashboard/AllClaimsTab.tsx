import React, { useState, useMemo } from 'react';
import { useReport } from './ReportContext';
import { useNavigate } from 'react-router-dom';
import { StatusTag } from '@/components/common/StatusTag';
import {
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Clock
} from 'lucide-react';
import { ExtractedClaim } from '@/lib/types';
import { areAttributesMatching } from '@/lib/canonicalization';

function formatSentenceCase(str: string): string {
  if (!str) return '';
  const clean = str.replace(/_/g, ' ').trim();
  return clean.charAt(0).toUpperCase() + clean.slice(1).toLowerCase();
}

function HighlightedQuote({ quote, value }: { quote: string; value?: string }) {
  if (!value || !quote) {
    return <span>&ldquo;{quote}&rdquo;</span>;
  }

  const normValue = value.trim();
  const lowerQuote = quote.toLowerCase();
  const lowerValue = normValue.toLowerCase();
  const matchIndex = lowerQuote.indexOf(lowerValue);

  if (matchIndex === -1) {
    return <span>&ldquo;{quote}&rdquo;</span>;
  }

  const before = quote.slice(0, matchIndex);
  const matched = quote.slice(matchIndex, matchIndex + normValue.length);
  const after = quote.slice(matchIndex + normValue.length);

  return (
    <span>
      &ldquo;{before}
      <mark className="bg-rind/20 text-seed font-semibold px-0.5 rounded-2xs border-b border-rind/40">
        {matched}
      </mark>
      {after}&rdquo;
    </span>
  );
}

export const AllClaimsTab: React.FC = () => {
  const { report } = useReport();
  const navigate = useNavigate();

  // Expanded/collapsed states for attribute clusters
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  // Expanded/collapsed states for individual claim quotes
  const [expandedClaims, setExpandedClaims] = useState<Record<string, boolean>>({});

  // Group claims by canonical parameter
  const { claimsByAttribute, attributeKeys } = useMemo(() => {
    const map: Record<string, typeof report.claims> = {};
    const canonicalList = (report.expectedAttributes || []).slice(0, 12);

    for (const claim of report.claims || []) {
      // Find matching canonical parameter or use claim attribute
      let matchedCanonical = canonicalList.find(
        (cp: string) => areAttributesMatching(cp, claim.attribute) || cp === claim.attribute
      );
      if (!matchedCanonical) {
        matchedCanonical = claim.attribute || 'other_details';
      }

      if (!map[matchedCanonical]) {
        map[matchedCanonical] = [];
      }
      map[matchedCanonical].push(claim);
    }

    return {
      claimsByAttribute: map,
      attributeKeys: Object.keys(map)
    };
  }, [report.claims, report.expectedAttributes]);

  const allExpanded = useMemo(() => {
    return attributeKeys.length > 0 && attributeKeys.every(k => collapsedGroups[k] === false);
  }, [attributeKeys, collapsedGroups]);

  const toggleAllGroups = () => {
    const targetState = !allExpanded;
    const next: Record<string, boolean> = {};
    for (const key of attributeKeys) {
      next[key] = !targetState;
    }
    setCollapsedGroups(next);
  };

  const toggleGroupCollapse = (key: string) => {
    setCollapsedGroups(prev => ({
      ...prev,
      [key]: prev[key] === undefined ? false : !prev[key]
    }));
  };

  const toggleClaimExpand = (claimId: string) => {
    setExpandedClaims(prev => ({
      ...prev,
      [claimId]: !prev[claimId]
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header with Title and "N claims in M topics" Badge */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-seed/10 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <h2 className="font-heading font-extrabold text-lg sm:text-xl text-seed">
              All Grounded Claims
            </h2>
            <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-xs bg-rind/10 text-rind border border-rind/20">
              {report.claims.length} claims in {attributeKeys.length} topics
            </span>
          </div>
          <p className="text-xs text-seed-muted">
            Every verified factual claim extracted verbatim from reviewed primary sources.
          </p>
        </div>

        <button
          type="button"
          onClick={toggleAllGroups}
          className="text-xs font-mono text-rind hover:underline inline-flex items-center gap-1 cursor-pointer"
        >
          <span>{allExpanded ? 'Collapse all groups ▲' : 'Expand all groups ▼'}</span>
        </button>
      </div>

      {/* Claims List Grouped by Attribute */}
      <div className="space-y-3.5">
        {attributeKeys.map((attrKey) => {
          const claims = claimsByAttribute[attrKey];
          const readableAttrName = formatSentenceCase(claims[0]?.attribute || attrKey);
          const isGroupCollapsed = collapsedGroups[attrKey] ?? true; // default collapsed

          // Unique sources agreement count
          const uniqueDomains = new Set(claims.map((c: ExtractedClaim) => c.source_domain));
          const agreementLabel = uniqueDomains.size >= 2
            ? `Agreed by ${uniqueDomains.size} sources`
            : 'Single source';

          return (
            <div
              key={attrKey}
              className="rounded-sm border border-seed/10 bg-pith overflow-hidden shadow-2xs"
            >
              {/* Group Header */}
              <div
                onClick={() => toggleGroupCollapse(attrKey)}
                className="px-4 py-2.5 bg-seed/2.5 border-b border-seed/10 flex items-center justify-between cursor-pointer hover:bg-seed/5 transition-colors group"
              >
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="font-heading font-bold text-xs sm:text-sm text-seed group-hover:text-rind transition-colors">
                    {readableAttrName}
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-xs bg-seed/5 text-seed-muted border border-seed/15">
                    {agreementLabel}
                  </span>
                  <span className="text-[10px] font-mono text-seed-muted">
                    ({claims.length} claim{claims.length === 1 ? '' : 's'})
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono text-seed-muted">
                    {isGroupCollapsed ? 'Expand' : 'Collapse'}
                  </span>
                  {isGroupCollapsed ? <ChevronDown className="w-3.5 h-3.5 text-seed-muted" /> : <ChevronUp className="w-3.5 h-3.5 text-seed-muted" />}
                </div>
              </div>

              {/* Group Claims Rows */}
              {!isGroupCollapsed && (
                <div className="divide-y divide-seed/10">
                  {claims.map((claim: ExtractedClaim) => {
                    const isClaimExpanded = Boolean(expandedClaims[claim.id]);

                    return (
                      <div key={claim.id} className="p-3.5 sm:p-4 space-y-2 hover:bg-seed/1 transition-colors">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div className="space-y-1 min-w-0 flex-1">
                            {/* Source Badge & Deadline Chip */}
                            <div className="flex flex-wrap items-center gap-2">
                              <StatusTag status="sourced" size="sm" />

                              {claim.isDeadlinePassed && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-xs bg-crack/15 text-crack border border-crack/30 text-[10px] font-mono font-bold">
                                  <Clock className="w-3 h-3" />
                                  <span>Deadline passed</span>
                                </span>
                              )}

                              <span className="text-xs text-seed font-medium font-sans">
                                {claim.source_title}
                              </span>
                              <span className="text-[11px] font-mono text-seed-muted">
                                ({claim.source_domain})
                              </span>
                            </div>

                            {/* Finding Value */}
                            <h4 className="font-heading font-bold text-sm text-seed pt-0.5">
                              {claim.value}
                            </h4>
                          </div>

                          {/* Action controls */}
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => toggleClaimExpand(claim.id)}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-xs border border-seed/15 text-[11px] font-medium text-seed-muted hover:text-seed hover:bg-seed/5 transition-colors cursor-pointer"
                              aria-expanded={isClaimExpanded}
                            >
                              <span>{isClaimExpanded ? 'Hide quote' : 'View quote'}</span>
                              {isClaimExpanded ? (
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

                        {/* Full Verbatim Quote */}
                        {isClaimExpanded && (
                          <div className="pt-2">
                            <blockquote className="p-3 rounded-xs bg-seed/3 border-l-2 border-rind text-xs italic text-seed-muted leading-relaxed font-sans">
                              <HighlightedQuote quote={claim.quote} value={claim.value} />
                            </blockquote>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
