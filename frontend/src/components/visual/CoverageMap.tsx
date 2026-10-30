import React from 'react';
import { CoverageMatrixRow, IngestedSource } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'motion/react';
import { Calendar, AlertCircle } from 'lucide-react';

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

export const CoverageMap: React.FC<CoverageMapProps> = ({
  reportId,
  matrix,
  sources,
  selectedAttribute,
  onSelectAttribute,
  className
}) => {
  const navigate = useNavigate();
  const shouldReduceMotion = useReducedMotion();
  const readySources = sources.filter((s) => s.status === 'ready');
  const showCoverageStatus = readySources.length > 1;

  const handleCellClick = (claimId?: string, attribute?: string) => {
    if (claimId) {
      navigate(`/report/${reportId}/evidence/${encodeURIComponent(claimId)}`);
    } else if (attribute) {
      navigate(`/report/${reportId}/evidence/${encodeURIComponent(attribute)}`);
    }
  };

  return (
    <div className={cn("w-full rounded-sm border border-seed/10 bg-pith space-y-4 p-4 sm:p-5", className)}>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-seed/10 pb-3">
        <div>
          <h2 className="font-heading font-extrabold text-base sm:text-lg text-seed tracking-tight">
            Coverage Map
          </h2>
          <p className="text-xs text-seed-muted">
            Cross-verifies expected parameters against all reviewed primary sources.
          </p>
        </div>
        <span className="text-[11px] font-mono text-seed-muted">
          {matrix.length} parameters × {readySources.length} source{readySources.length === 1 ? '' : 's'}
        </span>
      </div>

      <div className="w-full overflow-x-auto rounded-xs border border-seed/10">
        <table className="w-full text-left text-xs border-collapse" role="table" aria-label="Coverage map">
          <thead>
            <tr className="border-b border-seed/10 bg-seed/[0.03]">
              {/* Expected Attribute Header */}
              <th scope="col" className="py-3 px-3.5 font-heading font-bold text-xs text-seed min-w-[170px]">
                Expected parameter
              </th>

              {/* Overall Coverage Status Header (hidden if only 1 source) */}
              {showCoverageStatus && (
                <th scope="col" className="py-3 px-3 font-heading font-bold text-xs text-seed text-center min-w-[120px]">
                  Coverage status
                </th>
              )}

              {/* Source Column Headers */}
              {readySources.map((source, idx) => (
                <th
                  key={source.id}
                  scope="col"
                  className="py-3 px-3.5 font-heading font-semibold text-seed min-w-[160px]"
                  title={source.title}
                >
                  <div className="flex flex-col gap-1">
                    <span className="truncate text-xs font-bold text-seed">
                      S{idx + 1}: {source.title}
                    </span>
                    <span className="text-[11px] text-seed-muted font-sans font-normal flex items-center gap-1.5 truncate">
                      {source.detectedDate || source.detectedCycle ? (
                        <Calendar className="w-3.5 h-3.5 text-rind shrink-0" />
                      ) : (
                        <AlertCircle className="w-3.5 h-3.5 text-wilt shrink-0" />
                      )}
                      <span className="truncate">{source.domain}</span>
                    </span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-seed/10">
            {matrix.map((row, rowIdx) => {
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
                    "hover:bg-seed/[0.02] transition-colors cursor-pointer focus:outline-none focus:bg-rind/5",
                    isSelected && "bg-rind/5"
                  )}
                >
                  {/* Expected Attribute Name (Sentence case, no snake_case, no uppercase mono) */}
                  <td className="py-3 px-3.5 font-sans font-medium text-seed">
                    <span className="font-heading font-bold text-xs sm:text-sm text-seed">
                      {formattedName}
                    </span>
                  </td>

                  {/* Overall Coverage Status Column (only if >1 source) */}
                  {showCoverageStatus && (
                    <td className="py-3 px-3 text-center align-middle">
                      {row.overallStatus === 'covered' && (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-xs text-[11px] font-sans font-semibold bg-rind/15 text-rind border border-rind/25">
                          <span className="w-1.5 h-1.5 rounded-full bg-rind" />
                          Covered
                        </span>
                      )}
                      {row.overallStatus === 'gap' && (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-xs text-[11px] font-sans font-semibold bg-seed/10 text-seed border border-seed/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-seed" />
                          Gap
                        </span>
                      )}
                      {row.overallStatus === 'conflict' && (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-xs text-[11px] font-sans font-semibold bg-crack/15 text-crack border border-crack/30">
                          <span className="w-1.5 h-1.5 rounded-full bg-crack" />
                          Conflict
                        </span>
                      )}
                      {row.overallStatus === 'thin' && (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-xs text-[11px] font-sans font-semibold bg-wilt/15 text-wilt border border-wilt/30">
                          <span className="w-1.5 h-1.5 rounded-full bg-wilt" />
                          Stale
                        </span>
                      )}
                    </td>
                  )}

                  {/* Per-Source Cells: Large dots with icons and text labels */}
                  {readySources.map((source) => {
                    const cell = row.cells[source.id];
                    if (!cell) {
                      return (
                        <td key={source.id} className="py-3 px-3.5 text-seed-muted/30 text-center font-mono">
                          —
                        </td>
                      );
                    }

                    return (
                      <td
                        key={source.id}
                        tabIndex={0}
                        role="gridcell"
                        aria-label={`${formattedName} in ${source.title}: ${cell.status}`}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            e.stopPropagation();
                            handleCellClick(cell.claimId, row.attribute);
                          }
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCellClick(cell.claimId, row.attribute);
                        }}
                        className="py-3 px-3.5 align-middle focus:outline-none focus:ring-1 focus:ring-rind rounded-xs cursor-pointer group"
                      >
                        <motion.div
                          initial={shouldReduceMotion ? { scale: 1, opacity: 1 } : { scale: 0.5, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          whileHover={shouldReduceMotion ? {} : { scale: 1.15 }}
                          transition={{
                            type: 'spring',
                            stiffness: 350,
                            damping: 24,
                            delay: shouldReduceMotion ? 0 : rowIdx * 0.04
                          }}
                          className="inline-flex items-center gap-2 p-1 rounded-xs group-hover:bg-seed/[0.04] transition-colors"
                          title={cell.value || (cell.status === 'missing' ? 'Not found' : cell.status)}
                        >
                          {/* Found: rind dot + check */}
                          {cell.status === 'found' && (
                            <div className="flex items-center gap-2 text-rind">
                              <svg viewBox="0 0 20 20" className="w-5 h-5 text-rind shrink-0" aria-hidden="true">
                                <circle cx="10" cy="10" r="8" fill="currentColor" fillOpacity="0.18" />
                                <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.5" fill="none" />
                                <path
                                  d="M6.5 10.2l2.3 2.3 4.7-4.7"
                                  stroke="currentColor"
                                  strokeWidth="1.8"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  fill="none"
                                />
                              </svg>
                              <span className="font-sans font-medium text-xs text-seed group-hover:text-rind transition-colors truncate max-w-[130px]">
                                {cell.value || 'Found'}
                              </span>
                            </div>
                          )}

                          {/* Not found: dark seed with ring + "Not found" */}
                          {cell.status === 'missing' && (
                            <div className="flex items-center gap-2 text-seed-muted">
                              <svg viewBox="0 0 20 20" className="w-5 h-5 text-seed shrink-0" aria-hidden="true">
                                <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.2" strokeDasharray="2 2" fill="none" opacity="0.45" />
                                <path
                                  d="M10 5.5 C10 5.5 6.8 9.8 6.8 11.8 C6.8 13.6 8.2 15 10 15 C11.8 15 13.2 13.6 13.2 11.8 C13.2 9.8 10 5.5 10 5.5 Z"
                                  fill="currentColor"
                                />
                              </svg>
                              <span className="font-sans font-normal text-xs text-seed-muted">
                                Not found
                              </span>
                            </div>
                          )}

                          {/* Conflict: crack dot + zigzag connector that draws (0.5s) */}
                          {cell.status === 'conflict' && (
                            <div className="flex items-center gap-2 text-crack">
                              <svg viewBox="0 0 20 20" className="w-5 h-5 text-crack shrink-0" aria-hidden="true">
                                <circle cx="10" cy="10" r="8" fill="currentColor" fillOpacity="0.2" />
                                <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.5" fill="none" />
                                <motion.path
                                  d="M10 4.5 L8 8.8 L12 11.2 L9.5 15.5"
                                  stroke="currentColor"
                                  strokeWidth="1.8"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  fill="none"
                                  initial={shouldReduceMotion ? { pathLength: 1 } : { pathLength: 0 }}
                                  animate={{ pathLength: 1 }}
                                  transition={{ duration: 0.5, ease: 'easeOut', delay: shouldReduceMotion ? 0 : 0.15 }}
                                />
                              </svg>
                              <span className="font-sans font-bold text-xs text-crack truncate max-w-[130px]">
                                {cell.value || 'Conflict'}
                              </span>
                            </div>
                          )}

                          {/* Stale: pale hatched dot */}
                          {cell.status === 'stale' && (
                            <div className="flex items-center gap-2 text-wilt">
                              <svg viewBox="0 0 20 20" className="w-5 h-5 text-wilt shrink-0" aria-hidden="true">
                                <defs>
                                  <pattern
                                    id={`cell-hatch-${rowIdx}`}
                                    width="4"
                                    height="4"
                                    patternTransform="rotate(45 0 0)"
                                    patternUnits="userSpaceOnUse"
                                  >
                                    <line x1="0" y1="0" x2="0" y2="4" stroke="currentColor" strokeWidth="1.2" />
                                  </pattern>
                                </defs>
                                <circle cx="10" cy="10" r="8" fill={`url(#cell-hatch-${rowIdx})`} opacity="0.6" />
                                <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.5" fill="none" />
                              </svg>
                              <span className="font-sans font-medium text-xs text-wilt truncate max-w-[130px]">
                                {cell.value || 'Stale'}
                              </span>
                            </div>
                          )}
                        </motion.div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Short text legend beneath */}
      <div className="pt-2 border-t border-seed/10 flex flex-wrap items-center justify-between text-xs text-seed-muted gap-3">
        <div className="flex flex-wrap items-center gap-4">
          <span className="font-bold text-seed">Legend:</span>
          <span className="inline-flex items-center gap-1.5 text-rind font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-rind" /> Found
          </span>
          <span className="inline-flex items-center gap-1.5 text-seed font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-seed" /> Not found (gap)
          </span>
          <span className="inline-flex items-center gap-1.5 text-crack font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-crack" /> Conflict
          </span>
          <span className="inline-flex items-center gap-1.5 text-wilt font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-wilt" /> Stale
          </span>
        </div>
        <span className="text-[11px] font-sans text-seed-muted">
          Hover cell to inspect • Click to open evidence drawer
        </span>
      </div>
    </div>
  );
};

