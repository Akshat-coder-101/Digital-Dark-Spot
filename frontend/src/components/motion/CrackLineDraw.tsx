import React from 'react';
import { motion } from 'motion/react';

export interface CrackLineDrawProps {
  width?: number | string;
  height?: number;
  className?: string;
  strokeColor?: string;
  strokeWidth?: number;
  duration?: number;
}

export const CrackLineDraw: React.FC<CrackLineDrawProps> = ({
  width = 180,
  height = 36,
  className = "overflow-visible",
  strokeColor = "var(--conflict)",
  strokeWidth = 3,
  duration = 0.5,
}) => {
  return (
    <svg width={width} height={height} viewBox="0 0 180 36" className={className}>
      <motion.path
        d="M 5,18 L 35,4 L 65,30 L 95,8 L 125,26 L 155,6 L 175,18"
        fill="none"
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration, ease: 'easeInOut' }}
      />
    </svg>
  );
};

