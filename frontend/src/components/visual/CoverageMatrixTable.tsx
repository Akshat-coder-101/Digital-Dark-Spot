import React from 'react';
import { CoverageMatrixRow, IngestedSource } from '@/lib/types';
import { cn } from '@/lib/utils';
import { SeedIcon, CrackIcon, WiltIcon, VerifiedCheckIcon } from '../common/Icons';
import { useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'motion/react';
import { Calendar, AlertCircle } from 'lucide-react';

interface CoverageMatrixTableProps {
  reportId: string;
  matrix: CoverageMatrixRow[];
  sources: IngestedSource[];
  selectedAttribute?: string | null;
  onSelectAttribute: (attr: string) => void;
  className?: string;
}

export const CoverageMatrixTable: React.FC<CoverageMatrixTableProps> = ({
  reportId,
  matrix,
  sources,
  selectedAttribute,
  onSelectAttribute,
  className
}) => {
  const navigate = useNavigate();
  const shouldReduceMotion = useReducedMotion();
  const readySources = sources.filter(s => s.status === 'ready');

  const handleCellClick = (claimId?: string, attribute?: string) => {
    if (claimId) {
      navigate(`/report/${reportId}/evidence/${claimId}`);
    } else if (attribute) {
      navigate(`/report/${reportId}/evidence/${encodeURIComponent(attribute)}`);
    }
  };

  return (
    <div className={cn("w-full rounded-sm border border-seed/10 bg-pith space-y-3 p-4", className)}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-heading font-bold text-sm text-seed">
            Cross-Source Coverage Matrix
          </h3>
          <p className="text-[11px] text-seed-muted">
            Audits each expected parameter across all reviewed primary documents.
          </p>
        </div>
      </div>

      <div className="w-full overflow-x-auto rounded-xs border border-seed/10">
        <table className="w-full text-left text-xs border-collapse" role="table" aria-label="Coverage matrix">
          <thead>
            <tr className="border-b border-seed/10 bg-seed/[0.02]">
              <th scope="col" className="py-2.5 px-3 font-heading font-bold text-xs text-seed">
                Expected parameter
              </th>
              <th scope="col" className="py-2.5 px-2 font-heading font-bold text-xs text-seed text-center">
                Coverage status
              </th>
              {readySources.map((source, idx) => (
                <th
                  key={source.id}
                  scope="col"
                  className="py-2.5 px-3 font-heading font-semibold text-seed truncate max-w-[160px]"
                  title={source.title}
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="truncate">S{idx + 1}: {source.title}</span>
                    <span className="text-[10px] text-seed-muted font-mono font-normal flex items-center gap-1 truncate">
                      {source.detectedDate || source.detectedCycle ? (
                        <Calendar className="w-3 h-3 text-rind shrink-0" />
                      ) : (
                        <AlertCircle className="w-3 h-3 text-wilt shrink-0" />
                      )}
                      {source.domain}
                    </span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-seed/10">
            {matrix.map((row, rowIdx) => {
              const isSelected = selectedAttribute === row.attribute;

              return (
                <motion.tr
                  key={row.attribute}
                  initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: shouldReduceMotion ? 0 : 0.3 + rowIdx * 0.05 }}
                  onClick={() => onSelectAttribute(row.attribute)}
                  tabIndex={0}
                  role="row"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onSelectAttribute(row.attribute);
                    }
                  }}
                  className={cn(
                    "hover:bg-seed/[0.02] transition-colors cursor-pointer focus:outline-none focus:bg-rind/5",
                    isSelected && "bg-rind/5"
                  )}
                >
                  {/* Attribute Name */}
                  <td className="py-2.5 px-3 font-medium text-seed">
                    <div className="flex items-center gap-2">
                      <span className="font-heading font-bold text-xs">{row.attributeLabel}</span>
                      <span className="text-[10px] font-mono text-seed-muted hidden sm:inline-block">({row.attribute})</span>
                    </div>
                  </td>

                  {/* Overall status badge */}
                  <td className="py-2.5 px-2 text-center">
                    {row.overallStatus === 'covered' && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-xs text-[10px] font-mono font-semibold bg-rind/10 text-rind border border-rind/20">
                        <VerifiedCheckIcon className="w-3 h-3" />
                        Found
                      </span>
                    )}
                    {row.overallStatus === 'gap' && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-xs text-[10px] font-mono font-semibold bg-seed text-pith">
                        <SeedIcon className="w-3 h-3 fill-current" />
                        Not found
                      </span>
                    )}
                    {row.overallStatus === 'conflict' && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-xs text-[10px] font-mono font-semibold bg-crack/10 text-crack border border-crack/20">
                        <CrackIcon className="w-3 h-3" />
                        Conflict
                      </span>
                    )}
                    {row.overallStatus === 'thin' && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-xs text-[10px] font-mono font-semibold bg-wilt/15 text-wilt border border-wilt/20">
                        <WiltIcon className="w-3 h-3" />
                        Stale
                      </span>
                    )}
                  </td>

                  {/* Per Source Cells */}
                  {readySources.map((source) => {
                    const cell = row.cells[source.id];
                    if (!cell) {
                      return <td key={source.id} className="py-2.5 px-3 text-seed-muted/40 text-center font-mono">—</td>;
                    }

                    return (
                      <td
                        key={source.id}
                        tabIndex={0}
                        role="gridcell"
                        aria-label={`${row.attributeLabel} in ${source.title}: ${cell.status}`}
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
                        className={cn(
                          "py-2.5 px-3 align-middle text-xs focus:outline-none focus:ring-1 focus:ring-rind rounded-xs",
                          cell.claimId || cell.status === 'missing' ? "cursor-pointer hover:underline hover:text-rind" : ""
                        )}
                      >
                        {cell.status === 'found' && (
                          <div className="flex items-center gap-1.5 text-rind font-medium">
                            <VerifiedCheckIcon className="w-3 h-3 shrink-0" />
                            <span className="truncate max-w-[130px]" title={cell.value}>
                              {cell.value || 'Found'}
                            </span>
                          </div>
                        )}
                        {cell.status === 'conflict' && (
                          <div className="flex items-center gap-1.5 text-crack font-bold">
                            <CrackIcon className="w-3 h-3 shrink-0" />
                            <span className="truncate max-w-[130px]" title={cell.value}>
                              {cell.value || 'Conflict'}
                            </span>
                          </div>
                        )}
                        {cell.status === 'stale' && (
                          <div className="flex items-center gap-1.5 text-wilt">
                            <WiltIcon className="w-3 h-3 shrink-0" />
                            <span className="truncate max-w-[130px]" title={cell.value}>
                              {cell.value || 'Stale'}
                            </span>
                          </div>
                        )}
                        {cell.status === 'missing' && (
                          <div className="flex items-center gap-1 text-seed-muted/60 font-mono text-[11px]">
                            <span className="w-1.5 h-1.5 rounded-full bg-seed-muted/40" />
                            <span>Not found</span>
                          </div>
                        )}
                      </td>
                    );
                  })}
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Text legend underneath */}
      <div className="pt-2 border-t border-seed/10 flex flex-wrap items-center justify-between text-[11px] text-seed-muted gap-2">
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-semibold text-seed">Legend:</span>
          <span className="inline-flex items-center gap-1 text-rind"><VerifiedCheckIcon className="w-3 h-3" /> Found (verbatim claim)</span>
          <span className="inline-flex items-center gap-1 text-seed"><SeedIcon className="w-2.5 h-2.5 fill-current" /> Not found (information gap)</span>
          <span className="inline-flex items-center gap-1 text-crack"><CrackIcon className="w-3 h-3" /> Conflict (contradictory value)</span>
          <span className="inline-flex items-center gap-1 text-wilt"><WiltIcon className="w-3 h-3" /> Stale (earlier cycle/undated)</span>
        </div>
        <span className="font-mono text-[10px]">Click any cell to inspect evidence</span>
      </div>
    </div>
  );
};
