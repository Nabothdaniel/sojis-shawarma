import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-full font-headline font-bold transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none',
  {
    variants: {
      variant: {
        default: 'bg-on-surface text-surface shadow-2xl hover:bg-on-surface/90',
        primary: 'bg-primary-container text-on-primary-container shadow-lg hover:bg-primary-container/90',
        secondary: 'bg-surface-container-low text-on-surface font-label text-xs uppercase tracking-widest hover:bg-surface-container-lowest',
        outline: 'border border-outline-variant/30 text-on-surface bg-transparent hover:bg-surface-container-low',
        ghost: 'text-on-surface hover:bg-surface-container-low',
        danger: 'bg-error text-white hover:bg-error/90',
        tertiary: 'bg-tertiary text-white hover:bg-tertiary/90 shadow-lg',
      },
      size: {
        default: 'h-14 px-8 py-4 text-base',
        sm: 'h-10 px-6 py-3 text-xs',
        icon: 'h-10 w-10 shrink-0',
        iconLg: 'h-14 w-14 shrink-0',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  isLoading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, isLoading, children, ...props }, ref) => {
    // Handling asChild would typically require Radix UI Slot, but since we are keeping dependencies light
    // we just use a standard button here
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={isLoading || props.disabled}
        {...props}
      >
        {isLoading ? (
          <span className="mr-2 inline-block h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
        ) : null}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
