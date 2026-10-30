import React from 'react';
import { CoverageMatrixRow } from '@/lib/types';
import { cn } from '@/lib/utils';
import { SeedIcon, CrackIcon, WiltIcon, VerifiedCheckIcon } from '../common/Icons';
import { motion, useReducedMotion } from 'motion/react';

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
  const shouldReduceMotion = useReducedMotion();
  const total = matrix.length;
  if (total === 0) return null;

  // SVG dimensions
  const width = 500;
  const height = 280;
  const cx = 250;
  const cy = 250;
  const outerRindRadius = 230;
  const innerRindRadius = 212;
  const pithRadius = 202;
  const fleshRadius = 192;

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
    <div className={cn("flex flex-col items-center justify-center p-5 rounded-sm bg-pith border border-seed/10", className)}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full mb-3 gap-2">
        <div>
          <span className="font-heading font-bold text-sm text-seed flex items-center gap-1.5">
            Half-Melon Slice Matrix
          </span>
          <p className="text-[11px] text-seed-muted">
            Each wedge represents one expected parameter. Click to cross-examine.
          </p>
        </div>

        {/* Legend with Text + Icon Shapes */}
        <div className="flex flex-wrap items-center gap-2.5 text-[10px] font-mono uppercase text-seed-muted">
          <span className="inline-flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-flesh" />
            Covered
          </span>
          <span className="inline-flex items-center gap-1">
            <SeedIcon className="w-2.5 h-2.5 fill-current text-seed" />
            Gap
          </span>
          <span className="inline-flex items-center gap-1">
            <CrackIcon className="w-2.5 h-2.5 text-crack" />
            Conflict
          </span>
          <span className="inline-flex items-center gap-1">
            <WiltIcon className="w-2.5 h-2.5 text-wilt" />
            Stale
          </span>
        </div>
      </div>

      <div className="relative w-full max-w-md aspect-[5/3] overflow-visible">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-full select-none"
          role="img"
          aria-label="Half-melon slice visualization of attribute coverage"
        >
          {/* Outer Green Rind */}
          <path
            d={`M ${cx - outerRindRadius} ${cy} A ${outerRindRadius} ${outerRindRadius} 0 0 1 ${cx + outerRindRadius} ${cy} Z`}
            className="fill-rind"
          />

          {/* Inner Pith Rim */}
          <path
            d={`M ${cx - innerRindRadius} ${cy} A ${innerRindRadius} ${innerRindRadius} 0 0 1 ${cx + innerRindRadius} ${cy} Z`}
            className="fill-pith-muted"
          />

          {/* Flesh Base */}
          <path
            d={`M ${cx - pithRadius} ${cy} A ${pithRadius} ${pithRadius} 0 0 1 ${cx + pithRadius} ${cy} Z`}
            className="fill-flesh/15"
          />

          {/* Staggered Wedges & Spring Seeds */}
          {matrix.map((row, idx) => {
            const startAngle = idx * anglePerWedge;
            const endAngle = (idx + 1) * anglePerWedge;
            const midAngle = startAngle + anglePerWedge / 2;
            const isSelected = selectedAttribute === row.attribute;

            let wedgeFill = "fill-flesh/70 hover:fill-flesh";
            if (row.overallStatus === 'gap') {
              wedgeFill = "fill-seed/20 hover:fill-seed/30";
            } else if (row.overallStatus === 'conflict') {
              wedgeFill = "fill-crack/40 hover:fill-crack/60";
            } else if (row.overallStatus === 'thin') {
              wedgeFill = "fill-wilt/30 hover:fill-wilt/50";
            }

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
                {/* Wedge Path with Staggered Fade-In */}
                <motion.path
                  d={describeWedge(startAngle, endAngle, fleshRadius)}
                  initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.25, delay: idx * 0.03 }}
                  className={cn(
                    "transition-colors duration-150 stroke-pith stroke-[1.5]",
                    wedgeFill,
                    isSelected && "stroke-rind stroke-[2.5]"
                  )}
                />

                {/* Seed / Icon with Small Spring Pop-In */}
                <motion.g
                  transform={`translate(${iconPos.x}, ${iconPos.y})`}
                  initial={shouldReduceMotion ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  whileHover={shouldReduceMotion ? {} : { scale: 1.15 }}
                  whileFocus={shouldReduceMotion ? {} : { scale: 1.15 }}
                  transition={{
                    type: 'spring',
                    damping: 16,
                    stiffness: 240,
                    delay: 0.1 + idx * 0.03
                  }}
                >
                  {row.overallStatus === 'gap' ? (
                    <g transform="translate(-6, -7)">
                      <SeedIcon className="w-3.5 h-3.5 fill-current text-seed" />
                    </g>
                  ) : row.overallStatus === 'conflict' ? (
                    <g transform="translate(-7, -7)">
                      <CrackIcon className="w-3.5 h-3.5 text-crack" animateCrack={true} />
                    </g>
                  ) : row.overallStatus === 'thin' ? (
                    <g transform="translate(-7, -7)">
                      <WiltIcon className="w-3.5 h-3.5 text-wilt" />
                    </g>
                  ) : (
                    <g transform="translate(-6, -6)">
                      <VerifiedCheckIcon className="w-3 h-3 text-white" />
                    </g>
                  )}
                </motion.g>

                {/* Number index badge near rim */}
                <text
                  x={labelPos.x}
                  y={labelPos.y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  className="text-[9px] font-mono font-bold fill-seed/60 select-none pointer-events-none"
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
            className="stroke-rind stroke-[3]"
          />
        </svg>
      </div>

      {/* Selected Attribute Readout */}
      {selectedAttribute && (
        <div className="mt-3 text-xs text-seed font-medium flex items-center gap-2 border-t border-seed/10 pt-2 w-full justify-center">
          <span className="text-seed-muted text-[11px] font-mono uppercase">Selected:</span>
          <span className="font-heading font-bold text-rind px-2 py-0.5 rounded-xs bg-rind/10 border border-rind/20">
            {matrix.find(m => m.attribute === selectedAttribute)?.attributeLabel || selectedAttribute}
          </span>
          <span className="text-[10px] font-mono uppercase text-seed-muted">
            ({matrix.find(m => m.attribute === selectedAttribute)?.overallStatus})
          </span>
        </div>
      )}
    </div>
  );
};
