import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { Slot } from '@radix-ui/react-slot';

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rind focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer select-none active:scale-[0.98]",
  {
    variants: {
      variant: {
        rind: "bg-rind text-white hover:bg-rind-hover shadow-sm shadow-rind/20",
        flesh: "bg-flesh text-white hover:bg-flesh-hover shadow-sm shadow-flesh/20",
        outline: "border border-border bg-pith-card text-seed hover:bg-pith-muted hover:border-seed/20",
        ghost: "text-seed hover:bg-pith-muted",
        subtle: "bg-pith-muted text-seed hover:bg-pith-muted/80",
        link: "text-rind underline-offset-4 hover:underline p-0 h-auto"
      },
      size: {
        sm: "h-8 px-3 text-xs rounded-lg",
        md: "h-10 px-4 py-2",
        lg: "h-12 px-6 text-base rounded-2xl",
        icon: "h-10 w-10 p-0"
      }
    },
    defaultVariants: {
      variant: "rind",
      size: "md"
    }
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
