import { useMemo } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router';
import type * as echarts from 'echarts';
import {
  Activity,
  ArrowLeft,
  Boxes,
  CheckCircle2,
  Clock,
  Copy,
  DollarSign,
  FileCode,
  GitBranch,
  GitCompare,
  LineChart,
  ShieldAlert,
  ShieldCheck,
  Terminal,
  Zap,
} from 'lucide-react';
import { toast } from 'sonner';
import { BaseEChart } from '@/components/charts/BaseEChart';
import { Sparkline } from '@/components/charts/Sparkline';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { EmptyState, ErrorState } from '@/components/ui/FeedbackStates';
import { Tooltip } from '@/components/ui/Tooltip';
import { cn } from '@/lib/cn';
import {
  formatCompactNumber,
  formatCurrency,
  formatLatency,
  formatPercent,
} from '@/lib/formatters';
import { useGetModelDetailQuery } from '@/services/baseApi';

type ModelTabId = 'overview' | 'metrics' | 'versions' | 'drift' | 'incidents';

const TABS: Array<{ id: ModelTabId; label: string; icon: typeof Activity }> = [
  { id: 'overview', label: 'Overview', icon: Boxes },
  { id: 'metrics', label: 'Metrics & Telemetry', icon: LineChart },
  { id: 'versions', label: 'Versions & Traffic', icon: GitBranch },
  { id: 'drift', label: 'Data Drift', icon: Activity },
  { id: 'incidents', label: 'Incidents History', icon: ShieldAlert },
];

