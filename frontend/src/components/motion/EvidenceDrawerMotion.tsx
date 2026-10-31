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
  width = "max-w-110",
  className = "",
}) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedElement = useRef<HTMLElement | null>(null);

  // Esc key and focus trap/restoration
  useEffect(() => {
    if (!open) return;

    const opener = document.activeElement as HTMLElement;
    if (opener && opener !== document.body) {
      previouslyFocusedElement.current = opener;
    }

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
      setTimeout(() => {
        try {
          const lastCellId = sessionStorage.getItem('dds-last-focused-cell');
          if (lastCellId) {
            const el = document.getElementById(lastCellId);
            if (el) {
              el.focus();
              return;
            }
          }
        } catch {}

        if (previouslyFocusedElement.current && document.contains(previouslyFocusedElement.current)) {
          previouslyFocusedElement.current.focus();
        } else {
          const fallback = document.querySelector('td[tabindex="0"]') as HTMLElement;
          fallback?.focus?.();
        }
      }, 100);
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
            className={`fixed right-0 top-0 bottom-0 z-50 w-full max-w-full ${width} bg-surface border-l border-border shadow-xl overflow-y-auto outline-none ${className}`}
          >
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
