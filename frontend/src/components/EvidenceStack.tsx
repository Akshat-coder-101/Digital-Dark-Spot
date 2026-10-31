import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { cn } from '@/lib/utils';

interface EvidenceStackProps {
  className?: string;
}

export const EvidenceStack: React.FC<EvidenceStackProps> = ({ className }) => {
  const shouldReduceMotion = useReducedMotion();

  // 9 text-line bar widths for each paper sheet
  const sheet1Lines = [160, 200, 135, 175, 125, 190, 150, 180, 140];
  const sheet2Lines = [175, 140, 205, 165, 150, 185, 155, 170, 130];
  const sheet3Lines = [170, 195, 95, 180, 150, 160, 200, 145, 155]; // Row index 2 (line 3) has gap

  return (
    <div
      className={cn(
        "relative w-full max-w-[520px] aspect-[520/380] select-none flex items-center justify-center",
        className
      )}
      role="img"
      aria-label="Evidence Stack: three overlapping documents comparing sources for potential gaps, conflicts, and earlier cycle staleness"
    >
      <svg
        viewBox="0 0 530 380"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full overflow-visible"
      >
        <defs>
          {/* Pale hatched pattern for earlier cycle corner */}
          <pattern
            id="earlier-cycle-hatch-pattern"
            width="6"
            height="6"
            patternTransform="rotate(45 0 0)"
            patternUnits="userSpaceOnUse"
          >
            <rect width="6" height="6" fill="var(--color-wilt)" fillOpacity="0.25" />
            <line
              x1="0"
              y1="0"
              x2="0"
              y2="6"
              stroke="var(--color-wilt)"
              strokeWidth="1.5"
              strokeOpacity="0.85"
            />
          </pattern>

          {/* Paper Drop Shadows */}
          <filter id="evidence-shadow-base" x="-20%" y="-20%" width="140%" height="145%" filterUnits="userSpaceOnUse">
            <feDropShadow dx="0" dy="6" stdDeviation="10" floodColor="currentColor" floodOpacity="0.12" />
          </filter>

          <filter id="evidence-shadow-top" x="-20%" y="-20%" width="140%" height="145%" filterUnits="userSpaceOnUse">
            <feDropShadow dx="0" dy="10" stdDeviation="16" floodColor="currentColor" floodOpacity="0.18" />
          </filter>
        </defs>

        {/* ============================================================ */}
        {/* SHEET 1 (Back / Left): Rotated -4 deg, "Forum post"           */}
        {/* ============================================================ */}
        <g transform="rotate(-4 150 190) translate(25, 65)">
          <motion.g
            initial={shouldReduceMotion ? { opacity: 1, x: 0 } : { opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: shouldReduceMotion ? 0 : 0.0, ease: 'easeOut' }}
          >
            {/* Paper Sheet Body */}
            <rect
              x="0"
              y="0"
              width="240"
              height="240"
              rx="6"
              fill="var(--color-pith-card)"
              stroke="var(--color-seed)"
              strokeOpacity="0.14"
              strokeWidth="1.2"
              filter="url(#evidence-shadow-base)"
            />

            {/* Header: Generic Label "Forum post" */}
            <g transform="translate(18, 26)">
              <rect x="0" y="-1" width="12" height="12" rx="2" fill="var(--color-seed)" fillOpacity="0.08" />
              <path
                d="M 3,4.5 L 9,4.5 M 3,7.5 L 9,7.5 M 3,10.5 L 6,10.5"
                stroke="var(--color-seed-muted)"
                strokeWidth="1.2"
                strokeLinecap="round"
              />
              <text
                x="18"
                y="9"
                fill="var(--color-seed)"
                className="font-sans text-[11px] font-bold tracking-tight"
              >
                Forum post
              </text>
              <text
                x="195"
                y="9"
                fill="var(--color-seed-muted)"
                className="font-mono text-[9px]"
                textAnchor="end"
              >
                Source 03
              </text>
              <line x1="0" y1="18" x2="204" y2="18" stroke="var(--color-seed)" strokeOpacity="0.1" strokeWidth="1" />
            </g>

            {/* 9 Text-line Bars with Row-by-Row Read Highlight */}
            <g transform="translate(18, 56)">
              {sheet1Lines.map((width, idx) => (
                <g key={`s1-l-${idx}`} transform={`translate(0, ${idx * 17})`}>
                  <rect
                    x="0"
                    y="0"
                    width={width}
                    height="5.5"
                    rx="2.75"
                    fill="var(--color-seed)"
                    fillOpacity="0.1"
                  />
                  {!shouldReduceMotion && (
                    <motion.rect
                      x="0"
                      y="0"
                      width={width}
                      height="5.5"
                      rx="2.75"
                      fill="var(--color-rind)"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: [0, 0.45, 0] }}
                      transition={{ duration: 0.35, delay: 0.65 + idx * 0.04 }}
                    />
                  )}
                </g>
              ))}
            </g>

            {/* Step 5: Pale hatched top-left corner with "Earlier cycle" tag */}
            <motion.g
              initial={shouldReduceMotion ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.35, delay: shouldReduceMotion ? 0 : 2.5, ease: 'easeOut' }}
            >
              {/* Hatched Corner */}
              <path
                d="M 0,0 L 48,0 L 0,48 Z"
                fill="url(#earlier-cycle-hatch-pattern)"
                stroke="var(--color-seed)"
                strokeOpacity="0.2"
                strokeWidth="1"
              />
              <path
                d="M 48,0 L 0,48"
                stroke="var(--color-wilt)"
                strokeWidth="1.5"
              />

              {/* "Earlier cycle" Tag Pill (Sentence Case, Text + Clock Icon shape) */}
              <g transform="translate(10, -14)">
                <rect
                  x="0"
                  y="0"
                  width="92"
                  height="20"
                  rx="3"
                  fill="var(--color-pith-card)"
                  stroke="var(--color-wilt)"
                  strokeWidth="1.3"
                />
                {/* Clock Icon */}
                <circle cx="10" cy="10" r="4.2" stroke="var(--color-wilt)" strokeWidth="1.2" fill="none" />
                <path d="M 10,8 L 10,10 L 12,10" stroke="var(--color-wilt)" strokeWidth="1.2" strokeLinecap="round" />
                <text
                  x="20"
                  y="13.5"
                  fill="var(--color-seed)"
                  className="font-sans text-[10px] font-bold tracking-tight"
                >
                  Earlier cycle
                </text>
              </g>
            </motion.g>
          </motion.g>
        </g>

        {/* ============================================================ */}
        {/* SHEET 2 (Middle / Right): Rotated +3 deg, "Blog post"         */}
        {/* ============================================================ */}
        <g transform="rotate(3 380 195) translate(265, 70)">
          <motion.g
            initial={shouldReduceMotion ? { opacity: 1, x: 0 } : { opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: shouldReduceMotion ? 0 : 0.12, ease: 'easeOut' }}
          >
            {/* Paper Sheet Body */}
            <rect
              x="0"
              y="0"
              width="240"
              height="240"
              rx="6"
              fill="var(--color-pith-card)"
              stroke="var(--color-seed)"
              strokeOpacity="0.14"
              strokeWidth="1.2"
              filter="url(#evidence-shadow-base)"
            />

            {/* Header: Generic Label "Blog post" */}
            <g transform="translate(18, 26)">
              <rect x="0" y="-1" width="12" height="12" rx="2" fill="var(--color-seed)" fillOpacity="0.08" />
              <path
                d="M 3,4.5 L 9,4.5 M 3,7.5 L 9,7.5 M 3,10.5 L 6,10.5"
                stroke="var(--color-seed-muted)"
                strokeWidth="1.2"
                strokeLinecap="round"
              />
              <text
                x="18"
                y="9"
                fill="var(--color-seed)"
                className="font-sans text-[11px] font-bold tracking-tight"
              >
                Blog post
              </text>
              <text
                x="195"
                y="9"
                fill="var(--color-seed-muted)"
                className="font-mono text-[9px]"
                textAnchor="end"
              >
                Source 02
              </text>
              <line x1="0" y1="18" x2="204" y2="18" stroke="var(--color-seed)" strokeOpacity="0.1" strokeWidth="1" />
            </g>

            {/* 9 Text-line Bars */}
            <g transform="translate(18, 56)">
              {sheet2Lines.map((width, idx) => {
                const isConflictLine = idx === 4; // Row 5 has the conflict
                return (
                  <g key={`s2-l-${idx}`} transform={`translate(0, ${idx * 17})`}>
                    <rect
                      x="0"
                      y="0"
                      width={width}
                      height="5.5"
                      rx="2.75"
                      fill={isConflictLine ? "var(--color-crack)" : "var(--color-seed)"}
                      fillOpacity={isConflictLine ? 0.85 : 0.1}
                    />
                    {!shouldReduceMotion && (
                      <motion.rect
                        x="0"
                        y="0"
                        width={width}
                        height="5.5"
                        rx="2.75"
                        fill="var(--color-rind)"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: [0, 0.45, 0] }}
                        transition={{ duration: 0.35, delay: 0.65 + idx * 0.04 }}
                      />
                    )}
                  </g>
                );
              })}
            </g>
          </motion.g>
        </g>

        {/* ============================================================ */}
        {/* SHEET 3 (Top / Center): Rotated 0 deg, "Official notice"      */}
        {/* ============================================================ */}
        <g transform="translate(135, 50)">
          <motion.g
            initial={shouldReduceMotion ? { opacity: 1, x: 0 } : { opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            whileHover={shouldReduceMotion ? {} : { y: -4 }}
            transition={{ duration: 0.4, delay: shouldReduceMotion ? 0 : 0.24, ease: 'easeOut' }}
            className="cursor-pointer"
          >
            {/* Paper Sheet Body */}
            <rect
              x="0"
              y="0"
              width="255"
              height="255"
              rx="6"
              fill="var(--color-pith-card)"
              stroke="var(--color-seed)"
              strokeOpacity="0.2"
              strokeWidth="1.3"
              filter="url(#evidence-shadow-top)"
            />

            {/* Header: Generic Label "Official notice" */}
            <g transform="translate(20, 26)">
              <rect x="0" y="-1" width="13" height="13" rx="2" fill="var(--color-rind)" fillOpacity="0.14" />
              <path
                d="M 3,6 L 6,9 L 10,4"
                stroke="var(--color-rind)"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <text
                x="20"
                y="9.5"
                fill="var(--color-seed)"
                className="font-sans text-xs font-bold tracking-tight"
              >
                Official notice
              </text>
              <text
                x="205"
                y="9.5"
                fill="var(--color-rind)"
                className="font-mono text-[9px] font-bold"
                textAnchor="end"
              >
                Primary
              </text>
              <line x1="0" y1="18" x2="215" y2="18" stroke="var(--color-seed)" strokeOpacity="0.1" strokeWidth="1" />
            </g>

            {/* 9 Text-line Bars */}
            <g transform="translate(20, 56)">
              {sheet3Lines.map((width, idx) => {
                const isGapLine = idx === 2; // Row 3 has the gap
                const isConflictLine = idx === 4; // Row 5 has the conflict

                return (
                  <g key={`s3-l-${idx}`} transform={`translate(0, ${idx * 17})`}>
                    {/* Base Line */}
                    <rect
                      x="0"
                      y="0"
                      width={width}
                      height="5.5"
                      rx="2.75"
                      fill={isConflictLine ? "var(--color-crack)" : "var(--color-seed)"}
                      fillOpacity={isConflictLine ? 0.85 : 0.1}
                    />

                    {/* Reading Highlight Sweep */}
                    {!shouldReduceMotion && (
                      <motion.rect
                        x="0"
                        y="0"
                        width={width}
                        height="5.5"
                        rx="2.75"
                        fill="var(--color-rind)"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: [0, 0.45, 0] }}
                        transition={{ duration: 0.35, delay: 0.65 + idx * 0.04 }}
                      />
                    )}

                    {/* Step 3: Seed (dark ellipse) pops into the gap in Row 3 with light spring */}
                    {isGapLine && (
                      <g transform="translate(112, 2.75)">
                        {/* Missing parameter slot placeholder */}
                        <rect
                          x="-8"
                          y="-5.5"
                          width="72"
                          height="11"
                          rx="3"
                          fill="none"
                          stroke="var(--color-seed)"
                          strokeOpacity="0.25"
                          strokeDasharray="2 2"
                        />

                        {/* Dark Seed Mark */}
                        <motion.ellipse
                          cx="0"
                          cy="0"
                          rx="4.5"
                          ry="6"
                          fill="var(--color-seed)"
                          initial={shouldReduceMotion ? { scale: 1, opacity: 1 } : { scale: 0.5, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={
                            shouldReduceMotion
                              ? { duration: 0 }
                              : {
                                  type: 'spring',
                                  stiffness: 350,
                                  damping: 18,
                                  delay: 1.4,
                                }
                          }
                        />

                        {/* "Potential gap" Tag Pill (Sentence case, text + diamond icon shape) */}
                        <g transform="translate(14, -20)">
                          <motion.g
                            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.3, delay: shouldReduceMotion ? 0 : 1.55 }}
                          >
                            <rect
                              x="0"
                              y="0"
                              width="95"
                              height="20"
                              rx="3"
                              fill="var(--color-pith-card)"
                              stroke="var(--color-seed)"
                              strokeOpacity="0.35"
                              strokeWidth="1.2"
                            />
                            {/* Seed diamond icon shape */}
                            <path
                              d="M 9,10 L 12,6 L 15,10 L 12,14 Z"
                              fill="var(--color-seed)"
                            />
                            <text
                              x="21"
                              y="13.5"
                              fill="var(--color-seed)"
                              className="font-sans text-[10px] font-bold tracking-tight"
                            >
                              Potential gap
                            </text>
                          </motion.g>
                        </g>
                      </g>
                    )}
                  </g>
                );
              })}
            </g>
          </motion.g>
        </g>

        {/* ============================================================ */}
        {/* Step 4: Thin Zigzag Connector & "Possible conflict" Tag       */}
        {/* Draws between Sheet 3 Row 5 and Sheet 2 Row 5 (pathLength)   */}
        {/* ============================================================ */}
        <g>
          {/* Zigzag Connector Path */}
          <motion.path
            d="M 295 174 L 320 166 L 334 186 L 348 170 L 364 186 L 385 178"
            fill="none"
            stroke="var(--color-crack)"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={shouldReduceMotion ? { pathLength: 1, opacity: 1 } : { pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: shouldReduceMotion ? 0 : 1.9, ease: 'easeInOut' }}
          />

          {/* Connection Endpoints */}
          <motion.circle
            cx="295"
            cy="174"
            r="3.5"
            fill="var(--color-crack)"
            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: shouldReduceMotion ? 0 : 1.9 }}
          />
          <motion.circle
            cx="385"
            cy="178"
            r="3.5"
            fill="var(--color-crack)"
            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: shouldReduceMotion ? 0 : 2.4 }}
          />

          {/* "Possible conflict" Tag Pill (Sentence case, lightning icon shape) */}
          <g transform="translate(305, 196)">
            <motion.g
              initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: shouldReduceMotion ? 0 : 2.15 }}
            >
              <rect
                x="0"
                y="0"
                width="108"
                height="20"
                rx="3"
                fill="var(--color-pith-card)"
                stroke="var(--color-crack)"
                strokeWidth="1.3"
              />
              {/* Lightning / Crack icon shape */}
              <path
                d="M 9,4.5 L 6,10.5 L 10,10.5 L 8,15.5 L 13.5,9 L 9.5,9 Z"
                fill="var(--color-crack)"
              />
              <text
                x="17"
                y="13.5"
                fill="var(--color-seed)"
                className="font-sans text-[10px] font-bold tracking-tight"
              >
                Possible conflict
              </text>
            </motion.g>
          </g>
        </g>
      </svg>
    </div>
  );
};
