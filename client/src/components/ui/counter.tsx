import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { motion, useReducedMotion } from 'motion/react';

export interface CounterProps {
  value: number;
  label: string;
  icon: React.ReactNode;
  variant?: 'rind' | 'seed' | 'crack' | 'wilt';
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

  const variantStyles = {
    rind: "border-rind/30 hover:border-rind/60 bg-rind/5 text-rind",
    seed: "border-seed/20 hover:border-seed/50 bg-pith-card text-seed",
    crack: "border-crack/30 hover:border-crack/60 bg-crack-subtle/50 text-crack",
    wilt: "border-wilt/30 hover:border-wilt/60 bg-wilt-subtle/50 text-wilt"
  };

  const badgeStyles = {
    rind: "bg-rind/15 text-rind",
    seed: "bg-seed/10 text-seed",
    crack: "bg-crack/15 text-crack",
    wilt: "bg-wilt/20 text-wilt"
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
        onClick ? "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rind" : "cursor-default",
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
