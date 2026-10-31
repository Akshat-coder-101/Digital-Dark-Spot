import React from 'react';
import { Link } from 'react-router-dom';
import { SeedIcon, CrackIcon } from '@/components/common/Icons';
import { ArrowLeft } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';

export const NotFound: React.FC = () => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center">
      <div className="radial-structure-glow p-8 sm:p-12 rounded-2xl max-w-md w-full flex flex-col items-center space-y-6">
        {/* Seed + Crack Mark */}
        <div className="relative w-16 h-16 rounded-xl bg-surface border border-border flex items-center justify-center shadow-xs">
          <SeedIcon className="w-8 h-8 fill-structure-text text-structure-text" />
          <motion.div
            initial={shouldReduceMotion ? { scale: 1 } : { scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-surface border border-conflict/40 flex items-center justify-center text-conflict shadow-xs"
          >
            <CrackIcon className="w-3.5 h-3.5" />
          </motion.div>
        </div>

        {/* Branded Title and Copy */}
        <div className="space-y-2">
          <span className="text-xs font-mono font-semibold uppercase tracking-wider text-conflict">
            404 — Void Detected
          </span>
          <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-text tracking-tight">
            This slice doesn't exist.
          </h1>
          <p className="text-xs sm:text-sm text-text-muted leading-relaxed max-w-sm">
            The investigation report, source parameter, or page address you requested could not be located in this session.
          </p>
        </div>

        {/* Back to Investigation CTA */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-md bg-signal text-signal-ink font-heading font-semibold text-xs sm:text-sm tracking-wide shadow-xs hover:bg-signal/90 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-structure-text"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to investigation</span>
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
