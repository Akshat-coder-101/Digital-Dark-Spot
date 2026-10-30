import React, { useRef, useEffect, useState } from 'react';
import { useReducedMotion } from 'motion/react';
import { SeedIcon } from '@/components/common/Icons';

export const RedactedDocumentBackground: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const [isTouchOrCoarse, setIsTouchOrCoarse] = useState(false);

  useEffect(() => {
    // Detect touch / coarse pointer devices
    const mq = window.matchMedia('(hover: none), (pointer: coarse)');
    setIsTouchOrCoarse(mq.matches);

    const handler = (e: MediaQueryListEvent) => setIsTouchOrCoarse(e.matches);
    mq.addEventListener?.('change', handler);
    return () => mq.removeEventListener?.('change', handler);
  }, []);

  useEffect(() => {
    if (shouldReduceMotion || isTouchOrCoarse) return;

    let rafId: number | null = null;
    const container = containerRef.current;
    if (!container) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (rafId) return;

      rafId = requestAnimationFrame(() => {
        const rect = container.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        container.style.setProperty('--mouse-x', `${x}px`);
        container.style.setProperty('--mouse-y', `${y}px`);
        rafId = null;
      });
    };

    const handleMouseLeave = () => {
      container.style.setProperty('--mouse-x', `-999px`);
      container.style.setProperty('--mouse-y', `-999px`);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [shouldReduceMotion, isTouchOrCoarse]);

  // Redacted text lines with deliberate gaps
  const rows = [
    { bars: ['w-24', 'w-48', 'w-32', 'gap-seed-1', 'w-40', 'w-20'] },
    { bars: ['w-36', 'w-16', 'w-64', 'w-28', 'w-44'] },
    { bars: ['w-52', 'gap-seed-2', 'w-36', 'w-48', 'w-24'] },
    { bars: ['w-20', 'w-60', 'w-32', 'w-40', 'gap-seed-3', 'w-16'] },
    { bars: ['w-44', 'w-28', 'w-52', 'w-36', 'w-20'] },
    { bars: ['w-32', 'w-48', 'gap-seed-4', 'w-64', 'w-24'] },
    { bars: ['w-60', 'w-20', 'w-36', 'w-48', 'w-32'] },
    { bars: ['w-28', 'gap-seed-5', 'w-44', 'w-20', 'w-56', 'w-16'] },
  ];

  const renderLines = (interactive = false) => (
    <div className="space-y-4 py-3 select-none">
      {rows.map((row, rIdx) => (
        <div key={rIdx} className="flex items-center gap-2.5 overflow-hidden">
          {row.bars.map((b, bIdx) => {
            if (b.startsWith('gap-seed')) {
              return (
                <div
                  key={bIdx}
                  className={`w-7 h-5 flex items-center justify-center shrink-0 transition-opacity duration-200 ${
                    interactive
                      ? 'opacity-100 text-seed'
                      : shouldReduceMotion || isTouchOrCoarse
                      ? 'opacity-25 text-seed'
                      : 'opacity-0'
                  }`}
                  aria-hidden="true"
                >
                  <SeedIcon className="w-2.5 h-2.5 fill-current" />
                </div>
              );
            }

            return (
              <div
                key={bIdx}
                className={`h-2 rounded-xs shrink-0 ${b} ${
                  interactive
                    ? 'bg-seed/15 dark:bg-seed/20'
                    : 'bg-seed/[0.035] dark:bg-seed/[0.045]'
                }`}
              />
            );
          })}
        </div>
      ))}
    </div>
  );

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 pointer-events-none overflow-hidden z-0"
      style={{
        '--mouse-x': '-999px',
        '--mouse-y': '-999px',
      } as React.CSSProperties}
      aria-hidden="true"
    >
      {/* Soft atmospheric radial depth gradient behind hero */}
      <div className="absolute top-1/6 right-1/4 w-[540px] h-[360px] rounded-full bg-rind/[0.035] dark:bg-rind/[0.05] blur-3xl pointer-events-none" />

      {/* Base Redacted Document layer: very low opacity text bars */}
      <div className="absolute inset-0 opacity-80">
        {renderLines(false)}
      </div>

      {/* Dynamic Cursor Spotlight Layer (Only enabled on non-touch, non-reduced-motion) */}
      {!shouldReduceMotion && !isTouchOrCoarse && (
        <div
          className="absolute inset-0 transition-opacity duration-300"
          style={{
            maskImage: 'radial-gradient(circle 200px at var(--mouse-x) var(--mouse-y), black 20%, transparent 100%)',
            WebkitMaskImage: 'radial-gradient(circle 200px at var(--mouse-x) var(--mouse-y), black 20%, transparent 100%)',
          }}
        >
          {renderLines(true)}
        </div>
      )}
    </div>
  );
};