export default function ModelDetailPage() {
  const { modelId = 'claude-3-7-sonnet-prod' } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const activeTab = (searchParams.get('tab') as ModelTabId) || 'overview';

  const { data: model, isFetching, error, refetch } = useGetModelDetailQuery(modelId);

  const handleTabChange = (tab: ModelTabId) => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('tab', tab);
    setSearchParams(nextParams, { replace: true });
  };

  const handleCopyEndpoint = () => {
    if (!model) return;
    navigator.clipboard.writeText(`https://api.modelsight.ai${model.endpoint}`);
    toast.success('Endpoint URL copied to clipboard', {
      description: `https://api.modelsight.ai${model.endpoint}`,
    });
  };

  // ECharts Time-Series option for the Metrics tab
  const metricsOption = useMemo<echarts.EChartsOption>(() => {
    if (!model || !model.timeSeries) return {};

    const dates = model.timeSeries.map((pt) => {
      const d = new Date(pt.timestamp);
      return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:00`;
    });

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'cross' },
      },
      legend: {
        show: true,
        top: 0,
        right: 80,
      },
      grid: {
        top: 36,
        right: 20,
        bottom: 30,
        left: 20,
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: dates,
        boundaryGap: false,
      },
      yAxis: [
        {
          type: 'value',
          name: 'Latency (ms)',
          position: 'left',
          axisLabel: { formatter: '{value}ms' },
          splitLine: { lineStyle: { type: 'dashed' } },
        },
        {
          type: 'value',
          name: 'Requests',
          position: 'right',
          axisLabel: { formatter: (v: number) => formatCompactNumber(v) },
          splitLine: { show: false },
        },
      ],
      series: [
        {
          name: 'p95 Latency',
          type: 'line',
          yAxisIndex: 0,
          data: model.timeSeries.map((p) => p.latencyP95),
          smooth: 0.3,
          lineStyle: { width: 2, color: '#6366f1' },
          itemStyle: { color: '#6366f1' },
        },
        {
          name: 'Inference Requests',
          type: 'bar',
          yAxisIndex: 1,
          data: model.timeSeries.map((p) => p.requests),
          itemStyle: { color: 'rgba(6, 182, 212, 0.45)', borderRadius: [4, 4, 0, 0] },
        },
      ],
    };
  }, [model]);

  if (error || !model) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Link to="/models">
            <Button variant="ghost" size="sm" className="gap-1 text-xs">
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Models</span>
            </Button>
          </Link>
        </div>
        <ErrorState
          title="Model Not Found in Catalog"
          message={`Unable to locate telemetry for model identifier '${modelId}'.`}
          isRetrying={isFetching}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back button & Model Header Banner */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Link to="/models">
            <Button
              variant="ghost"
              size="xs"
              className="gap-1.5 text-xs text-text-muted hover:text-text-primary"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Models Registry</span>
            </Button>
          </Link>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="xs"
              onClick={() => navigate(`/comparison?models=${model.id}`)}
              className="gap-1 text-xs"
            >
              <GitCompare className="h-3 w-3" />
              <span>Compare Model</span>
            </Button>
          </div>
        </div>

        <div className="flex flex-col justify-between gap-4 rounded-xl border border-border-default bg-bg-surface p-5 lg:flex-row lg:items-center">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={model.status} dot className="capitalize text-xs font-semibold">
                {model.status}
              </Badge>
              <Badge variant={model.category === 'LLM' ? 'indigo' : 'default'} className="text-xs">
                {model.category}
              </Badge>
              <Badge variant="outline" className="text-xs font-mono">
                {model.environment}
              </Badge>
              <Badge variant="default" className="text-xs">
                {model.team}
              </Badge>
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-text-primary">
              {model.displayName}
            </h1>

            <div className="flex flex-wrap items-center gap-3 text-xs text-text-secondary">
              <span>
                Provider: <strong className="text-text-primary">{model.provider}</strong>
              </span>
              <span>•</span>
              <span>
                Framework: <strong className="text-text-primary">{model.framework}</strong>
              </span>
              <span>•</span>
              <span>
                Active Version:{' '}
                <strong className="text-accent-primary font-mono">{model.activeVersion}</strong>
              </span>
            </div>
          </div>

          {/* Endpoint URL Pill with Copy */}
          <div className="flex items-center gap-2 rounded-lg border border-border-default bg-bg-canvas px-3 py-2 text-xs">
            <Terminal className="h-3.5 w-3.5 text-text-muted shrink-0" />
            <code className="font-mono text-text-primary text-[11px] truncate max-w-[260px]">
              {model.endpoint}
            </code>
            <Tooltip content="Copy production endpoint URL">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 ml-1"
                onClick={handleCopyEndpoint}
                aria-label="Copy endpoint URL"
              >
                <Copy className="h-3 w-3" />
              </Button>
            </Tooltip>
          </div>
        </div>
      </div>

      {/* Tabs Navigation Bar */}
      <div className="border-b border-border-default">
        <nav className="flex space-x-2 sm:space-x-4" aria-label="Model Detail Tabs">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTabChange(tab.id)}
                className={cn(
                  'flex items-center gap-2 border-b-2 py-3 px-3 text-xs sm:text-sm font-medium transition-colors cursor-pointer',
                  isActive
                    ? 'border-accent-primary text-accent-primary font-semibold'
                    : 'border-transparent text-text-muted hover:border-border-strong hover:text-text-primary'
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab 1: Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6 animate-in fade-in-0 duration-150">
          {/* Top Metric Cards */}
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="p-4">
              <div className="flex items-center justify-between text-xs text-text-secondary">
                <span>24h Invocations</span>
                <Zap className="h-4 w-4 text-accent-primary" />
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="font-mono text-xl font-bold tabular-nums text-text-primary">
                  {formatCompactNumber(model.requests24h)}
                </span>
                <Badge variant="healthy">
                  {model.requestsDeltaPct > 0 ? '+' : ''}
                  {model.requestsDeltaPct}%
                </Badge>
              </div>
              <div className="mt-2">
                <Sparkline
                  data={model.sparklineRequests}
                  status="healthy"
                  height={24}
                  width={100}
                />
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between text-xs text-text-secondary">
                <span>p95 Latency</span>
                <Clock className="h-4 w-4 text-accent-cyan" />
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="font-mono text-xl font-bold tabular-nums text-text-primary">
                  {formatLatency(model.latencyP95)}
                </span>
                <Badge variant={model.latencyP95 <= model.slaLatencyMs ? 'healthy' : 'critical'}>
                  SLA: {model.slaLatencyMs}ms
                </Badge>
              </div>
              <div className="mt-2">
                <Sparkline
                  data={model.sparklineLatency}
                  status={model.latencyP95 <= model.slaLatencyMs ? 'healthy' : 'critical'}
                  height={24}
                  width={100}
                />
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between text-xs text-text-secondary">
                <span>Success Rate</span>
                <CheckCircle2 className="h-4 w-4 text-status-healthy" />
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="font-mono text-xl font-bold tabular-nums text-text-primary">
                  {formatPercent(model.successRate)}
                </span>
                <span className="text-[11px] font-mono text-text-muted">
                  Error: {formatPercent(model.errorRate)}
                </span>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between text-xs text-text-secondary">
                <span>24h Cost / Token Spend</span>
                <DollarSign className="h-4 w-4 text-amber-500" />
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="font-mono text-xl font-bold tabular-nums text-text-primary">
                  {formatCurrency(model.cost24hUsd)}
                </span>
                <Badge variant="default">
                  {model.costDeltaPct > 0 ? '+' : ''}
                  {model.costDeltaPct}%
                </Badge>
              </div>
            </Card>
          </div>

          {/* Model Description & Quality Heuristics */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <FileCode className="h-4 w-4 text-accent-primary" />
                    Model Overview & Operational Description
                  </CardTitle>
                  <CardDescription className="mt-0.5">
                    Production architecture, routing policies, and latency commitments
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 text-xs leading-relaxed text-text-secondary">
                <p>{model.description}</p>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 pt-2 border-t border-border-subtle">
                  <div className="rounded-lg border border-border-default bg-bg-canvas p-3 space-y-1">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-text-muted block">
                      Target SLA Commitment
                    </span>
                    <span className="font-mono text-sm font-bold text-text-primary">
                      {model.slaLatencyMs}ms (p95) • 99.50% uptime
                    </span>
                  </div>

                  <div className="rounded-lg border border-border-default bg-bg-canvas p-3 space-y-1">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-text-muted block">
                      Token Cache Utilization
                    </span>
                    <span className="font-mono text-sm font-bold text-accent-primary">
                      {formatCompactNumber(model.cachedTokens24h)} /{' '}
                      {formatCompactNumber(model.inputTokens24h)} cached (34%)
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quality Scorecard */}
            <Card>
              <CardHeader>
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-status-healthy" />
                    LLM Quality Scorecard
                  </CardTitle>
                  <CardDescription className="mt-0.5">
                    Continuous evaluation benchmark
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Groundedness & Citations</span>
                    <strong className="font-mono tabular-nums text-text-primary">
                      {model.qualityScores.groundedness}%
                    </strong>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-bg-elevated overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full"
                      style={{ width: `${model.qualityScores.groundedness}%` }}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Query Relevance</span>
                    <strong className="font-mono tabular-nums text-text-primary">
                      {model.qualityScores.relevance}%
                    </strong>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-bg-elevated overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 rounded-full"
                      style={{ width: `${model.qualityScores.relevance}%` }}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Semantic Coherence</span>
                    <strong className="font-mono tabular-nums text-text-primary">
                      {model.qualityScores.coherence}%
                    </strong>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-bg-elevated overflow-hidden">
                    <div
                      className="h-full bg-cyan-500 rounded-full"
                      style={{ width: `${model.qualityScores.coherence}%` }}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Safety & Guardrail Compliance</span>
                    <strong className="font-mono tabular-nums text-text-primary">
                      {model.qualityScores.safetyRate}%
                    </strong>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-bg-elevated overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full"
                      style={{ width: `${model.qualityScores.safetyRate}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Tab 2: Metrics & Telemetry Tab */}
      {activeTab === 'metrics' && (
        <div className="space-y-6 animate-in fade-in-0 duration-150">
          <Card>
            <CardHeader>
              <div>
                <CardTitle className="flex items-center gap-2">
                  <LineChart className="h-4 w-4 text-accent-primary" />
                  30-Day Invocations & Tail Latency
                </CardTitle>
                <CardDescription className="mt-0.5">
                  Dual-axis chart showing hourly request volume (bars) vs. p95 latency curve (line)
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <BaseEChart
                option={metricsOption}
                height={340}
                ariaLabel="Dual-axis model telemetry chart"
                exportFileName={`${model.id}-metrics`}
              />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tab 3: Versions & Traffic Tab */}
      {activeTab === 'versions' && (
        <div className="space-y-6 animate-in fade-in-0 duration-150">
          <Card>
            <CardHeader>
              <div>
                <CardTitle className="flex items-center gap-2">
                  <GitBranch className="h-4 w-4 text-accent-cyan" />
                  Deployment History & Canary Traffic Split
                </CardTitle>
                <CardDescription className="mt-0.5">
                  Active routing rules, traffic percentages, and configuration commit history
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {model.versions.map((ver) => (
                  <div
                    key={ver.version}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-border-default bg-bg-canvas p-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <strong className="font-mono text-sm text-text-primary">
                          {ver.version}
                        </strong>
                        <Badge
                          variant={
                            ver.status === 'active'
                              ? 'healthy'
                              : ver.status === 'canary'
                                ? 'warning'
                                : 'outline'
                          }
                          className="capitalize text-[10px]"
                        >
                          {ver.status} ({ver.trafficSplitPercent}%)
                        </Badge>
                      </div>
                      <p className="text-xs text-text-secondary">{ver.notes}</p>
                      <div className="flex items-center gap-2 text-[11px] text-text-muted font-mono">
                        <span>Commit: {ver.commitSha}</span>
                        <span>•</span>
                        <span>Author: {ver.author}</span>
                        <span>•</span>
                        <span>Deployed: {new Date(ver.deployedAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        variant="outline"
                        size="xs"
                        onClick={() => toast.info(`Viewing config for ${ver.version}`)}
                      >
                        View Config
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tab 4: Data Drift Tab */}
      {activeTab === 'drift' && (
        <div className="space-y-6 animate-in fade-in-0 duration-150">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between w-full">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-status-warning" />
                    Feature & Embedding Drift Status
                  </CardTitle>
                  <CardDescription className="mt-0.5">
                    PSI score: {model.driftPsi.toFixed(3)} • Status:{' '}
                    {model.driftPsi >= 0.25
                      ? 'Critical Drift'
                      : model.driftPsi >= 0.15
                        ? 'Moderate Shift'
                        : 'Stable'}
                  </CardDescription>
                </div>
                <Link to="/drift">
                  <Button variant="outline" size="xs">
                    Open Global Drift Heatmap
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border border-border-default bg-bg-canvas p-4 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-text-primary">
                    Population Stability Index (PSI)
                  </span>
                  <span className="font-mono font-bold text-text-primary">
                    {model.driftPsi.toFixed(3)}
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-bg-elevated overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full',
                      model.driftPsi >= 0.25
                        ? 'bg-rose-500'
                        : model.driftPsi >= 0.15
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                    )}
                    style={{ width: `${Math.min(100, (model.driftPsi / 0.4) * 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-text-muted">
                  <span>&lt; 0.10 (Stable)</span>
                  <span>0.10 - 0.25 (Moderate)</span>
                  <span>&gt; 0.25 (Critical Retrain)</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tab 5: Incidents Tab */}
      {activeTab === 'incidents' && (
        <div className="space-y-6 animate-in fade-in-0 duration-150">
          <Card>
            <CardHeader>
              <div>
                <CardTitle className="flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 text-status-critical" />
                  Incidents & SLA Breaches for {model.displayName}
                </CardTitle>
                <CardDescription className="mt-0.5">
                  Historical triage log and automated diagnostic traces
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              {model.status === 'critical' || model.status === 'degraded' ? (
                <div className="rounded-xl border border-status-critical/30 bg-status-critical-bg/25 p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="critical">Active Alert</Badge>
                    <span className="font-semibold text-xs text-text-primary">
                      {model.status === 'critical'
                        ? 'Critical SLA / Drift Breach'
                        : 'Degraded Tail Latency Warning'}
                    </span>
                  </div>
                  <p className="text-xs text-text-secondary">
                    Observed p95 latency ({model.latencyP95}ms) or drift PSI (
                    {model.driftPsi.toFixed(3)}) breached baseline thresholds.
                  </p>
                  <Link to="/alerts">
                    <Button variant="outline" size="xs" className="mt-2 text-xs">
                      Triage in Incidents Center
                    </Button>
                  </Link>
                </div>
              ) : (
                <EmptyState
                  title="No Active Incidents"
                  description="All telemetry for this model is within healthy SLA and drift thresholds."
                />
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
