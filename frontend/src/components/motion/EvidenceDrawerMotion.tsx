import React, { useEffect, useRef } from 'react';
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
  width = "max-w-[440px]",
  className = "",
}) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedElement = useRef<HTMLElement | null>(null);

  // Esc key and focus trap/restoration
  useEffect(() => {
    if (!open) return;

    previouslyFocusedElement.current = document.activeElement as HTMLElement;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    // Focus panel on open
    setTimeout(() => {
      panelRef.current?.focus();
    }, 50);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      previouslyFocusedElement.current?.focus?.();
    };
  }, [open, onClose]);

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
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs cursor-pointer"
            aria-hidden="true"
          />

          {/* Paper slide-over panel */}
          <motion.div
            ref={panelRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-label="Evidence drawer"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 350, duration: 0.25 }}
            className={`fixed right-0 top-0 bottom-0 z-50 w-full ${width} bg-pith border-l border-seed/10 shadow-xl overflow-y-auto outline-none ${className}`}
          >
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
