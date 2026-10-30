import React from 'react';
import { cn } from '@/lib/utils';
import { Check, Loader2 } from 'lucide-react';

export interface StepItem {
  id: string;
  label: string;
  description?: string;
}

interface StepperProps {
  steps: StepItem[];
  activeStepIndex: number;
  className?: string;
}

export const Stepper: React.FC<StepperProps> = ({
  steps,
  activeStepIndex,
  className
}) => {
  return (
    <div className={cn("w-full py-4", className)}>
      <ol className="flex flex-col md:flex-row items-start md:items-center justify-between w-full gap-4 md:gap-2">
        {steps.map((step, idx) => {
          const isCompleted = idx < activeStepIndex;
          const isCurrent = idx === activeStepIndex;
          const isPending = idx > activeStepIndex;

          return (
            <li
              key={step.id}
              className="flex items-center gap-3 md:flex-col md:text-center flex-1 relative"
            >
              {/* Connector line for desktop */}
              {idx < steps.length - 1 && (
                <div
                  className={cn(
                    "hidden md:block absolute top-4 left-1/2 w-full h-0.5 -z-0 transition-colors duration-300",
                    idx < activeStepIndex ? "bg-rind" : "bg-border"
                  )}
                />
              )}

              {/* Step indicator circle */}
              <div
                className={cn(
                  "relative z-10 flex items-center justify-center w-8 h-8 rounded-full border-2 font-semibold text-xs transition-all duration-300 shrink-0",
                  isCompleted && "bg-rind border-rind text-white",
                  isCurrent && "bg-pith-card border-rind text-rind shadow-sm ring-4 ring-rind/20",
                  isPending && "bg-pith-card border-border text-seed-muted"
                )}
              >
                {isCompleted ? (
                  <Check className="w-4 h-4" />
                ) : isCurrent ? (
                  <Loader2 className="w-4 h-4 animate-spin text-rind" />
                ) : (
                  <span>{idx + 1}</span>
                )}
              </div>

              {/* Step label & detail */}
              <div className="flex flex-col md:items-center">
                <span
                  className={cn(
                    "text-sm font-semibold transition-colors",
                    isCurrent ? "text-rind" : isCompleted ? "text-seed" : "text-seed-muted"
                  )}
                >
                  {step.label}
                </span>
                {step.description && (
                  <span className="text-xs text-seed-muted hidden md:inline-block mt-0.5">
                    {step.description}
                  </span>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
};
