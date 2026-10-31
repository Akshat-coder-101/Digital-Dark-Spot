import React from 'react';
import { cn } from '@/lib/utils';
import { SeedIcon, CrackIcon, WiltIcon, VerifiedCheckIcon } from './Icons';
import { Sparkles, HelpCircle } from 'lucide-react';

export type StatusType = 
  | 'sourced' 
  | 'ai_suggested' 
  | 'uncertain' 
  | 'found'
  | 'single_source'
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
      styles: 'bg-signal text-signal-ink border-signal/40 dark:bg-signal/20 dark:text-signal dark:border-signal/40'
    },
    ai_suggested: {
      label: 'AI-suggested',
      icon: <Sparkles className={size === 'sm' ? "w-3 h-3" : "w-3.5 h-3.5"} />,
      styles: 'bg-structure/10 text-structure-text border-structure-text/30 dark:bg-structure/20 dark:text-structure-text'
    },
    uncertain: {
      label: 'Uncertain',
      icon: <HelpCircle className={size === 'sm' ? "w-3 h-3" : "w-3.5 h-3.5"} />,
      styles: 'bg-stale/15 text-stale border-stale/30 dark:bg-stale/20 dark:text-stale'
    },
    found: {
      label: 'Found',
      icon: <VerifiedCheckIcon className={size === 'sm' ? "w-3 h-3" : "w-3.5 h-3.5"} />,
      styles: 'bg-signal text-signal-ink border-signal/40 dark:bg-signal/20 dark:text-signal dark:border-signal/40'
    },
    single_source: {
      label: 'Single source',
      icon: <HelpCircle className={size === 'sm' ? "w-3 h-3" : "w-3.5 h-3.5"} />,
      styles: 'bg-surface-2 text-text-muted border-border'
    },
    gap: {
      label: 'Gap',
      icon: <SeedIcon className={size === 'sm' ? "w-3 h-3" : "w-3.5 h-3.5"} />,
      styles: 'bg-gap/15 text-gap border-gap/30 dark:bg-gap/20 dark:text-gap'
    },
    conflict: {
      label: 'Conflict',
      icon: <CrackIcon className={size === 'sm' ? "w-3 h-3" : "w-3.5 h-3.5"} />,
      styles: 'bg-conflict text-text border-conflict/40 dark:bg-conflict/20 dark:text-conflict dark:border-conflict/40'
    },
    stale: {
      label: 'Stale',
      icon: <WiltIcon className={size === 'sm' ? "w-3 h-3" : "w-3.5 h-3.5"} />,
      styles: 'bg-stale/15 text-stale border-stale/30 dark:bg-stale/20 dark:text-stale'
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

