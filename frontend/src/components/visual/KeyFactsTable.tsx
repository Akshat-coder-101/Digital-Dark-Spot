import React, { useState } from 'react';
import { FullAnalysisReport } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import {
  VerifiedCheckIcon,
  CrackIcon,
  SeedIcon,
  WiltIcon
} from '@/components/common/Icons';
import { AlertCircle } from 'lucide-react';
import { areAttributesMatching } from '@/lib/canonicalization';

interface KeyFactsTableProps {
  report: FullAnalysisReport;
  onSelectAttribute?: (attr: string) => void;
  className?: string;
}

function formatSentenceCase(str: string): string {
  if (!str) return '';
  const clean = str.replace(/_/g, ' ').trim();
  return clean.charAt(0).toUpperCase() + clean.slice(1).toLowerCase();
}

interface FactRow {
  attribute: string;
  topic: string;
  keyValue: string;
  dateStr?: string;
  dateChip?: { text: string; variant: 'passed' | 'upcoming' | 'undated' };
  sourcesCount: number;
  status: 'conflict' | 'gap' | 'stale' | 'single_source' | 'found';
  statusLabel: string;
  sortRank: number;
  primaryClaimId?: string;
}

export const KeyFactsTable: React.FC<KeyFactsTableProps> = ({
  report,
  onSelectAttribute,
  className
}) => {
  const navigate = useNavigate();
  const [showOtherDetails, setShowOtherDetails] = useState(false);

  // Today reference for date comparison
  const todayIso = new Date().toISOString().split('T')[0];

  // 1. Gather all canonical parameters (up to 12)
  const canonicalParams = (report.expectedAttributes && report.expectedAttributes.length > 0)
    ? report.expectedAttributes.slice(0, 12)
    : (report.coverageMatrix || []).map(r => r.attribute).slice(0, 12);

  const buildRow = (param: string): FactRow => {
    // 1. If parameterStatuses exists from backend single source of truth, use it directly
    const pStatus = report.parameterStatuses?.find(
      p => p.parameter === param || areAttributesMatching(p.parameter, param)
    );

    const topic = formatSentenceCase(
      pStatus?.label || report.coverageMatrix?.find(r => r.attribute === param)?.attributeLabel || param
    );

    // Claims for this parameter
    const claims = pStatus?.claims || (report.claims || []).filter(
      c => c.attribute === param || (c as any).original_attribute === param || areAttributesMatching(c.attribute, param)
    );

    // Check conflict
    const conflict = pStatus?.conflict || (report.conflicts || []).find(
      cf => cf.attribute === param || areAttributesMatching(cf.attribute, param)
    );

    // Check stale / deadline passed
    const hasDeadlinePassed = claims.some(c => c.isDeadlinePassed || c.isOutdated);
    const hasStaleSource = (report.freshnessWarnings || []).some(
      w => claims.some(c => c.source_id === w.source_id) &&
           (w.statusLabel?.toLowerCase().includes('outdated') || w.warningType === 'deadline_passed')
    );

    // Count unique sources
    const uniqueSourceIds = new Set(claims.map(c => c.source_id));
    const sourcesCount = pStatus?.sourcesCount ?? uniqueSourceIds.size;

    // Status & Sort Rank determination from single source of truth
    let status: 'conflict' | 'gap' | 'stale' | 'single_source' | 'found';
    let statusLabel: string;
    let sortRank: number;

    if (pStatus) {
      status = pStatus.status;
      statusLabel = pStatus.statusLabel;
      sortRank = pStatus.sortRank;
    } else if (conflict) {
      status = 'conflict';
      statusLabel = 'Conflict';
      sortRank = 1;
    } else if (claims.length === 0) {
      status = 'gap';
      statusLabel = 'Gap';
      sortRank = 2;
    } else if (hasDeadlinePassed || hasStaleSource) {
      status = 'stale';
      statusLabel = 'Stale';
      sortRank = 3;
    } else if (sourcesCount === 1) {
      status = 'single_source';
      statusLabel = 'Single source';
      sortRank = 4;
    } else {
      status = 'found';
      statusLabel = 'Found';
      sortRank = 5;
    }

    // Key value calculation
    let keyValue = pStatus?.keyValue || 'Not found in the sources reviewed';
    if (!pStatus) {
      if (status === 'conflict' && conflict) {
        const v1 = conflict.sourceA?.value || 'Option A';
        const v2 = conflict.sourceB?.value || 'Option B';
        keyValue = `Sources disagree: ${v1} / ${v2}`;
      } else if (status === 'gap') {
        keyValue = 'Not found in the sources reviewed';
      } else if (claims.length > 0) {
        const valCounts: Record<string, number> = {};
        for (const c of claims) {
          const valNorm = (c.value || '').trim();
          if (valNorm) valCounts[valNorm] = (valCounts[valNorm] || 0) + 1;
        }
        const sortedVals = Object.entries(valCounts).sort((a, b) => b[1] - a[1]);
        keyValue = sortedVals[0]?.[0] || claims[0].value;
      }
    }

    // Date & Date Chip
    let dateStr: string | undefined;
    let dateChip: { text: string; variant: 'passed' | 'upcoming' | 'undated' } | undefined;

    // Look for deadline or date-like claim
    const dateClaim = claims.find(c => c.isDeadlinePassed || c.dateKind === 'deadline' || (c.value && /\b(20\d\d)\b/.test(c.value)));
    if (dateClaim) {
      const val = dateClaim.value || '';
      // Try extracting ISO or date substring
      const dateMatch = val.match(/\b\d{4}-\d{2}-\d{2}\b/) ||
                        val.match(/\b\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4}\b/i) ||
                        val.match(/\b\d{1,2}[-/]\d{1,2}[-/]\d{2,4}\b/);
      if (dateMatch) {
        dateStr = dateMatch[0];
      }

      if (dateClaim.isDeadlinePassed || (dateStr && dateStr < todayIso)) {
        dateChip = { text: 'passed', variant: 'passed' };
      } else if (dateStr && dateStr > todayIso) {
        try {
          const parsed = new Date(dateStr);
          if (!isNaN(parsed.getTime())) {
            const diffDays = Math.ceil((parsed.getTime() - new Date(todayIso).getTime()) / (1000 * 60 * 60 * 24));
            dateChip = { text: diffDays > 0 ? `in ${diffDays} days` : 'today', variant: 'upcoming' };
          }
        } catch {}
      }
    }

    const conflictClaim = conflict
      ? claims.find(c => c.source_id === conflict.sourceA?.source_id || c.source_id === conflict.sourceB?.source_id)
      : undefined;
    const primaryClaimId = conflictClaim?.id || claims[0]?.id;

    return {
      attribute: param,
      topic,
      keyValue,
      dateStr,
      dateChip,
      sourcesCount,
      status,
      statusLabel,
      sortRank,
      primaryClaimId
    };
  };

  const rows = canonicalParams.map(buildRow).sort((a, b) => a.sortRank - b.sortRank);

  // Other details if extra parameters or otherDetailsCount exists
  const otherParams = (report.coverageMatrix || [])
    .map(r => r.attribute)
    .filter(attr => !canonicalParams.includes(attr));
  const otherRows = otherParams.map(buildRow).sort((a, b) => a.sortRank - b.sortRank);
  const totalOtherCount = (report.otherDetailsCount || 0) + otherRows.length;

  const handleRowClick = (row: FactRow) => {
    if (row.primaryClaimId) {
      navigate(`/report/${report.id}/evidence/${encodeURIComponent(row.primaryClaimId)}`);
    } else {
      onSelectAttribute?.(row.attribute);
    }
  };

  return (
    <div className={cn("w-full min-w-0 max-w-full rounded-sm border border-seed/10 bg-pith space-y-3 p-4 sm:p-5 shadow-2xs overflow-hidden", className)}>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-seed/10 pb-3">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-rind" />
          <h3 className="font-heading font-bold text-xs sm:text-sm text-seed">
            Key facts
          </h3>
          <span className="text-xs text-seed-muted hidden sm:inline">
            — Parameter verification at a glance ({rows.length} canonical topics)
          </span>
        </div>
        <span className="text-[11px] font-mono text-seed-muted">
          Sorted by attention needed
        </span>
      </div>

      <div className="overflow-x-auto rounded-xs border border-seed/10">
        <table className="w-full text-left text-xs border-collapse" role="table" aria-label="Key facts table">
          <thead>
            <tr className="border-b border-seed/10 bg-seed/2 text-seed font-heading">
              <th scope="col" className="py-2 px-3 font-bold text-xs w-44">
                Topic
              </th>
              <th scope="col" className="py-2 px-3 font-bold text-xs">
                Key value
              </th>
              <th scope="col" className="py-2 px-3 font-bold text-xs w-36">
                Date
              </th>
              <th scope="col" className="py-2 px-3 font-bold text-xs text-center w-24">
                Sources
              </th>
              <th scope="col" className="py-2 px-3 font-bold text-xs text-right w-32">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-seed/10">
            {rows.map((row) => (
              <tr
                key={row.attribute}
                tabIndex={0}
                role="row"
                onClick={() => handleRowClick(row)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleRowClick(row);
                  }
                }}
                className="hover:bg-seed/2 transition-colors cursor-pointer focus:outline-none focus:bg-rind/5 group"
              >
                {/* Topic */}
                <td className="py-2 px-3 font-heading font-semibold text-seed align-middle">
                  <div className="flex items-center gap-1.5">
                    <span className="group-hover:text-rind transition-colors">
                      {row.topic}
                    </span>
                  </div>
                </td>

                {/* Key value */}
                <td className="py-2 px-3 text-seed-muted font-sans align-middle">
                  <span
                    className={cn(
                      "line-clamp-1",
                      row.status === 'conflict' ? "text-crack font-semibold" :
                      row.status === 'gap' ? "text-seed-muted/70 italic" :
                      "text-seed font-medium"
                    )}
                    title={row.keyValue}
                  >
                    {row.keyValue}
                  </span>
                </td>

                {/* Date */}
                <td className="py-2 px-3 text-seed-muted font-mono text-[11px] align-middle whitespace-nowrap">
                  {row.dateStr || row.dateChip ? (
                    <div className="flex items-center gap-1.5">
                      {row.dateStr && <span>{row.dateStr}</span>}
                      {row.dateChip && (
                        <span
                          className={cn(
                            "px-1.5 py-0.2 rounded-2xs text-[10px] font-sans font-semibold border",
                            row.dateChip.variant === 'passed'
                              ? "bg-wilt/15 text-wilt border-wilt/30"
                              : "bg-rind/15 text-rind border-rind/30"
                          )}
                        >
                          {row.dateChip.text}
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-seed-muted/40">—</span>
                  )}
                </td>

                {/* Sources */}
                <td className="py-2 px-3 text-center text-seed-muted font-mono text-xs align-middle">
                  {row.sourcesCount > 0 ? (
                    <span>{row.sourcesCount}</span>
                  ) : (
                    <span className="text-seed-muted/40">0</span>
                  )}
                </td>

                {/* Status (Icon + Text) */}
                <td className="py-2 px-3 text-right align-middle whitespace-nowrap">
                  {row.status === 'found' && (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-xs text-[10px] font-mono font-semibold bg-rind/10 text-rind border border-rind/20">
                      <VerifiedCheckIcon className="w-3 h-3 shrink-0" />
                      <span>Found</span>
                    </span>
                  )}
                  {row.status === 'conflict' && (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-xs text-[10px] font-mono font-semibold bg-crack/10 text-crack border border-crack/20">
                      <CrackIcon className="w-3 h-3 shrink-0" />
                      <span>Conflict</span>
                    </span>
                  )}
                  {row.status === 'stale' && (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-xs text-[10px] font-mono font-semibold bg-wilt/10 text-wilt border border-wilt/20">
                      <WiltIcon className="w-3 h-3 shrink-0" />
                      <span>Stale</span>
                    </span>
                  )}
                  {row.status === 'single_source' && (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-xs text-[10px] font-mono font-semibold bg-seed/5 text-seed-muted border border-seed/15">
                      <AlertCircle className="w-3 h-3 shrink-0 text-seed-muted" />
                      <span>Single source</span>
                    </span>
                  )}
                  {row.status === 'gap' && (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-xs text-[10px] font-mono font-semibold bg-flesh/10 text-flesh border border-flesh/20">
                      <SeedIcon className="w-3 h-3 shrink-0 fill-current" />
                      <span>Gap</span>
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Collapsed Other Details Section (if any parameters exceeded canonical 12) */}
      {totalOtherCount > 0 && (
        <div className="pt-1">
          <button
            type="button"
            onClick={() => setShowOtherDetails(!showOtherDetails)}
            className="text-xs font-mono text-rind hover:underline inline-flex items-center gap-1 cursor-pointer"
          >
            <span>{showOtherDetails ? 'Hide other details ▲' : `Other details (${totalOtherCount}) ▼`}</span>
          </button>

          {showOtherDetails && otherRows.length > 0 && (
            <div className="mt-2 overflow-x-auto rounded-xs border border-seed/10">
              <table className="w-full text-left text-xs border-collapse" role="table">
                <tbody className="divide-y divide-seed/10 bg-seed/1">
                  {otherRows.map((row) => (
                    <tr
                      key={row.attribute}
                      onClick={() => handleRowClick(row)}
                      className="hover:bg-seed/2 transition-colors cursor-pointer"
                    >
                      <td className="py-2 px-3 font-heading font-medium text-seed w-44">{row.topic}</td>
                      <td className="py-2 px-3 text-seed-muted">{row.keyValue}</td>
                      <td className="py-2 px-3 text-seed-muted font-mono text-[11px] w-36">{row.dateStr || '—'}</td>
                      <td className="py-2 px-3 text-center text-seed-muted font-mono w-24">{row.sourcesCount}</td>
                      <td className="py-2 px-3 text-right w-32">{row.statusLabel}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
