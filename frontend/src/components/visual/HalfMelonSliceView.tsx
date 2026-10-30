import React, { useState } from 'react';
import { CoverageMatrixRow } from '@/lib/types';
import { cn } from '@/lib/utils';
import { SeedIcon, CrackIcon, WiltIcon, VerifiedCheckIcon } from '../common/Icons';
import { motion, useReducedMotion } from 'motion/react';
import { useNavigate } from 'react-router-dom';

interface HalfMelonSliceViewProps {
  reportId: string;
  matrix: CoverageMatrixRow[];
  selectedAttribute?: string | null;
  onSelectAttribute: (attr: string) => void;
  className?: string;
}

export const HalfMelonSliceView: React.FC<HalfMelonSliceViewProps> = ({
  reportId,
  matrix,
  selectedAttribute,
  onSelectAttribute,
  className
}) => {
  const navigate = useNavigate();
  const shouldReduceMotion = useReducedMotion();
  const [hoveredWedge, setHoveredWedge] = useState<CoverageMatrixRow | null>(null);

  const total = matrix.length;
  if (total === 0) return null;

  // SVG dimensions
  const width = 520;
  const height = 295;
  const cx = 260;
  const cy = 265;
  const outerRindRadius = 240;
  const innerRindRadius = 222;
  const pithRadius = 212;
  const fleshRadius = 200;

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

  const handleWedgeClick = (row: CoverageMatrixRow) => {
    onSelectAttribute(row.attribute);
    // Find first available claimId or navigate to attribute evidence
    const firstClaimId = Object.values(row.cells).find(c => c.claimId)?.claimId;
    if (firstClaimId) {
      navigate(`/report/${reportId}/evidence/${firstClaimId}`);
    } else {
      // Gap or unattached attribute: open evidence drawer for this gap
      navigate(`/report/${reportId}/evidence/${encodeURIComponent(row.attribute)}`);
    }
  };

  return (
    <div className={cn("flex flex-col items-center justify-center p-5 rounded-sm bg-pith border border-seed/10 shadow-xs relative", className)}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full mb-3 gap-2">
        <div>
          <span className="font-heading font-bold text-sm text-seed flex items-center gap-1.5">
            Half-Melon Slice View
          </span>
          <p className="text-[11px] text-seed-muted">
            Click any wedge to inspect evidence. Fills derived from matrix data.
          </p>
        </div>

        {/* Legend with Text + Icon Shapes */}
        <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono uppercase text-seed-muted">
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
          className="w-full h-full select-none overflow-visible"
          role="img"
          aria-label="Half-melon slice visualization of attribute coverage"
        >
          <defs>
            {/* Pale hatched pattern for stale wedge */}
            <pattern
              id="stale-hatch-slice"
              width="6"
              height="6"
              patternTransform="rotate(45 0 0)"
              patternUnits="userSpaceOnUse"
            >
              <rect width="6" height="6" fill="var(--color-wilt)" fillOpacity="0.2" />
              <line x1="0" y1="0" x2="0" y2="6" stroke="var(--color-wilt)" strokeWidth="1.2" strokeOpacity="0.8" />
            </pattern>
          </defs>

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

          {/* 6. Hero Moment: Wedges fade in one by one (0.04s stagger) */}
          {matrix.map((row, idx) => {
            const startAngle = idx * anglePerWedge;
            const endAngle = (idx + 1) * anglePerWedge;
            const midAngle = startAngle + anglePerWedge / 2;
            const isSelected = selectedAttribute === row.attribute;

            let wedgeFill = "fill-flesh/70 hover:fill-flesh";
            let customFillAttr: string | undefined = undefined;

            if (row.overallStatus === 'gap') {
              wedgeFill = "fill-seed/20 hover:fill-seed/35";
            } else if (row.overallStatus === 'conflict') {
              wedgeFill = "fill-crack/40 hover:fill-crack/60";
            } else if (row.overallStatus === 'thin') {
              customFillAttr = "url(#stale-hatch-slice)";
            }

            const iconPos = polarToCartesian(cx, cy, fleshRadius * 0.62, midAngle);
            const labelPos = polarToCartesian(cx, cy, outerRindRadius + 14, midAngle);

            return (
              <g
                key={row.attribute}
                onClick={() => handleWedgeClick(row)}
                onMouseEnter={() => setHoveredWedge(row)}
                onMouseLeave={() => setHoveredWedge(null)}
                className="cursor-pointer group focus:outline-none"
                tabIndex={0}
                role="button"
                aria-label={`${row.attributeLabel}: ${row.overallStatus}. Click to inspect evidence.`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleWedgeClick(row);
                  }
                }}
              >
                {/* Wedge Path */}
                <motion.path
                  d={describeWedge(startAngle, endAngle, fleshRadius)}
                  fill={customFillAttr}
                  initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3, delay: shouldReduceMotion ? 0 : idx * 0.04 }}
                  className={cn(
                    "transition-colors duration-150 stroke-pith stroke-[1.5]",
                    wedgeFill,
                    isSelected && "stroke-rind stroke-[2.5]"
                  )}
                />

                {/* Seed / Icon with Light Spring Pop-In (scale 0.5 to 1) */}
                <motion.g
                  transform={`translate(${iconPos.x}, ${iconPos.y})`}
                  initial={shouldReduceMotion ? { scale: 1, opacity: 1 } : { scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  whileHover={shouldReduceMotion ? {} : { scale: 1.15, y: -2 }}
                  whileFocus={shouldReduceMotion ? {} : { scale: 1.15, y: -2 }}
                  transition={{
                    type: 'spring',
                    damping: 18,
                    stiffness: 300,
                    delay: shouldReduceMotion ? 0 : 0.15 + idx * 0.04
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

                {/* Sentence-Case Attribute Label Around the Arc */}
                <text
                  x={labelPos.x}
                  y={labelPos.y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  className={cn(
                    "text-[10px] font-sans font-medium select-none pointer-events-none transition-colors",
                    isSelected ? "fill-rind font-bold" : "fill-seed/70"
                  )}
                >
                  {row.attributeLabel}
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

        {/* Hover / Focus Tooltip displaying attribute and state */}
        {hoveredWedge && (
          <div className="absolute top-1 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-xs bg-seed text-pith text-xs shadow-md pointer-events-none z-20 flex items-center gap-1.5 whitespace-nowrap">
            <span className="font-heading font-bold">{hoveredWedge.attributeLabel}</span>
            <span className="text-[10px] opacity-75 font-mono">({hoveredWedge.overallStatus})</span>
            <span className="text-[10px] text-rind-hover font-semibold">Click to inspect →</span>
          </div>
        )}
      </div>

      {/* Selected Attribute Readout */}
      {selectedAttribute && (
        <div className="mt-4 text-xs text-seed font-medium flex items-center gap-2 border-t border-seed/10 pt-2.5 w-full justify-center">
          <span className="text-seed-muted text-[11px] font-mono">Selected:</span>
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
