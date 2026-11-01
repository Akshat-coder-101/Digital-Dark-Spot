import React, { useState } from 'react';
import { CoverageMatrixRow, IngestedSource } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { Calendar, AlertCircle, Check, CircleDashed, Zap, HelpCircle, Clock } from 'lucide-react';
import { WiltIcon } from '../common/Icons';

interface CoverageMapProps {
  reportId: string;
  matrix: CoverageMatrixRow[];
  sources: IngestedSource[];
  selectedAttribute?: string | null;
  onSelectAttribute?: (attr: string) => void;
  className?: string;
}

// Convert attribute raw keys or labels to natural Sentence case
function formatSentenceCase(str: string): string {
  if (!str) return '';
  const clean = str.replace(/_/g, ' ').trim();
  return clean.charAt(0).toUpperCase() + clean.slice(1).toLowerCase();
}

// Format concise cell previews: icon + at most 14 characters
function formatCellPreview(val?: string, status?: string): string {
  if (!val) {
    if (status === 'missing') return 'Not found';
    return 'Found';
  }
  const trimmed = val.trim();
  if (trimmed.length <= 14) return trimmed;
  return trimmed.slice(0, 13) + '…';
}

export const CoverageMap: React.FC<CoverageMapProps> = ({
  reportId,
  matrix,
  sources,
  selectedAttribute,
  onSelectAttribute,
  className
}) => {
  const navigate = useNavigate();
  const [showAllRows, setShowAllRows] = useState(false);
  const readySources = sources.filter((s) => s.status === 'ready');
  // Identify sources that yielded >= 1 claim across any parameter in the matrix
  const activeSources = readySources.filter((s) =>
    matrix.some((row) => row.cells[s.id] && row.cells[s.id].claimId)
  );
  // Zero-claim sources (e.g. social media, video, or empty pages that provided no usable text)
  const zeroClaimSources = readySources.filter(
    (s) => !matrix.some((row) => row.cells[s.id] && row.cells[s.id].claimId)
  );

  // If there are active sources with claims, collapse zero-claim sources into a single row
  const columnSources = activeSources.length > 0 ? activeSources : readySources;
  const showCoverageStatus = columnSources.length > 1;

  // Max 12 rows by default
  const visibleRows = showAllRows ? matrix : matrix.slice(0, 12);
  const hasMoreRows = matrix.length > 12;

  const handleCellClick = (claimId?: string, attribute?: string) => {
    if (claimId) {
      navigate(`/report/${reportId}/evidence/${encodeURIComponent(claimId)}`);
    } else if (attribute) {
      navigate(`/report/${reportId}/evidence/${encodeURIComponent(attribute)}`);
    }
  };

  return (
    <div className={cn("w-full rounded-sm border border-seed/10 bg-pith space-y-3 p-4 sm:p-5 shadow-2xs", className)}>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-seed/10 pb-3">
        <div>
          <h2 className="font-heading font-extrabold text-base text-seed tracking-tight">
            Coverage Map
          </h2>
          <p className="text-xs text-seed-muted">
            Cross-verifies expected parameters against all reviewed primary sources.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-mono text-seed-muted">
            {matrix.length} parameters × {columnSources.length} source{columnSources.length === 1 ? '' : 's'}
            {zeroClaimSources.length > 0 && ` (${zeroClaimSources.length} gave no usable text)`}
          </span>
          {hasMoreRows && (
            <button
              type="button"
              onClick={() => setShowAllRows(!showAllRows)}
              className="text-xs font-mono text-rind hover:underline inline-flex items-center gap-1 cursor-pointer"
            >
              <span>{showAllRows ? 'Show less ▲' : `Show all rows (${matrix.length}) ▼`}</span>
            </button>
          )}
        </div>
      </div>

      {/* Compact scrollable container (max-height ~360px with internal vertical scroll, mobile horizontal scroll) */}
      <div className="w-full overflow-x-auto overflow-y-auto max-h-90 rounded-xs border border-seed/10 relative">
        <table className="w-full text-left text-xs border-collapse" role="table" aria-label="Coverage map">
          <thead>
            <tr className="border-b border-seed/10 bg-seed/2">
              {/* Sticky Top-Left Corner */}
              <th
                scope="col"
                className="sticky top-0 left-0 bg-pith z-30 py-2 px-3 font-heading font-bold text-xs text-seed border-b border-r border-seed/10 min-w-40"
              >
                Expected parameter
              </th>

              {/* Sticky Overall Coverage Status Column */}
              {showCoverageStatus && (
                <th
                  scope="col"
                  className="sticky top-0 bg-pith z-20 py-2 px-2 font-heading font-bold text-xs text-seed text-center whitespace-nowrap border-b border-seed/10"
                >
                  Status
                </th>
              )}

              {/* Sticky Source Column Headers: domain or first 18 chars with date-status icon */}
              {columnSources.map((source, idx) => {
                const shortDomain = source.domain.length > 18 ? `${source.domain.slice(0, 17)}…` : source.domain;

                return (
                  <th
                    key={source.id}
                    scope="col"
                    className="sticky top-0 bg-pith z-20 py-2 px-2.5 font-heading font-semibold text-seed border-b border-seed/10 min-w-32"
                    title={`${source.title} (${source.domain})`}
                  >
                    <div className="flex flex-col gap-0.5">
                      <span className="truncate text-xs font-bold text-seed">
                        S{idx + 1}: {shortDomain}
                      </span>
                      <span className="text-[10px] text-seed-muted font-sans font-normal flex items-center gap-1 truncate">
                        {source.isStale ? (
                          <>
                            <WiltIcon className="w-3 h-3 text-wilt shrink-0" />
                            <span className="truncate text-wilt font-medium">Outdated</span>
                          </>
                        ) : source.isUndated || (!source.detectedDate && !source.detectedCycle) ? (
                          <>
                            <AlertCircle className="w-3 h-3 text-wilt shrink-0" />
                            <span className="truncate">Undated</span>
                          </>
                        ) : (
                          <>
                            <Calendar className="w-3 h-3 text-rind shrink-0" />
                            <span className="truncate">{source.detectedDate || source.detectedCycle || 'Active'}</span>
                          </>
                        )}
                      </span>
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody className="divide-y divide-seed/10">
            {visibleRows.map((row) => {
              const isSelected = selectedAttribute === row.attribute;
              const formattedName = formatSentenceCase(row.attributeLabel || row.attribute);

              return (
                <tr
                  key={row.attribute}
                  onClick={() => onSelectAttribute?.(row.attribute)}
                  tabIndex={0}
                  role="row"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onSelectAttribute?.(row.attribute);
                    }
                  }}
                  className={cn(
                    "h-9 hover:bg-seed/2 transition-colors cursor-pointer focus:outline-none focus:bg-rind/5",
                    isSelected && "bg-rind/5"
                  )}
                >
                  {/* Sticky First Column: Expected Attribute Name */}
                  <td className="sticky left-0 bg-pith z-10 py-1.5 px-3 font-sans font-medium text-seed border-r border-seed/10 whitespace-nowrap">
                    <span className="font-heading font-bold text-xs text-seed truncate block max-w-44" title={formattedName}>
                      {formattedName}
                    </span>
                  </td>

                  {/* Overall Coverage Status Column */}
                  {showCoverageStatus && (
                    <td className="py-1.5 px-2 text-center align-middle whitespace-nowrap">
                      {row.overallStatus === 'covered' && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-2xs text-[10px] font-mono font-semibold bg-rind/15 text-rind border border-rind/25">
                          <Check className="w-3 h-3 text-rind" />
                          Found
                        </span>
                      )}
                      {row.overallStatus === 'gap' && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-2xs text-[10px] font-mono font-semibold bg-flesh/10 text-flesh border border-flesh/20">
                          <CircleDashed className="w-3 h-3 text-flesh" />
                          Gap
                        </span>
                      )}
                      {row.overallStatus === 'conflict' && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-2xs text-[10px] font-mono font-semibold bg-crack/15 text-crack border border-crack/30">
                          <Zap className="w-3 h-3 text-crack" />
                          Conflict
                        </span>
                      )}
                      {row.overallStatus === 'thin' && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-2xs text-[10px] font-mono font-semibold bg-seed/5 text-seed-muted border border-seed/15">
                          <HelpCircle className="w-3 h-3 text-seed-muted" />
                          Single
                        </span>
                      )}
                      {row.overallStatus === 'stale' && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-2xs text-[10px] font-mono font-semibold bg-wilt/15 text-wilt border border-wilt/30">
                          <Clock className="w-3 h-3 text-wilt" />
                          Stale
                        </span>
                      )}
                    </td>
                  )}

                  {/* Per-Source Cells: Icon + value of at most 14 characters */}
                  {columnSources.map((source) => {
                    const cell = row.cells[source.id];
                    if (!cell) {
                      return (
                        <td key={source.id} className="py-1.5 px-2.5 text-seed-muted/30 text-center font-mono text-xs">
                          —
                        </td>
                      );
                    }

                    const previewText = formatCellPreview(cell.value, cell.status);

                    return (
                      <td
                        key={source.id}
                        id={`coverage-cell-${row.attribute}-${source.id}`}
                        tabIndex={0}
                        role="gridcell"
                        aria-label={`${formattedName} in ${source.title}: ${cell.status}`}
                        title={cell.value ? `${cell.value}\n"${cell.quote || ''}"` : cell.status}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCellClick(cell.claimId, row.attribute);
                        }}
                        className="py-1.5 px-2.5 align-middle text-xs whitespace-nowrap focus:outline-none focus:ring-1 focus:ring-rind rounded-2xs"
                      >
                        {cell.status === 'found' && (
                          <div className="flex items-center gap-1 text-rind font-medium">
                            <Check className="w-3 h-3 shrink-0" />
                            <span className="truncate max-w-28 font-sans">{previewText}</span>
                          </div>
                        )}
                        {cell.status === 'conflict' && (
                          <div className="flex items-center gap-1 text-crack font-bold">
                            <Zap className="w-3 h-3 shrink-0" />
                            <span className="truncate max-w-28 font-sans">{previewText}</span>
                          </div>
                        )}
                        {cell.status === 'stale' && (
                          <div className="flex items-center gap-1 text-wilt font-medium">
                            <Clock className="w-3 h-3 shrink-0" />
                            <span className="truncate max-w-28 font-sans">{previewText}</span>
                          </div>
                        )}
                        {cell.status === 'missing' && (
                          <div className="flex items-center gap-1 text-seed-muted/50 font-mono text-[11px]">
                            <CircleDashed className="w-3 h-3 shrink-0" />
                            <span>Not found</span>
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}

            {/* Zero-claim sources collapsed into one row */}
            {zeroClaimSources.length > 0 && activeSources.length > 0 && (
              <tr className="bg-seed/2 text-seed-muted border-t border-seed/10">
                <td
                  colSpan={1 + (showCoverageStatus ? 1 : 0) + columnSources.length}
                  className="py-2.5 px-3 text-xs italic text-seed-muted/90"
                >
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-3.5 h-3.5 text-seed-muted shrink-0" />
                    <span>
                      <strong className="font-semibold text-seed">{zeroClaimSources.length} source{zeroClaimSources.length === 1 ? '' : 's'} gave no usable text:</strong>
                      {' '}{zeroClaimSources.map((s) => s.domain || s.title).join(', ')}
                    </span>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};