import { Link } from 'react-router';
import {
  Activity,
  ArrowRight,
  Boxes,
  ExternalLink,
  Layers,
  LineChart,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  Zap,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/app/store';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { ErrorState } from '@/components/ui/FeedbackStates';
import { KpiCard, KpiCardSkeleton } from '@/components/ui/KpiCard';
import { Skeleton } from '@/components/ui/Skeleton';
import { LatencyErrorAnalyticsPanel } from '@/features/overview/LatencyErrorAnalyticsPanel';
import { PerformanceTimeSeriesPanel } from '@/features/overview/PerformanceTimeSeriesPanel';
import { formatCompactNumber, formatLatency, formatPercent } from '@/lib/formatters';
import { useGetOverviewDashboardQuery } from '@/services/baseApi';
import { setForceOfflineError } from '@/app/slices/uiSlice';

export default function OverviewPage() {
  const dispatch = useAppDispatch();
  const globalFilters = useAppSelector((state) => state.ui.globalFilters);
  const simulator = useAppSelector((state) => state.ui.simulator);

  const {
    data: overviewData,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useGetOverviewDashboardQuery(globalFilters);

  if (error || simulator.forceOfflineError) {
    const errorMsg = simulator.forceOfflineError
      ? 'Force API Outage is active in the Chaos Simulator. Click Retry below to restore telemetry.'
      : 'Telemetry cluster connection timed out or simulated error rate was triggered.';

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-border-default pb-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-text-primary sm:text-2xl">
              Production Intelligence Overview
            </h1>
            <p className="mt-1 text-xs text-text-secondary sm:text-sm">
              Real-time health, latency, throughput, and quality telemetry across 14 deployed models
            </p>
          </div>
        </div>

        <ErrorState
          title="Telemetry Stream Disrupted"
          message={errorMsg}
          isRetrying={isFetching}
          onRetry={() => {
            if (simulator.forceOfflineError) {
              dispatch(setForceOfflineError(false));
            }
            refetch();
          }}
        />
      </div>
    );
  }

  const kpis = overviewData?.kpis ?? [];
  const topModels = overviewData?.topModels ?? [];
  const activeIncidents = overviewData?.activeIncidents ?? [];
  const aggregatedSeries = overviewData?.aggregatedSeries ?? [];
  const errorBreakdown = overviewData?.errorBreakdown ?? [];

  return (
    <div className="space-y-6">
      {/* Overview Page Header & Status Bar */}
      <div className="flex flex-col justify-between gap-4 border-b border-border-default pb-5 lg:flex-row lg:items-center">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="healthy" dot>
              Cluster Active: us-east-ml-01
            </Badge>
            <Badge variant="outline" className="font-mono text-[11px]">
              Env: {globalFilters.environment}
            </Badge>
            <Badge variant="outline" className="font-mono text-[11px]">
              Window: {globalFilters.timeRange}
            </Badge>
            {globalFilters.team !== 'all' && (
              <Badge variant="indigo" className="font-mono text-[11px]">
                Team: {globalFilters.team}
              </Badge>
            )}
          </div>
          <h1 className="mt-2 text-xl font-bold tracking-tight text-text-primary sm:text-2xl">
            Production Intelligence Overview
          </h1>
          <p className="mt-1 text-xs text-text-secondary sm:text-sm">
            Continuous observability across 14 LLM and classical ML models with automated SLA and
            drift tracking
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            isLoading={isFetching}
            className="gap-1.5"
            aria-label="Refresh telemetry"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`} />
            <span>Refresh Feed</span>
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => dispatch(setForceOfflineError(true))}
            className="text-xs"
          >
            Simulate API Outage
          </Button>
        </div>
      </div>

      {/* KPI Cards Summary Grid */}
      <section aria-label="Key Performance Indicators">
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {isLoading
            ? Array.from({ length: 6 }).map((_, idx) => <KpiCardSkeleton key={idx} />)
            : kpis.map((kpi) => <KpiCard key={kpi.id} data={kpi} />)}
        </div>
      </section>

      {/* Active Incidents Alert Strip (if any active) */}
      {activeIncidents.length > 0 && (
        <div
          role="region"
          aria-label="Active Incidents Alert"
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-status-critical/30 bg-status-critical-bg/30 px-4 py-3"
        >
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-status-critical/15 text-status-critical">
              <ShieldAlert className="h-4 w-4" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-text-primary">
                  {activeIncidents.length} Active Incidents Detected
                </span>
                <Badge variant="critical" className="text-[10px]">
                  Requires Triage
                </Badge>
              </div>
              <p className="text-[11px] text-text-secondary line-clamp-1">
                Latest: {activeIncidents[0]?.title}
              </p>
            </div>
          </div>

          <Link to="/alerts">
            <Button
              variant="outline"
              size="xs"
              className="border-status-critical/40 text-status-critical hover:bg-status-critical/10 shrink-0 gap-1"
            >
              <span>View Incident Center</span>
              <ArrowRight className="h-3 w-3" />
            </Button>
          </Link>
        </div>
      )}

      {/* Primary Analytics Section: Performance Time-Series Chart */}
      <section aria-label="Performance Time-Series Analytics">
        {isLoading ? (
          <Card className="p-6 space-y-4">
            <Skeleton className="h-5 w-60" />
            <Skeleton className="h-[320px] w-full rounded-xl" />
          </Card>
        ) : (
          <PerformanceTimeSeriesPanel
            series={aggregatedSeries}
            compareToPrevious={globalFilters.compareToPrevious}
          />
        )}
      </section>

      {/* Secondary Analytics Section: Latency Bands & Error Taxonomy */}
      <section aria-label="Latency and Error Analytics">
        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card className="p-6 space-y-4">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-[280px] w-full rounded-xl" />
            </Card>
            <Card className="p-6 space-y-4">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-[280px] w-full rounded-xl" />
            </Card>
          </div>
        ) : (
          <LatencyErrorAnalyticsPanel
            series={aggregatedSeries}
            errorBreakdown={errorBreakdown}
            slaThresholdMs={450}
          />
        )}
      </section>

      {/* Bottom Row: Deployed Fleet Status & Architecture Highlights */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Fleet Composition & Status Matrix */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between w-full">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Boxes className="h-4 w-4 text-accent-primary" />
                  Deployed Fleet Status
                </CardTitle>
                <CardDescription className="mt-0.5">
                  14 models running across Core AI, Risk, Support & Search teams
                </CardDescription>
              </div>
              <Link to="/models">
                <Button variant="ghost" size="xs" className="gap-1 text-xs">
                  <span>View All Registry</span>
                  <ExternalLink className="h-3 w-3" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table
                className="w-full text-left text-xs"
                aria-label="Deployed Fleet Models Preview"
              >
                <thead className="border-b border-border-subtle bg-bg-elevated/40 text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                  <tr>
                    <th scope="col" className="py-2.5 pl-5 pr-3">
                      Model
                    </th>
                    <th scope="col" className="px-3 py-2.5">
                      Category
                    </th>
                    <th scope="col" className="px-3 py-2.5">
                      Status
                    </th>
                    <th scope="col" className="px-3 py-2.5 text-right">
                      p95 Latency
                    </th>
                    <th scope="col" className="px-3 py-2.5 text-right">
                      Success Rate
                    </th>
                    <th scope="col" className="py-2.5 pl-3 pr-5 text-right">
                      24h Requests
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {topModels.slice(0, 6).map((model) => (
                    <tr key={model.id} className="hover:bg-bg-elevated/50 transition-colors group">
                      <td className="py-2.5 pl-5 pr-3">
                        <Link
                          to={`/models/${model.id}`}
                          className="font-medium text-text-primary group-hover:text-accent-primary transition-colors inline-flex items-center gap-1.5"
                        >
                          <span className="truncate max-w-[200px]">{model.displayName}</span>
                        </Link>
                        <div className="text-[10px] text-text-muted font-mono">
                          {model.activeVersion}
                        </div>
                      </td>
                      <td className="px-3 py-2.5">
                        <Badge
                          variant={model.category === 'LLM' ? 'indigo' : 'default'}
                          className="text-[10px]"
                        >
                          {model.category}
                        </Badge>
                      </td>
                      <td className="px-3 py-2.5">
                        <Badge variant={model.status} dot className="text-[10px] capitalize">
                          {model.status}
                        </Badge>
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono tabular-nums text-text-secondary">
                        {formatLatency(model.latencyP95)}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono tabular-nums text-text-secondary">
                        {formatPercent(model.successRate)}
                      </td>
                      <td className="py-2.5 pl-3 pr-5 text-right font-mono tabular-nums font-medium text-text-primary">
                        {formatCompactNumber(model.requests24h)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Telemetry Architecture & Quality Indicators */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-accent-cyan" />
                  Analytics Suite (Phase 3 Active)
                </CardTitle>
                <CardDescription className="mt-0.5">
                  ECharts 6.1 engine + URL-synced filter pipeline
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-3.5 text-xs text-text-secondary">
              <div className="flex items-start gap-2.5 rounded-lg border border-border-default bg-bg-elevated/40 p-2.5">
                <LineChart className="h-4 w-4 text-accent-primary shrink-0 mt-0.5" />
                <div>
                  <strong className="text-text-primary block">
                    Synchronized Multi-Period Overlays
                  </strong>
                  <span>
                    Interactive brush/zoom slider and anomaly markPoints with automatic light/dark
                    palette adaptation.
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2.5 rounded-lg border border-border-default bg-bg-elevated/40 p-2.5">
                <Zap className="h-4 w-4 text-accent-cyan shrink-0 mt-0.5" />
                <div>
                  <strong className="text-text-primary block">
                    Accessible Table Toggle & PNG Export
                  </strong>
                  <span>
                    Every chart features a one-click modal data table for keyboard/screen-reader
                    users and 2x pixel ratio export.
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2.5 rounded-lg border border-border-default bg-bg-elevated/40 p-2.5">
                <Layers className="h-4 w-4 text-status-healthy shrink-0 mt-0.5" />
                <div>
                  <strong className="text-text-primary block">Upcoming Phase 4 Highlights</strong>
                  <span>
                    TanStack Table Models Registry with multi-column filtering, density toggle, and
                    5-tab Model Detail drill-down.
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-status-healthy" />
                  Model Evaluation Benchmarks
                </CardTitle>
                <CardDescription className="mt-0.5">
                  Automated LLM quality heuristics
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-text-secondary">Groundedness & Citations</span>
                <span className="font-mono font-semibold text-text-primary tabular-nums">
                  96.8%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-text-secondary">Hallucination Index</span>
                <span className="font-mono font-semibold text-status-healthy tabular-nums">
                  &lt; 0.4%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-text-secondary">Prompt Injection Defense</span>
                <span className="font-mono font-semibold text-text-primary tabular-nums">
                  99.94%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-text-secondary">Cache Hit Efficiency</span>
                <span className="font-mono font-semibold text-accent-primary tabular-nums">
                  34.2%
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
