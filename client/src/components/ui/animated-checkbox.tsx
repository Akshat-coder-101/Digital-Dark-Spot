import React from 'react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { Check } from 'lucide-react';
import { SeedIcon } from '../common/Icons';

interface AnimatedCheckboxProps {
  id?: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  label?: React.ReactNode;
  className?: string;
}

export const AnimatedCheckbox: React.FC<AnimatedCheckboxProps> = ({
  id,
  checked,
  onCheckedChange,
  disabled = false,
  label,
  className
}) => {
  return (
    <label
      htmlFor={id}
      className={cn(
        "inline-flex items-start gap-3 select-none cursor-pointer group",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
    >
      <div className="relative pt-0.5 shrink-0">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onCheckedChange(e.target.checked)}
          className="sr-only"
        />
        <motion.div
          className={cn(
            "w-5 h-5 rounded-md flex items-center justify-center border transition-colors",
            "focus-within:ring-2 focus-within:ring-rind focus-within:ring-offset-2",
            checked
              ? "bg-rind border-rind text-white"
              : "bg-pith-card border-border group-hover:border-seed/40 text-seed"
          )}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          transition={{ duration: 0.15 }}
        >
          <AnimatePresence mode="wait" initial={false}>
            {checked ? (
              <motion.div
                key="check"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </motion.div>
            ) : (
              <motion.div
                key="seed"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 0.6 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <SeedIcon className="w-2.5 h-2.5 fill-current" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {label && (
        <span
          className={cn(
            "text-sm leading-relaxed transition-all",
            checked ? "line-through text-seed-muted" : "text-seed"
          )}
        >
          {label}
        </span>
      )}
    </label>
  );
};
