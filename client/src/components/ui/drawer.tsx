import React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface DrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
}

export const Drawer: React.FC<DrawerProps> = ({
  open,
  onOpenChange,
  title,
  description,
  children
}) => {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <DialogPrimitive.Portal forceMount>
            {/* Backdrop */}
            <DialogPrimitive.Overlay asChild>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 z-50 bg-seed/40 backdrop-blur-xs"
              />
            </DialogPrimitive.Overlay>

            {/* Slide-over panel */}
            <DialogPrimitive.Content asChild>
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                className={cn(
                  "fixed right-0 top-0 bottom-0 z-50 w-full max-w-lg",
                  "bg-pith-card border-l border-border shadow-2xl p-6 overflow-y-auto flex flex-col",
                  "focus:outline-none"
                )}
              >
                <div className="flex items-center justify-between pb-4 border-b border-border">
                  <div>
                    <DialogPrimitive.Title className="font-heading text-xl font-bold text-seed">
                      {title}
                    </DialogPrimitive.Title>
                    {description && (
                      <DialogPrimitive.Description className="text-xs text-seed-muted mt-0.5">
                        {description}
                      </DialogPrimitive.Description>
                    )}
                  </div>
                  <DialogPrimitive.Close asChild>
                    <button
                      type="button"
                      className="p-1.5 rounded-lg text-seed-muted hover:text-seed hover:bg-pith-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rind cursor-pointer"
                      aria-label="Close drawer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </DialogPrimitive.Close>
                </div>

                <div className="flex-1 py-4">
                  {children}
                </div>
              </motion.div>
            </DialogPrimitive.Content>
          </DialogPrimitive.Portal>
        )}
      </AnimatePresence>
    </DialogPrimitive.Root>
  );
};

