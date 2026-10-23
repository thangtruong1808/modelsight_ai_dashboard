import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import {
  Activity,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Layers,
  Sparkles,
  Terminal,
} from 'lucide-react';
import { ROUTE_TITLES } from '@/app/navigation';
import { resetSimulator, setForceOfflineError } from '@/app/slices/uiSlice';
import { useAppDispatch, useAppSelector } from '@/app/store';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { EmptyState, ErrorState } from '@/components/ui/FeedbackStates';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatCompactNumber, formatCurrency, formatLatency, formatPercent } from '@/lib/formatters';

interface RouteSectionViewProps {
  phaseNumber: number;
  phaseSummary: string;
  upcomingHighlights: string[];
}

const SAMPLE_KPI_PREVIEW = [
  {
    label: 'Total Inference Requests (24h)',
    value: formatCompactNumber(14_820_490),
    delta: '+14.2%',
    status: 'healthy' as const,
  },
  {
    label: 'Global Success Rate',
    value: formatPercent(99.94),
    delta: '+0.03%',
    status: 'healthy' as const,
  },
  {
    label: 'Tail Latency (p95)',
    value: formatLatency(342),
    delta: '-18ms',
    status: 'healthy' as const,
  },
  {
    label: 'Active Drift Warnings',
    value: '2 features',
    delta: 'PSI > 0.25',
    status: 'warning' as const,
  },
  {
    label: 'Estimated Daily Token Spend',
    value: formatCurrency(3842.5),
    delta: '-4.1% vs budget',
    status: 'info' as const,
  },
  {
    label: 'Active Production Models',
    value: '14 / 14',
    delta: '4 LLM • 10 ML',
    status: 'indigo' as const,
  },
];

