import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

export type BadgeVariant =
  'default' | 'healthy' | 'warning' | 'degraded' | 'critical' | 'info' | 'indigo' | 'outline';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  dot?: boolean;
}

const badgeStyles: Record<BadgeVariant, string> = {
  default: 'bg-bg-elevated text-text-secondary border-border-default',
  healthy: 'bg-status-healthy-bg text-status-healthy border-status-healthy/25',
  warning: 'bg-status-warning-bg text-status-warning border-status-warning/25',
  degraded: 'bg-status-warning-bg text-status-warning border-status-warning/25',
  critical: 'bg-status-critical-bg text-status-critical border-status-critical/25',
  info: 'bg-status-info-bg text-status-info border-status-info/25',
  indigo: 'bg-accent-primary/12 text-accent-primary border-accent-primary/25',
  outline: 'bg-transparent text-text-secondary border-border-strong',
};

const dotColors: Record<BadgeVariant, string> = {
  default: 'bg-text-muted',
  healthy: 'bg-status-healthy',
  warning: 'bg-status-warning',
  degraded: 'bg-status-warning',
  critical: 'bg-status-critical',
  info: 'bg-status-info',
  indigo: 'bg-accent-primary',
  outline: 'bg-text-secondary',
};

export function Badge({
  className,
  variant = 'default',
  dot = false,
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium tracking-tight tabular-nums',
        badgeStyles[variant],
        className
      )}
      {...props}
    >
      {dot && (
        <span
          className={cn('h-1.5 w-1.5 rounded-full shrink-0', dotColors[variant])}
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  );
}
