import React from 'react';
import { CoverageMatrixRow } from '@/lib/types';
import { cn } from '@/lib/utils';
import { SeedIcon, CrackIcon, WiltIcon, VerifiedCheckIcon } from '../common/Icons';

interface HalfMelonSliceViewProps {
  matrix: CoverageMatrixRow[];
  selectedAttribute?: string | null;
  onSelectAttribute: (attr: string) => void;
  className?: string;
}

export const HalfMelonSliceView: React.FC<HalfMelonSliceViewProps> = ({
  matrix,
  selectedAttribute,
  onSelectAttribute,
  className
}) => {
  const total = matrix.length;
  if (total === 0) return null;

  // SVG parameters for half-melon
  const width = 500;
  const height = 280;
  const cx = 250;
  const cy = 250;
  const outerRindRadius = 230;
  const innerRindRadius = 210;
  const pithRadius = 200;
  const fleshRadius = 190;

  // Slice angles: from 180 deg (left) to 0 deg (right)
  const anglePerWedge = 180 / total;

  const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
    const angleInRadians = ((angleInDegrees - 180) * Math.PI) / 180.0;
    return {
      x: centerX + radius * Math.cos(angleInRadians),
      y: centerY + radius * Math.sin(angleInRadians)
    };
  };

  const describeWedge = (startAngle: number, endAngle: number, r: number) => {
    const start = polarToCartesian(cx, cy, r, endAngle);
    const end = polarToCartesian(cx, cy, r, startAngle);
    const arcSweep = endAngle - startAngle <= 180 ? '0' : '1';
    return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${arcSweep} 0 ${end.x} ${end.y} Z`;
  };

  return (
    <div className={cn("flex flex-col items-center justify-center p-4 rounded-2xl bg-pith-card border border-border", className)}>
      <div className="flex items-center justify-between w-full mb-2 px-2">
        <div>
          <span className="font-heading font-bold text-sm text-seed flex items-center gap-1.5">
            Half-Melon Slice View
          </span>
          <p className="text-xs text-seed-muted">
            Each wedge represents one expected attribute. Click any wedge to inspect.
          </p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 text-[11px] font-medium text-seed-muted">
          <span className="inline-flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-flesh" />
            Covered
          </span>
          <span className="inline-flex items-center gap-1">
            <SeedIcon className="w-3 h-3 fill-seed" />
            Gap (Seed)
          </span>
          <span className="inline-flex items-center gap-1">
            <CrackIcon className="w-3 h-3 text-crack" />
            Conflict
          </span>
          <span className="inline-flex items-center gap-1">
            <WiltIcon className="w-3 h-3 text-wilt" />
            Stale
          </span>
        </div>
      </div>

      <div className="relative w-full max-w-md aspect-[5/3] overflow-visible">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-full select-none"
          role="img"
          aria-label="Half watermelon visualization of attribute coverage"
        >
          {/* Outer Green Rind */}
          <path
            d={`M ${cx - outerRindRadius} ${cy} A ${outerRindRadius} ${outerRindRadius} 0 0 1 ${cx + outerRindRadius} ${cy} Z`}
            className="fill-rind transition-colors"
          />

          {/* Inner Pith Rim (Pale White/Green) */}
          <path
            d={`M ${cx - innerRindRadius} ${cy} A ${innerRindRadius} ${innerRindRadius} 0 0 1 ${cx + innerRindRadius} ${cy} Z`}
            className="fill-pith-muted transition-colors"
          />

          {/* Flesh Base */}
          <path
            d={`M ${cx - pithRadius} ${cy} A ${pithRadius} ${pithRadius} 0 0 1 ${cx + pithRadius} ${cy} Z`}
            className="fill-flesh/20 transition-colors"
          />

          {/* Attribute Wedges */}
          {matrix.map((row, idx) => {
            const startAngle = idx * anglePerWedge;
            const endAngle = (idx + 1) * anglePerWedge;
            const midAngle = startAngle + anglePerWedge / 2;
            const isSelected = selectedAttribute === row.attribute;

            // Determine wedge fill color
            let wedgeFill = "fill-flesh/80 hover:fill-flesh";
            if (row.overallStatus === 'gap') {
              wedgeFill = "fill-flesh/30 hover:fill-flesh/50";
            } else if (row.overallStatus === 'conflict') {
              wedgeFill = "fill-crack/50 hover:fill-crack/80";
            } else if (row.overallStatus === 'thin') {
              wedgeFill = "fill-wilt/40 hover:fill-wilt/60";
            }

            // Position for seed / icon indicator
            const iconPos = polarToCartesian(cx, cy, fleshRadius * 0.62, midAngle);
            const labelPos = polarToCartesian(cx, cy, fleshRadius * 0.85, midAngle);

            return (
              <g
                key={row.attribute}
                onClick={() => onSelectAttribute(row.attribute)}
                className="cursor-pointer group focus:outline-none"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') onSelectAttribute(row.attribute);
                }}
              >
                {/* Wedge Path */}
                <path
                  d={describeWedge(startAngle, endAngle, fleshRadius)}
                  className={cn(
                    "transition-all duration-200 stroke-pith-card stroke-[1.5]",
                    wedgeFill,
                    isSelected && "stroke-rind stroke-[3] brightness-110"
                  )}
                />

                {/* Wedge Metaphor Icon in Center */}
                {row.overallStatus === 'gap' ? (
                  // Black Seed icon for gap
                  <g transform={`translate(${iconPos.x - 6}, ${iconPos.y - 7})`}>
                    <SeedIcon className="w-3.5 h-3.5 fill-seed transition-transform group-hover:scale-125" />
                  </g>
                ) : row.overallStatus === 'conflict' ? (
                  // Crack icon
                  <g transform={`translate(${iconPos.x - 7}, ${iconPos.y - 7})`}>
                    <CrackIcon className="w-3.5 h-3.5 text-crack transition-transform group-hover:scale-125" />
                  </g>
                ) : row.overallStatus === 'thin' ? (
                  // Wilt icon
                  <g transform={`translate(${iconPos.x - 7}, ${iconPos.y - 7})`}>
                    <WiltIcon className="w-3.5 h-3.5 text-wilt transition-transform group-hover:scale-125" />
                  </g>
                ) : (
                  // Sourced verified check
                  <g transform={`translate(${iconPos.x - 6}, ${iconPos.y - 6})`}>
                    <VerifiedCheckIcon className="w-3 h-3 text-white transition-transform group-hover:scale-125" />
                  </g>
                )}

                {/* Number index badge near rim */}
                <text
                  x={labelPos.x}
                  y={labelPos.y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  className="text-[9px] font-mono font-bold fill-seed/70 select-none pointer-events-none"
                >
                  {idx + 1}
                </text>
              </g>
            );
          })}

          {/* Central Cut Line Base */}
          <line
            x1={cx - outerRindRadius}
            y1={cy}
            x2={cx + outerRindRadius}
            y2={cy}
            className="stroke-rind stroke-[4]"
          />
        </svg>
      </div>

      {/* Selected Attribute Readout Pill */}
      {selectedAttribute && (
        <div className="mt-3 text-xs text-seed font-medium flex items-center gap-2">
          <span className="text-seed-muted">Selected Wedge:</span>
          <span className="font-heading font-bold text-rind px-2 py-0.5 rounded-md bg-rind/10 border border-rind/20">
            {matrix.find(m => m.attribute === selectedAttribute)?.attributeLabel || selectedAttribute}
          </span>
          <span className="text-[11px] font-mono uppercase text-seed-muted">
            Status: {matrix.find(m => m.attribute === selectedAttribute)?.overallStatus}
          </span>
        </div>
      )}
    </div>
  );
};