export function RouteSectionView({
  phaseNumber,
  phaseSummary,
  upcomingHighlights,
}: RouteSectionViewProps) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const simulator = useAppSelector((state) => state.ui.simulator);
  const [previewState, setPreviewState] = useState<'ready' | 'loading' | 'empty'>('ready');

  const meta = ROUTE_TITLES[pathname] ?? {
    title: 'ModelSight AI Section',
    subtitle: 'Production ML & LLM Observability',
    section: 'Observability',
  };

  if (simulator.forceOfflineError) {
    return (
      <div className="space-y-6">
        <ErrorState
          title={`Simulated API Outage on ${meta.title}`}
          message="The Chaos Simulator in the topbar currently has 'Force API Outage' enabled. Click Retry below to restore telemetry and test recovery."
          onRetry={() => dispatch(setForceOfflineError(false))}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col justify-between gap-4 border-b border-border-default pb-5 lg:flex-row lg:items-center">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="indigo">Phase 1 Foundation Active</Badge>
            <Badge variant="outline">Target Feature: Phase {phaseNumber}</Badge>
          </div>
          <h1 className="mt-2 text-xl font-bold tracking-tight text-text-primary sm:text-2xl">
            {meta.title}
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-text-secondary">{meta.subtitle}</p>
        </div>

        {/* Interactive Design System State Switcher */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center rounded-lg border border-border-default bg-bg-surface p-1 text-xs">
            <button
              type="button"
              onClick={() => setPreviewState('ready')}
              className={`rounded-md px-2.5 py-1 font-medium transition-colors cursor-pointer ${
                previewState === 'ready'
                  ? 'bg-accent-primary text-white'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Ready State
            </button>
            <button
              type="button"
              onClick={() => setPreviewState('loading')}
              className={`rounded-md px-2.5 py-1 font-medium transition-colors cursor-pointer ${
                previewState === 'loading'
                  ? 'bg-accent-primary text-white'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Skeleton State
            </button>
            <button
              type="button"
              onClick={() => setPreviewState('empty')}
              className={`rounded-md px-2.5 py-1 font-medium transition-colors cursor-pointer ${
                previewState === 'empty'
                  ? 'bg-accent-primary text-white'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Empty State
            </button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => dispatch(setForceOfflineError(true))}
          >
            Simulate Error
          </Button>
        </div>
      </div>

      {/* State Previews */}
      {previewState === 'loading' && (
        <div className="space-y-4" aria-label="Skeleton loading preview">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {Array.from({ length: 6 }).map((_, idx) => (
              <Card key={idx} className="p-4 space-y-3">
                <Skeleton className="h-3.5 w-28" />
                <Skeleton className="h-7 w-20" />
                <Skeleton className="h-3 w-24" />
              </Card>
            ))}
          </div>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2 p-5 space-y-4">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-64 w-full" />
            </Card>
            <Card className="p-5 space-y-4">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-64 w-full" />
            </Card>
          </div>
        </div>
      )}

      {previewState === 'empty' && (
        <EmptyState
          title={`No telemetry matching filter on ${meta.title}`}
          description="Try broadening your global environment or time-range filter, or reset the active view to default production metrics."
          actionLabel="Restore Ready View"
          onAction={() => {
            dispatch(resetSimulator());
            setPreviewState('ready');
          }}
        />
      )}

      {previewState === 'ready' && (
        <>
          {/* Design System Typography & Tabular Numeral Verification Row */}
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {SAMPLE_KPI_PREVIEW.map((kpi) => (
              <Card key={kpi.label} className="p-4 hover:border-border-strong transition-colors">
                <div className="flex items-center justify-between text-xs text-text-secondary">
                  <span className="truncate font-medium">{kpi.label}</span>
                  <Activity className="h-3.5 w-3.5 text-text-muted shrink-0" />
                </div>
                <div className="mt-2 flex items-baseline justify-between gap-2">
                  <span className="font-mono text-xl font-bold tracking-tight text-text-primary tabular-nums">
                    {kpi.value}
                  </span>
                  <Badge variant={kpi.status}>{kpi.delta}</Badge>
                </div>
              </Card>
            ))}
          </div>

          {/* Phase Architecture & Design System Card */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Layers className="h-4 w-4 text-accent-primary" />
                    {meta.title} — Module Blueprint (Scheduled for Phase {phaseNumber})
                  </CardTitle>
                  <CardDescription className="mt-0.5">{phaseSummary}</CardDescription>
                </div>
                <Badge variant="healthy" dot>
                  Shell Ready
                </Badge>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {upcomingHighlights.map((item) => (
                    <div
                      key={item}
                      className="flex items-start gap-2.5 rounded-lg border border-border-default bg-bg-elevated/40 p-3"
                    >
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-accent-cyan" />
                      <span className="text-xs text-text-primary leading-relaxed">{item}</span>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border-default bg-bg-canvas p-3.5">
                  <div className="flex items-center gap-2.5 text-xs text-text-secondary">
                    <Terminal className="h-4 w-4 text-accent-primary" />
                    <span>
                      Keyboard shortcuts active: press{' '}
                      <kbd className="rounded border border-border-strong bg-bg-surface px-1.5 py-0.5 font-mono text-[11px] text-text-primary">
                        [
                      </kbd>{' '}
                      to toggle sidebar or{' '}
                      <kbd className="rounded border border-border-strong bg-bg-surface px-1.5 py-0.5 font-mono text-[11px] text-text-primary">
                        ⌘K
                      </kbd>{' '}
                      for command trigger.
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-mono text-text-muted tabular-nums">
                    <Clock className="h-3.5 w-3.5" />
                    Sim Latency: {simulator.latencyMs}ms
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Design System Semantic Tokens Showcase */}
            <Card>
              <CardHeader>
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-accent-cyan" />
                    Design Tokens & Status Matrix
                  </CardTitle>
                  <CardDescription className="mt-0.5">
                    WCAG AA verified semantic tokens for Light & Dark themes
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="healthy" dot>
                    Healthy (SLA Met)
                  </Badge>
                  <Badge variant="warning" dot>
                    Warning (Drift PSI 0.28)
                  </Badge>
                  <Badge variant="critical" dot>
                    Critical (p99 Breach)
                  </Badge>
                  <Badge variant="info" dot>
                    Shadow Canary
                  </Badge>
                  <Badge variant="indigo">LLM Reasoning</Badge>
                </div>

                <div className="space-y-2 pt-2 border-t border-border-subtle text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-text-secondary">Tabular Monospace Metric</span>
                    <span className="font-mono font-semibold text-text-primary tabular-nums">
                      99.984% • 142.8ms
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-text-secondary">Quick Route Navigation</span>
                    <button
                      type="button"
                      onClick={() => navigate('/models')}
                      className="inline-flex items-center gap-1 font-medium text-accent-primary hover:underline cursor-pointer"
                    >
                      Models Registry
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

