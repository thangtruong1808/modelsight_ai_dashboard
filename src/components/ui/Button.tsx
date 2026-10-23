import { type ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/cn';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'icon';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-accent-primary text-white hover:bg-accent-hover shadow-xs focus-visible:ring-accent-primary',
  secondary: 'bg-bg-elevated text-text-primary hover:bg-bg-subtle border border-border-default',
  outline: 'bg-transparent text-text-primary border border-border-strong hover:bg-bg-elevated',
  ghost: 'bg-transparent text-text-secondary hover:text-text-primary hover:bg-bg-elevated',
  danger:
    'bg-status-critical text-white hover:opacity-90 shadow-xs focus-visible:ring-status-critical',
};

const sizeClasses: Record<ButtonSize, string> = {
  xs: 'h-7 px-2.5 text-xs rounded-md gap-1.5',
  sm: 'h-8 px-3 text-xs rounded-md gap-1.5',
  md: 'h-9 px-3.5 text-sm rounded-lg gap-2',
  lg: 'h-10 px-4 text-sm rounded-lg gap-2',
  icon: 'h-8 w-8 rounded-lg justify-center p-0',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant = 'primary', size = 'md', isLoading, disabled, children, ...props },
    ref
  ) => {
    return (
      <button
        ref={ref}
        type="button"
        disabled={disabled || isLoading}
        className={cn(
          'inline-flex items-center justify-center font-medium transition-colors duration-150 select-none cursor-pointer',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-offset-bg-canvas',
          'disabled:opacity-50 disabled:pointer-events-none',
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {isLoading && (
          <span
            className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent"
            aria-hidden="true"
          />
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
