import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { SeedIcon, VerifiedCheckIcon } from '@/components/common/Icons';

export interface SeedCheckMorphProps {
  checked: boolean;
  onToggle?: () => void;
  className?: string;
}

export const SeedCheckMorph: React.FC<SeedCheckMorphProps> = ({
  checked,
  onToggle,
  className = "cursor-pointer p-1 rounded-md",
}) => {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`inline-flex items-center justify-center transition-colors ${className}`}
      aria-checked={checked}
      role="checkbox"
    >
      <AnimatePresence mode="wait" initial={false}>
        {checked ? (
          <motion.div
            key="checked"
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{ scale: [0.4, 1.15, 1], opacity: 1 }}
            exit={{ scale: 0.4, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="w-5 h-5 rounded-md bg-rind text-white flex items-center justify-center shadow-xs"
          >
            <VerifiedCheckIcon className="w-3.5 h-3.5 fill-current" />
          </motion.div>
        ) : (
          <motion.div
            key="unchecked"
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.4, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="w-5 h-5 rounded-md border border-seed/20 bg-pith-card text-seed flex items-center justify-center hover:border-seed/40"
          >
            <SeedIcon className="w-2.5 h-2.5 fill-current opacity-70" />
          </motion.div>
        )}
      </AnimatePresence>
    </button>
  );
};
