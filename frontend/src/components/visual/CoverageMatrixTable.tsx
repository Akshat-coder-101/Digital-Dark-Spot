import React from 'react';
import { CoverageMatrixRow, IngestedSource } from '@/lib/types';
import { cn } from '@/lib/utils';
import { SeedIcon, CrackIcon, WiltIcon, VerifiedCheckIcon } from '../common/Icons';
import { useNavigate } from 'react-router-dom';

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
  const readySources = sources.filter(s => s.status === 'ready');

  const handleCellClick = (claimId?: string) => {
    if (claimId) {
      navigate(`/report/${reportId}/evidence/${claimId}`);
    }
  };

  return (
    <div className={cn("w-full overflow-x-auto rounded-2xl border border-border bg-pith-card shadow-2xs", className)}>
      <table className="w-full text-left text-xs border-collapse" role="table">
        <thead>
          <tr className="border-b border-border bg-pith-muted/60">
            <th scope="col" className="py-3 px-4 font-heading font-bold text-seed uppercase tracking-wider">
              Expected Attribute
            </th>
            <th scope="col" className="py-3 px-3 font-heading font-bold text-seed uppercase tracking-wider text-center">
              Coverage
            </th>
            {readySources.map((source, idx) => (
              <th
                key={source.id}
                scope="col"
                className="py-3 px-3 font-heading font-semibold text-seed truncate max-w-[150px]"
                title={source.title}
              >
                <div className="flex flex-col">
                  <span className="truncate">S{idx + 1}: {source.title}</span>
                  <span className="text-[10px] text-seed-muted font-normal truncate">{source.domain}</span>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {matrix.map((row) => {
            const isSelected = selectedAttribute === row.attribute;

            return (
              <tr
                key={row.attribute}
                onClick={() => onSelectAttribute(row.attribute)}
                className={cn(
                  "hover:bg-pith-muted/40 transition-colors cursor-pointer",
                  isSelected && "bg-rind/5"
                )}
              >
                {/* Attribute Name */}
                <td className="py-3 px-4 font-medium text-seed">
                  <div className="flex items-center gap-2">
                    <span className="font-heading font-bold text-xs">{row.attributeLabel}</span>
                    <span className="text-[10px] font-mono text-seed-muted hidden sm:inline-block">({row.attribute})</span>
                  </div>
                </td>

                {/* Overall status badge */}
                <td className="py-3 px-3 text-center">
                  {row.overallStatus === 'covered' && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-rind/15 text-rind">
                      <VerifiedCheckIcon className="w-3 h-3" />
                      Covered
                    </span>
                  )}
                  {row.overallStatus === 'gap' && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-seed text-pith">
                      <SeedIcon className="w-3 h-3 fill-current" />
                      Gap
                    </span>
                  )}
                  {row.overallStatus === 'conflict' && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-crack-subtle text-crack border border-crack/30">
                      <CrackIcon className="w-3 h-3" />
                      Conflict
                    </span>
                  )}
                  {row.overallStatus === 'thin' && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-wilt-subtle text-wilt border border-wilt/30">
                      <WiltIcon className="w-3 h-3" />
                      Thin
                    </span>
                  )}
                </td>

                {/* Per Source Cells */}
                {readySources.map((source) => {
                  const cell = row.cells[source.id];
                  if (!cell) {
                    return <td key={source.id} className="py-3 px-3 text-seed-muted text-center">—</td>;
                  }

                  return (
                    <td
                      key={source.id}
                      onClick={(e) => {
                        if (cell.claimId) {
                          e.stopPropagation();
                          handleCellClick(cell.claimId);
                        }
                      }}
                      className={cn(
                        "py-3 px-3 align-middle",
                        cell.claimId ? "cursor-pointer hover:underline hover:text-rind" : ""
                      )}
                    >
                      {cell.status === 'found' && (
                        <div className="flex items-center gap-1.5 text-rind font-medium">
                          <VerifiedCheckIcon className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate max-w-[130px]" title={cell.value}>
                            {cell.value || 'Found'}
                          </span>
                        </div>
                      )}
                      {cell.status === 'conflict' && (
                        <div className="flex items-center gap-1.5 text-crack font-bold">
                          <CrackIcon className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate max-w-[130px]" title={cell.value}>
                            {cell.value || 'Conflict'}
                          </span>
                        </div>
                      )}
                      {cell.status === 'stale' && (
                        <div className="flex items-center gap-1.5 text-wilt">
                          <WiltIcon className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate max-w-[130px]" title={cell.value}>
                            {cell.value || 'Stale claim'}
                          </span>
                        </div>
                      )}
                      {cell.status === 'missing' && (
                        <div className="flex items-center gap-1 text-seed-muted/60">
                          <span className="w-1.5 h-1.5 rounded-full bg-seed-muted/40" />
                          <span>Not found</span>
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

