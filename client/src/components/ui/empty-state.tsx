import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from './button';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className
}) => {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-8 text-center rounded-2xl border border-dashed border-border bg-pith-card/40 my-4",
        className
      )}
    >
      {icon && (
        <div className="p-3 mb-3 rounded-2xl bg-pith-muted/60 text-seed-muted">
          {icon}
        </div>
      )}
      <h4 className="font-heading text-lg font-bold text-seed mb-1">
        {title}
      </h4>
      <p className="text-sm text-seed-muted max-w-sm mb-4 leading-relaxed">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button variant="outline" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
