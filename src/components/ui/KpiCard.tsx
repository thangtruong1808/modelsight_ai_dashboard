import type { ReactNode } from 'react';
import {
  Activity,
  Boxes,
  Clock,
  DollarSign,
  ShieldAlert,
  TrendingDown,
  TrendingUp,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import { Sparkline } from '@/components/charts/Sparkline';
import { AnimatedCounter } from '@/components/ui/AnimatedCounter';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { cn } from '@/lib/cn';
import type { KpiMetricCardData } from '@/types';

interface KpiCardProps {
  data: KpiMetricCardData;
  icon?: ReactNode;
  className?: string;
}

const ICON_MAP: Record<KpiMetricCardData['id'], LucideIcon> = {
  requests: Zap,
  successRate: Activity,
  latencyP95: Clock,
  errorRate: ShieldAlert,
  totalCost: DollarSign,
  activeModels: Boxes,
};

export function KpiCard({ data, icon, className }: KpiCardProps) {
  const IconComponent = ICON_MAP[data.id] ?? Activity;

  // Compute delta badge styling based on trendSentiment
  const isPositiveDelta = data.deltaPercent > 0;
  const isZeroDelta = data.deltaPercent === 0;

  let badgeVariantClass = 'bg-bg-elevated text-text-muted border-border-default';
  let DeltaIcon = isPositiveDelta ? TrendingUp : TrendingDown;

  if (data.trendSentiment === 'up-good') {
    if (isPositiveDelta) {
      badgeVariantClass = 'bg-status-healthy-bg text-status-healthy border-status-healthy/30';
    } else if (!isZeroDelta) {
      badgeVariantClass = 'bg-status-critical-bg text-status-critical border-status-critical/30';
    }
  } else if (data.trendSentiment === 'down-good') {
    if (!isPositiveDelta && !isZeroDelta) {
      // Decreasing latency or error rate is GOOD
      badgeVariantClass = 'bg-status-healthy-bg text-status-healthy border-status-healthy/30';
      DeltaIcon = TrendingDown;
    } else if (isPositiveDelta) {
      // Increasing latency or error rate is BAD
      badgeVariantClass = 'bg-status-critical-bg text-status-critical border-status-critical/30';
      DeltaIcon = TrendingUp;
    }
  } else {
    badgeVariantClass = 'bg-accent-primary/10 text-accent-primary border-accent-primary/25';
  }

  const deltaFormatted =
    data.id === 'latencyP95'
      ? `${data.deltaPercent > 0 ? '+' : ''}${data.deltaPercent}%`
      : data.id === 'activeModels'
        ? `${data.deltaPercent}% healthy`
        : `${data.deltaPercent > 0 ? '+' : ''}${data.deltaPercent}%`;

  return (
    <Card
      className={cn(
        'group relative flex flex-col justify-between overflow-hidden p-4 transition-all duration-200 hover:border-border-strong hover:shadow-card',
        className
      )}
    >
      {/* Top row: Label & Icon */}
      <div className="flex items-center justify-between gap-2 text-xs text-text-secondary">
        <span className="truncate font-medium">{data.label}</span>
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-bg-elevated text-text-muted transition-colors group-hover:bg-accent-primary/10 group-hover:text-accent-primary">
          {icon ?? <IconComponent className="h-4 w-4" />}
        </div>
      </div>

      {/* Middle row: Main Animated Counter & Delta Badge */}
      <div className="my-2.5 flex items-baseline justify-between gap-2">
        <AnimatedCounter
          value={data.rawValue}
          unit={data.unit}
          className="text-2xl font-bold tracking-tight text-text-primary"
        />

        <div
          className={cn(
            'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold tabular-nums shrink-0',
            badgeVariantClass
          )}
        >
          {data.trendSentiment !== 'neutral' && <DeltaIcon className="h-3 w-3 shrink-0" />}
          <span>{deltaFormatted}</span>
        </div>
      </div>

      {/* Bottom row: Context subtitle & Mini Sparkline */}
      <div className="mt-1 flex items-end justify-between gap-2 border-t border-border-subtle pt-2.5">
        <span className="truncate text-[11px] text-text-muted font-medium">{data.subtitle}</span>
        <Sparkline
          data={data.sparkline}
          status={data.status}
          width={84}
          height={26}
          className="shrink-0"
        />
      </div>
    </Card>
  );
}

export function KpiCardSkeleton() {
  return (
    <Card className="flex flex-col justify-between p-4 space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-3.5 w-32" />
        <Skeleton className="h-7 w-7 rounded-lg" />
      </div>
      <div className="flex items-baseline justify-between gap-2">
        <Skeleton className="h-8 w-28" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <div className="flex items-center justify-between border-t border-border-subtle pt-2.5">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-6 w-20 rounded" />
      </div>
    </Card>
  );
}
