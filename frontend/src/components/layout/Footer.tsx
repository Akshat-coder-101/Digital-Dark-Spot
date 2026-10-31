import React from 'react';
import { motion, useReducedMotion } from 'motion/react';

export const Footer: React.FC = () => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.footer
      initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="w-full border-t border-seed/10 bg-pith py-10 sm:py-12 px-4 sm:px-6 transition-colors mt-auto"
    >
      <div className="max-w-275 mx-auto flex flex-col md:flex-row items-center justify-between gap-5 text-center md:text-left">
        <div className="flex flex-col gap-1.5">
          <p className="text-xs font-sans font-semibold text-flesh flex items-center justify-center md:justify-start gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-flesh animate-pulse" />
            Potential signals, not verified facts.
          </p>
          <p className="text-xs text-seed-muted max-w-md leading-relaxed">
            Highlights information gaps and possible contradictions to guide human verification. Always inspect primary sources before taking decisions.
          </p>
        </div>

        <div className="flex flex-col md:items-end gap-1 text-xs text-seed-muted">
          <p className="font-heading font-semibold text-seed text-sm">
            Digital Dark Spot
          </p>
          <p className="text-[11px] font-mono text-seed-muted">
            Shinchan Online Hackathon 2026
          </p>
        </div>
      </div>
    </motion.footer>
  );
};
