import React from 'react';
import { motion, AnimatePresence } from 'motion/react';

export interface EvidenceDrawerMotionProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  width?: string;
  className?: string;
}

export const EvidenceDrawerMotion: React.FC<EvidenceDrawerMotionProps> = ({
  open,
  onClose,
  children,
  width = "max-w-[460px]",
  className = "",
}) => {
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs"
          />

          {/* Paper slide-over panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 350, duration: 0.25 }}
            className={`fixed right-0 top-0 bottom-0 z-50 w-full ${width} bg-pith border-l border-seed/10 shadow-xl overflow-y-auto ${className}`}
          >
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
