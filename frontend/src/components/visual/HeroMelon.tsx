import React, { useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { cn } from '@/lib/utils';

interface HeroMelonProps {
  className?: string;
}

export const HeroMelon: React.FC<HeroMelonProps> = ({ className }) => {
  const shouldReduceMotion = useReducedMotion();
  const [isHovered, setIsHovered] = useState(false);

  // Geometry: 520px wide forensic half-melon
  const width = 520;
  const height = 290;
  const cx = 260;
  const cy = 275;
  const outerRindRadius = 250;
  const innerRindRadius = 232;
  const pithRadius = 220;
  const fleshRadius = 208;

  const totalWedges = 8;
  const anglePerWedge = 180 / totalWedges; // 22.5 deg

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

  // 8 Wedges semantic configuration:
  // 0, 1, 2, 4, 5, 7: Covered with flesh tint
  // 3: Pale hatched stale wedge (temporal warning)
  // 6: Gap wedge (uncovered parameter)
  const wedges = [
    { type: 'covered', label: 'Eligibility' },
    { type: 'covered', label: 'Deadline' },
    { type: 'covered', label: 'Benefits' },
    { type: 'stale', label: 'Prior Cycle (2024)' },
    { type: 'covered', label: 'Submission' },
    { type: 'covered', label: 'Income Limit' },
    { type: 'gap', label: 'Renewal Policy' },
    { type: 'covered', label: 'Documents' },
  ];

  return (
    <motion.div
      className={cn("relative select-none", className)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={shouldReduceMotion ? {} : { scale: 1.02 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
    >
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto overflow-visible select-none drop-shadow-xs"
        role="img"
        aria-label="Information Dark Spot forensic data visualization of attribute coverage"
      >
        <defs>
          {/* Pale hatched pattern for stale wedge */}
          <pattern
            id="stale-hatch"
            width="8"
            height="8"
            patternTransform="rotate(45 0 0)"
            patternUnits="userSpaceOnUse"
          >
            <rect width="8" height="8" fill="var(--color-wilt)" fillOpacity="0.18" />
            <line x1="0" y1="0" x2="0" y2="8" stroke="var(--color-wilt)" strokeWidth="1.5" strokeOpacity="0.75" />
          </pattern>

          {/* Clip path for half-melon interior to bound the slow scanning radar line */}
          <clipPath id="hero-melon-interior">
            <path
              d={`M ${cx - outerRindRadius} ${cy} A ${outerRindRadius} ${outerRindRadius} 0 0 1 ${cx + outerRindRadius} ${cy} Z`}
            />
          </clipPath>
        </defs>

        {/* Outer Green Rind Arc: 0.6s draw sequence on first load */}
        <motion.path
          d={`M ${cx - outerRindRadius} ${cy} A ${outerRindRadius} ${outerRindRadius} 0 0 1 ${cx + outerRindRadius} ${cy}`}
          fill="none"
          stroke="var(--color-rind)"
          strokeWidth="10"
          strokeLinecap="round"
          initial={shouldReduceMotion ? { pathLength: 1 } : { pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />

        {/* Inner Pith Rim */}
        <motion.path
          d={`M ${cx - innerRindRadius} ${cy} A ${innerRindRadius} ${innerRindRadius} 0 0 1 ${cx + innerRindRadius} ${cy}`}
          fill="none"
          stroke="var(--color-pith-border)"
          strokeWidth="4"
          initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        />

        {/* Flesh Base Background (Subtle) */}
        <path
          d={`M ${cx - pithRadius} ${cy} A ${pithRadius} ${pithRadius} 0 0 1 ${cx + pithRadius} ${cy} Z`}
          fill="var(--color-flesh)"
          fillOpacity="0.06"
        />

        {/* 8 Wedges with Sequential Staggered Fade-in */}
        {wedges.map((w, idx) => {
          const startAngle = idx * anglePerWedge;
          const endAngle = (idx + 1) * anglePerWedge;

          let fillValue = "var(--color-flesh)";
          let fillOpacity = 0.22;
          let strokeColor = "var(--color-pith)";

          if (w.type === 'stale') {
            fillValue = "url(#stale-hatch)";
            fillOpacity = 1;
            strokeColor = "var(--color-wilt)";
          } else if (w.type === 'gap') {
            fillValue = "var(--color-seed)";
            fillOpacity = 0.04;
            strokeColor = "var(--color-seed)";
          }

          return (
            <motion.path
              key={idx}
              d={describeWedge(startAngle, endAngle, fleshRadius)}
              fill={fillValue}
              fillOpacity={fillOpacity}
              stroke={strokeColor}
              strokeWidth="1.5"
              strokeDasharray={w.type === 'gap' ? "3 3" : undefined}
              initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{
                duration: 0.3,
                delay: shouldReduceMotion ? 0 : 0.15 + idx * 0.04,
                ease: 'easeOut'
              }}
            />
          );
        })}

        {/* Central Baseline Divider */}
        <motion.line
          x1={cx - outerRindRadius}
          y1={cy}
          x2={cx + outerRindRadius}
          y2={cy}
          stroke="var(--color-rind)"
          strokeWidth="3.5"
          strokeLinecap="round"
          initial={shouldReduceMotion ? { pathLength: 1 } : { pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />

        {/* Amber Crack Fracture Line across Wedge 5: 0.5s draw sequence */}
        <motion.path
          d="M 260,275 L 282,228 L 270,188 L 298,142 L 286,104 L 314,70"
          fill="none"
          stroke="var(--color-crack)"
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={shouldReduceMotion ? { pathLength: 1, opacity: 1 } : { pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{
            duration: 0.5,
            delay: shouldReduceMotion ? 0 : 0.55,
            ease: 'easeInOut'
          }}
        />

        {/* Visible Dark Seeds in Each Wedge: pop-in on load (scale 0.5 to 1), lift 3px on hover */}
        {wedges.map((w, idx) => {
          const midAngle = idx * anglePerWedge + anglePerWedge / 2;
          const seedPos = polarToCartesian(cx, cy, 140, midAngle);
          const rotation = midAngle - 90; // Align radially

          const seedFill = w.type === 'stale' 
            ? 'var(--color-wilt)' 
            : 'var(--color-seed)';

          return (
            <motion.g
              key={idx}
              transform={`translate(${seedPos.x}, ${seedPos.y}) rotate(${rotation})`}
              initial={shouldReduceMotion ? { scale: 1, opacity: 1 } : { scale: 0.5, opacity: 0 }}
              animate={
                isHovered && !shouldReduceMotion
                  ? { scale: 1.08, y: -3, opacity: 1 }
                  : { scale: 1, y: 0, opacity: 1 }
              }
              transition={{
                type: 'spring',
                stiffness: 350,
                damping: 18,
                delay: shouldReduceMotion ? 0 : 0.35 + idx * 0.04
              }}
            >
              {/* Bold teardrop seed path */}
              <path
                d="M 0,-8 C -4,-3.5 -5.5,2.5 0,8.5 C 5.5,2.5 4,-3.5 0,-8 Z"
                fill={seedFill}
                fillOpacity={w.type === 'gap' ? 0.9 : 0.95}
                stroke="var(--color-pith)"
                strokeWidth="1.2"
              />
            </motion.g>
          );
        })}

        {/* One slow radar scan line sweeping across every ~10s at low opacity (strictly paused under reduced motion) */}
        {!shouldReduceMotion && (
          <g clipPath="url(#hero-melon-interior)">
            <motion.line
              x1={cx - outerRindRadius}
              y1={cy - outerRindRadius}
              x2={cx - outerRindRadius}
              y2={cy + 10}
              stroke="var(--color-rind)"
              strokeWidth="2"
              strokeOpacity="0.22"
              initial={{ x: 0 }}
              animate={{ x: [0, outerRindRadius * 2, outerRindRadius * 2, 0] }}
              transition={{
                duration: 10,
                repeat: Infinity,
                ease: 'easeInOut',
                times: [0, 0.45, 0.9, 1]
              }}
            />
          </g>
        )}
      </svg>
    </motion.div>
  );
};

// Component name alias
export const InformationDarkSpot = HeroMelon;
