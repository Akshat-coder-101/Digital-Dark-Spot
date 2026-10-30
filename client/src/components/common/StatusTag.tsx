import React from 'react';
import { cn } from '@/lib/utils';
import { SeedIcon, CrackIcon, WiltIcon, VerifiedCheckIcon } from './Icons';
import { Sparkles, HelpCircle } from 'lucide-react';

export type StatusType = 
  | 'sourced' 
  | 'ai_suggested' 
  | 'uncertain' 
  | 'gap' 
  | 'conflict' 
  | 'stale';

interface StatusTagProps {
  status: StatusType;
  customLabel?: string;
  className?: string;
  size?: 'sm' | 'md';
}

export const StatusTag: React.FC<StatusTagProps> = ({
  status,
  customLabel,
  className,
  size = 'md'
}) => {
  const configs: Record<StatusType, { label: string; icon: React.ReactNode; styles: string }> = {
    sourced: {
      label: 'Sourced',
      icon: <VerifiedCheckIcon className={size === 'sm' ? "w-3 h-3" : "w-3.5 h-3.5"} />,
      styles: 'bg-rind/15 text-rind border-rind/30 dark:bg-rind/20 dark:text-rind'
    },
    ai_suggested: {
      label: 'AI-suggested',
      icon: <Sparkles className={size === 'sm' ? "w-3 h-3" : "w-3.5 h-3.5"} />,
      styles: 'bg-pith-muted text-seed-muted border-border dark:text-seed-muted'
    },
    uncertain: {
      label: 'Uncertain',
      icon: <HelpCircle className={size === 'sm' ? "w-3 h-3" : "w-3.5 h-3.5"} />,
      styles: 'bg-wilt-subtle text-wilt border-wilt/40 dark:bg-wilt/20 dark:text-wilt'
    },
    gap: {
      label: 'Potential gap',
      icon: <SeedIcon className={size === 'sm' ? "w-3 h-3" : "w-3.5 h-3.5"} />,
      styles: 'bg-seed text-pith border-seed dark:bg-seed-muted dark:text-pith'
    },
    conflict: {
      label: 'Possible conflict',
      icon: <CrackIcon className={size === 'sm' ? "w-3 h-3" : "w-3.5 h-3.5"} />,
      styles: 'bg-crack-subtle text-crack border-crack/40 dark:bg-crack/20 dark:text-crack'
    },
    stale: {
      label: 'Potentially stale',
      icon: <WiltIcon className={size === 'sm' ? "w-3 h-3" : "w-3.5 h-3.5"} />,
      styles: 'bg-wilt-subtle text-wilt border-wilt/30 dark:bg-wilt/20 dark:text-wilt'
    }
  };

  const config = configs[status];
  const displayText = customLabel || config.label;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 font-medium rounded-md border font-body transition-colors",
        size === 'sm' ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-xs",
        config.styles,
        className
      )}
      role="status"
    >
      <span className="shrink-0" aria-hidden="true">
        {config.icon}
      </span>
      <span>{displayText}</span>
    </span>
  );
};

