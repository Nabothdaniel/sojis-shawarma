import * as React from 'react';
import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';

const inputVariants = cva(
  'flex w-full rounded-2xl border bg-transparent py-4 px-6 font-body text-sm outline-none transition-all disabled:cursor-not-allowed disabled:opacity-50 placeholder:text-outline/70',
  {
    variants: {
      variant: {
        default: 'border-outline-variant/30 focus:border-transparent focus:ring-2 focus:ring-primary-container/30',
        filled: 'border-transparent bg-surface-container-highest focus:ring-2 focus:ring-primary-container',
        error: 'bg-error/5 border-error focus:ring-2 focus:ring-error/50',
      }
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>, VariantProps<typeof inputVariants> {
  error?: string;
  icon?: React.ReactNode;
  rightAction?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, variant, type, error, icon, rightAction, ...props }, ref) => {
    
    // Automatically apply error variant if error message is provided
    const effectiveVariant = error ? 'error' : variant;

    return (
      <div className="w-full space-y-1">
        <div className="relative">
          {icon && (
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-outline/80">
              {icon}
            </div>
          )}
          
          <input
            type={type}
            className={cn(
              inputVariants({ variant: effectiveVariant, className }),
              icon && 'pl-11',
              rightAction && 'pr-14'
            )}
            ref={ref}
            {...props}
          />
          
          {rightAction && (
            <div className="absolute inset-y-0 right-0 flex items-center justify-center w-14">
              {rightAction}
            </div>
          )}
        </div>
        
        {error && (
          <p className="px-4 text-[10px] font-bold uppercase tracking-wider text-error animate-in fade-in slide-in-from-top-1">
            {error}
          </p>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';

export { Input, inputVariants };
