import React from 'react';
import { motion, useReducedMotion } from 'motion/react';

interface IconProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
  size?: number;
  animateCrack?: boolean;
}

// Gap = black seed metaphor
export const SeedIcon: React.FC<IconProps> = ({ className = "w-4 h-4", size, ...props }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    width={size}
    height={size}
    className={className}
    aria-hidden="true"
    {...props}
  >
    <path d="M12 2.5C12 2.5 6 10.5 6 15.5C6 18.8 8.7 21.5 12 21.5C15.3 21.5 18 18.8 18 15.5C18 10.5 12 2.5 12 2.5Z" />
  </svg>
);

// Conflict = crack / fracture metaphor with pathLength animation
export const CrackIcon: React.FC<IconProps> = ({ className = "w-4 h-4", size, animateCrack = false, ...props }) => {
  const shouldReduceMotion = useReducedMotion();

  if (!animateCrack || shouldReduceMotion) {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        width={size}
        height={size}
        className={className}
        aria-hidden="true"
        {...props}
      >
        <path d="M13 2L10 9L15 13L9 22L11 14L7 11L13 2Z" />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
      {...props}
    >
      <motion.path
        d="M13 2L10 9L15 13L9 22L11 14L7 11L13 2Z"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      />
    </svg>
  );
};

// Stale = wilted pale leaf/patch metaphor
export const WiltIcon: React.FC<IconProps> = ({ className = "w-4 h-4", size, ...props }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    width={size}
    height={size}
    className={className}
    aria-hidden="true"
    {...props}
  >
    <path d="M4 20C4 20 8 18 11 13C13.5 8.8 17 6 21 4C21 8 18.5 13.5 14 16C9 18.8 4 20 4 20Z" />
    <path d="M11 13L4 20" />
    <path d="M15 9C13 11 11.5 12 11.5 12" />
  </svg>
);

// Checklist = bowl of seeds metaphor
export const BowlIcon: React.FC<IconProps> = ({ className = "w-4 h-4", size, ...props }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    width={size}
    height={size}
    className={className}
    aria-hidden="true"
    {...props}
  >
    <path d="M3 10C3 15.5 7 20 12 20C17 20 21 15.5 21 10H3Z" />
    <path d="M8 8C8 6.5 9 5.5 10 5.5C11 5.5 11 7 11 8" />
    <path d="M13 8C13 6.5 14 5 15 5C16 5 16 6.5 16 8" />
  </svg>
);

// Verified / Sourced checkmark
export const VerifiedCheckIcon: React.FC<IconProps> = ({ className = "w-4 h-4", size, ...props }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    width={size}
    height={size}
    className={className}
    aria-hidden="true"
    {...props}
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
