import React from 'react';
import { motion } from 'motion/react';
import { SeedIcon } from '@/components/common/Icons';

export interface SeedPopInProps {
  count?: number;
  className?: string;
  seedClassName?: string;
  stagger?: number;
}

export const SeedPopIn: React.FC<SeedPopInProps> = ({
  count = 7,
  className = "flex items-center gap-2",
  seedClassName = "p-1.5 rounded-lg bg-seed text-pith",
  stagger = 0.04,
}) => {
  return (
    <div className={className}>
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: [0, 1.25, 1], opacity: 1 }}
          transition={{
            type: 'spring',
            stiffness: 400,
            damping: 18,
            delay: i * stagger,
          }}
          whileHover={{ scale: 1.25 }}
          className={seedClassName}
        >
          <SeedIcon className="w-3.5 h-3.5 fill-current" />
        </motion.div>
      ))}
    </div>
  );
};

