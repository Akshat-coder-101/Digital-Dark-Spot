import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { motion, useReducedMotion } from 'motion/react';

export interface CounterProps {
  value: number;
  label: string;
  icon: React.ReactNode;
  variant?: 'signal' | 'conflict' | 'stale' | 'gap' | 'structure' | 'rind' | 'seed' | 'crack' | 'wilt';
  subtext?: string;
  className?: string;
  onClick?: () => void;
}

export const Counter: React.FC<CounterProps> = ({
  value,
  label,
  icon,
  variant = 'seed',
  subtext,
  className,
  onClick
}) => {
  const shouldReduceMotion = useReducedMotion();
  const [displayValue, setDisplayValue] = useState(shouldReduceMotion ? value : 0);

  useEffect(() => {
    if (shouldReduceMotion) {
      setDisplayValue(value);
      return;
    }

    let start = 0;
    const duration = 700; // ms
    const startTime = performance.now();

    const updateCounter = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic curve
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(start + (value - start) * eased);
      setDisplayValue(current);

      if (progress < 1) {
        requestAnimationFrame(updateCounter);
      }
    };

    requestAnimationFrame(updateCounter);
  }, [value, shouldReduceMotion]);

  const variantStyles: Record<string, string> = {
    signal: "border-signal/40 hover:border-signal/70 bg-signal/10 text-signal-ink dark:text-signal",
    structure: "border-structure/40 hover:border-structure/70 bg-structure/10 text-structure-text",
    conflict: "border-conflict/40 hover:border-conflict/70 bg-conflict/10 text-conflict",
    stale: "border-stale/40 hover:border-stale/70 bg-stale/10 text-stale",
    gap: "border-gap/40 hover:border-gap/70 bg-gap/10 text-gap",
    rind: "border-signal/40 hover:border-signal/70 bg-signal/10 text-signal-ink dark:text-signal",
    seed: "border-border hover:border-border/80 bg-surface text-text",
    crack: "border-conflict/40 hover:border-conflict/70 bg-conflict/10 text-conflict",
    wilt: "border-stale/40 hover:border-stale/70 bg-stale/10 text-stale"
  };

  const badgeStyles: Record<string, string> = {
    signal: "bg-signal text-signal-ink dark:bg-signal/20 dark:text-signal",
    structure: "bg-structure/20 text-structure-text",
    conflict: "bg-conflict/20 text-conflict",
    stale: "bg-stale/20 text-stale",
    gap: "bg-gap/20 text-gap",
    rind: "bg-signal text-signal-ink dark:bg-signal/20 dark:text-signal",
    seed: "bg-surface-2 text-text",
    crack: "bg-conflict/20 text-conflict",
    wilt: "bg-stale/20 text-stale"
  };

  return (
    <motion.button
      type="button"
      whileHover={{ y: -2, transition: { duration: 0.15 } }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      disabled={!onClick}
      className={cn(
        "flex flex-col p-4 rounded-2xl border text-left transition-colors duration-200",
        onClick ? "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-structure-text" : "cursor-default",
        variantStyles[variant],
        className
      )}
    >
      <div className="flex items-center justify-between w-full mb-2">
        <span className="text-xs font-medium uppercase tracking-wider text-seed-muted">
          {label}
        </span>
        <div className={cn("p-1.5 rounded-lg", badgeStyles[variant])}>
          {icon}
        </div>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="font-heading text-3xl font-extrabold text-seed">
          {displayValue}
        </span>
        {subtext && (
          <span className="text-xs text-seed-muted">
            {subtext}
          </span>
        )}
      </div>
    </motion.button>
  );
};
