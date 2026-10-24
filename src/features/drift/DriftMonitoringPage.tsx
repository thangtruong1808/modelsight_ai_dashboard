import { useMemo, useState } from 'react';
import type * as echarts from 'echarts';
import {
  Activity,
  AlertTriangle,
  ArrowUpDown,
  BarChart3,
  Flame,
  RefreshCw,
  Sliders,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAppSelector } from '@/app/store';
import { BaseEChart, type AccessibleTableData } from '@/components/charts/BaseEChart';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { ErrorState } from '@/components/ui/FeedbackStates';
import { Skeleton } from '@/components/ui/Skeleton';
import { cn } from '@/lib/cn';
import { useGetDriftFeaturesQuery } from '@/services/baseApi';

export default function DriftMonitoringPage() {
  const {
    data: driftFeatures = [],
    isLoading,
    isFetching,
    error,
    refetch,
  } = useGetDriftFeaturesQuery();
  const [selectedFeatureName, setSelectedFeatureName] = useState<string>('card_velocity_15m');
  const resolvedTheme = useAppSelector((state) => state.theme.resolved);

  const selectedFeature = useMemo(() => {
    return driftFeatures.find((f) => f.featureName === selectedFeatureName) ?? driftFeatures[0];
  }, [driftFeatures, selectedFeatureName]);

  // 1. Features × Time Heatmap ECharts Option
  const heatmapOption = useMemo<echarts.EChartsOption>(() => {
    if (!driftFeatures || driftFeatures.length === 0) return {};

    const featureNames = driftFeatures.map((f) => f.featureName);
    const timeBuckets = Array.from({ length: 14 }).map((_, idx) => `T-${14 - idx}h`);

    // Flatten into [xIndex, yIndex, psiValue]
    const heatmapData: Array<[number, number, number]> = [];
    driftFeatures.forEach((feat, yIdx) => {
      feat.hourlyPsi.forEach((val, xIdx) => {
        heatmapData.push([xIdx, yIdx, val]);
      });
    });

    return {
      tooltip: {
        position: 'top',
        formatter: (params: unknown) => {
          const item = params as { data: [number, number, number] };
          const [xIdx, yIdx, val] = item.data;
          const feat = featureNames[yIdx];
          const time = timeBuckets[xIdx];
          return `<div class="text-xs">
            <strong class="font-mono text-text-primary block">${feat}</strong>
            <div class="flex justify-between gap-4 mt-1">
              <span class="text-text-secondary">Time Window:</span>
              <span class="font-mono">${time}</span>
            </div>
            <div class="flex justify-between gap-4 mt-0.5">
              <span class="text-text-secondary">PSI Score:</span>
              <strong class="font-mono ${val >= 0.25 ? 'text-rose-500' : val >= 0.15 ? 'text-amber-500' : 'text-emerald-500'}">${val.toFixed(3)}</strong>
            </div>
          </div>`;
        },
      },
      grid: {
        top: 24,
        right: 80,
        bottom: 30,
        left: 170,
        containLabel: false,
      },
      xAxis: {
        type: 'category',
        data: timeBuckets,
        splitArea: { show: true },
        axisLabel: { fontSize: 10 },
      },
      yAxis: {
        type: 'category',
        data: featureNames,
        splitArea: { show: true },
        axisLabel: {
          fontSize: 11,
          fontFamily: "'JetBrains Mono', monospace",
        },
      },
      visualMap: {
        min: 0,
        max: 0.35,
        calculable: true,
        orient: 'vertical',
        right: 10,
        top: 'center',
        inRange: {
          color: ['#10b981', '#38bdf8', '#f59e0b', '#f43f5e'],
        },
        textStyle: {
          fontSize: 10,
          color: resolvedTheme === 'dark' ? '#94a3b8' : '#475569',
        },
      },
      series: [
        {
          name: 'PSI Heatmap',
          type: 'heatmap',
          data: heatmapData,
          label: {
            show: true,
            fontSize: 9,
            formatter: (p: unknown) => {
              const item = p as { data: [number, number, number] };
              return item.data[2].toFixed(2);
            },
            color: '#ffffff',
          },
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowColor: 'rgba(0, 0, 0, 0.5)',
            },
          },
        },
      ],
    };
  }, [driftFeatures, resolvedTheme]);

  // 2. Baseline vs. Production Distribution Overlay Option
  const distributionOption = useMemo<echarts.EChartsOption>(() => {
    if (!selectedFeature) return {};

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
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
        data: selectedFeature.distributionBins,
        axisLabel: { fontSize: 10 },
      },
      yAxis: {
        type: 'value',
        axisLabel: { formatter: '{value}%' },
        splitLine: { lineStyle: { type: 'dashed' } },
      },
      series: [
        {
          name: 'Training Baseline Distribution',
          type: 'bar',
          data: selectedFeature.baselineDistribution,
          itemStyle: {
            color: 'rgba(99, 102, 241, 0.65)',
            borderRadius: [3, 3, 0, 0],
          },
        },
        {
          name: 'Live Production Window',
          type: 'bar',
          data: selectedFeature.productionDistribution,
          itemStyle: {
            color: 'rgba(244, 63, 94, 0.75)',
            borderRadius: [3, 3, 0, 0],
          },
        },
      ],
    };
  }, [selectedFeature]);

  const heatmapTableData = useMemo<AccessibleTableData>(() => {
    return {
      title: 'Feature PSI Drift Matrix Table',
      columns: ['Feature Name', 'Category', 'Current PSI', 'KS Statistic', 'Health Status'],
      rows: driftFeatures.map((f) => [
        f.featureName,
        f.category,
        f.psiScore.toFixed(3),
        f.ksStat.toFixed(2),
        f.status,
      ]),
    };
  }, [driftFeatures]);

  if (error) {
    return (
      <div className="space-y-6">
        <ErrorState
          title="Failed to Load Drift Telemetry"
          message="Unable to communicate with the distribution monitoring service."
          isRetrying={isFetching}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  const criticalFeaturesCount = driftFeatures.filter((f) => f.status === 'critical').length;
  const degradedFeaturesCount = driftFeatures.filter((f) => f.status === 'degraded').length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col justify-between gap-4 border-b border-border-default pb-5 lg:flex-row lg:items-center">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="indigo">Population Stability Index (PSI) Active</Badge>
            <Badge variant={criticalFeaturesCount > 0 ? 'critical' : 'healthy'}>
              {criticalFeaturesCount} Critical Drift Warnings
            </Badge>
          </div>
          <h1 className="mt-2 text-xl font-bold tracking-tight text-text-primary sm:text-2xl">
            Data & Embedding Drift Monitoring
          </h1>
          <p className="mt-1 text-xs text-text-secondary sm:text-sm">
            Continuous detection of feature distribution shift between training baselines and live
            inference payloads
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            isLoading={isFetching}
            className="gap-1.5"
            aria-label="Refresh drift telemetry"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`} />
            <span>Recalculate PSI</span>
          </Button>
        </div>
      </div>

      {/* Drift Summary Cards */}
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4">
          <div className="flex items-center justify-between text-xs text-text-secondary">
            <span>Features Monitored</span>
            <Sliders className="h-4 w-4 text-accent-primary" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="font-mono text-2xl font-bold text-text-primary">
              {driftFeatures.length}
            </span>
            <span className="text-xs text-text-muted">Tabular & Vectors</span>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between text-xs text-text-secondary">
            <span>Critical Drift Alerts (PSI &gt; 0.25)</span>
            <AlertTriangle className="h-4 w-4 text-status-critical" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="font-mono text-2xl font-bold text-status-critical">
              {criticalFeaturesCount}
            </span>
            <Badge variant="critical">Retrain Recommended</Badge>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between text-xs text-text-secondary">
            <span>Moderate Shift (PSI 0.10 - 0.25)</span>
            <Activity className="h-4 w-4 text-status-warning" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="font-mono text-2xl font-bold text-status-warning">
              {degradedFeaturesCount}
            </span>
            <Badge variant="warning">Monitor Closely</Badge>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between text-xs text-text-secondary">
            <span>Average Kolmogorov-Smirnov Stat</span>
            <Sparkles className="h-4 w-4 text-accent-cyan" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="font-mono text-2xl font-bold text-text-primary">0.174</span>
            <span className="text-xs text-text-muted font-mono">p &lt; 0.01</span>
          </div>
        </Card>
      </div>

      {/* Interactive Features × Time Heatmap */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Flame className="h-4 w-4 text-status-critical" />
              Features × Time PSI Heatmap
            </CardTitle>
            <CardDescription className="mt-0.5">
              Hourly feature drift progression over the last 14 time windows. Click any row or cell
              to inspect distribution details below.
            </CardDescription>
          </div>
          <Badge variant="outline" className="text-xs font-mono">
            Scale: 0.00 (Healthy) - 0.35+ (Severe Drift)
          </Badge>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-[280px] w-full rounded-xl" />
          ) : (
            <BaseEChart
              option={heatmapOption}
              height={290}
              accessibleTable={heatmapTableData}
              ariaLabel="Feature PSI drift heatmap"
              exportFileName="modelsight-drift-heatmap"
              onChartReady={(chart) => {
                chart.on('click', (params) => {
                  const data = params.data as [number, number, number] | undefined;
                  if (data && driftFeatures[data[1]]) {
                    const feature = driftFeatures[data[1]]!;
                    setSelectedFeatureName(feature.featureName);
                    toast.info(`Selected feature: ${feature.featureName}`, {
                      description: `Current PSI: ${feature.psiScore.toFixed(3)} • Baseline mean: ${feature.baselineMean}`,
                    });
                  }
                });
              }}
            />
          )}
        </CardContent>
      </Card>

      {/* Feature Drill-down Section: Distribution Comparison & Feature Leaderboard */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Selected Feature Distribution Chart */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between w-full">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-accent-primary" />
                  Distribution Shift: {selectedFeature?.featureName}
                </CardTitle>
                <CardDescription className="mt-0.5">
                  Baseline mean:{' '}
                  <strong className="text-text-primary">{selectedFeature?.baselineMean}</strong> vs.
                  Production mean:{' '}
                  <strong className="text-status-critical">
                    {selectedFeature?.productionMean}
                  </strong>
                </CardDescription>
              </div>
              <Badge variant={selectedFeature?.status} dot className="capitalize text-xs">
                {selectedFeature?.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[260px] w-full rounded-xl" />
            ) : (
              <BaseEChart
                option={distributionOption}
                height={260}
                ariaLabel="Distribution histogram comparison chart"
                exportFileName={`${selectedFeature?.featureName}-distribution`}
              />
            )}
          </CardContent>
        </Card>

        {/* Drift Ranking Leaderboard */}
        <Card>
          <CardHeader>
            <div>
              <CardTitle className="flex items-center gap-2">
                <ArrowUpDown className="h-4 w-4 text-accent-cyan" />
                Ranked Feature Drift Leaderboard
              </CardTitle>
              <CardDescription className="mt-0.5">
                Sorted by Population Stability Index descending
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs" aria-label="Feature Drift Leaderboard">
                <thead className="border-b border-border-subtle bg-bg-elevated/40 text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                  <tr>
                    <th scope="col" className="py-2.5 pl-4 pr-2">
                      Feature
                    </th>
                    <th scope="col" className="px-2 py-2.5">
                      Type
                    </th>
                    <th scope="col" className="px-2 py-2.5 text-right">
                      KS Stat
                    </th>
                    <th scope="col" className="px-2 py-2.5 text-right">
                      PSI Score
                    </th>
                    <th scope="col" className="py-2.5 pl-2 pr-4 text-right">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {driftFeatures.map((feat) => (
                    <tr
                      key={feat.featureName}
                      onClick={() => setSelectedFeatureName(feat.featureName)}
                      className={cn(
                        'hover:bg-bg-elevated/60 transition-colors cursor-pointer',
                        selectedFeatureName === feat.featureName &&
                          'bg-accent-primary/8 font-medium'
                      )}
                    >
                      <td className="py-2.5 pl-4 pr-2 font-mono text-text-primary">
                        {feat.featureName}
                      </td>
                      <td className="px-2 py-2.5">
                        <Badge variant="default" className="text-[10px]">
                          {feat.category}
                        </Badge>
                      </td>
                      <td className="px-2 py-2.5 text-right font-mono tabular-nums text-text-secondary">
                        {feat.ksStat.toFixed(2)}
                      </td>
                      <td className="px-2 py-2.5 text-right font-mono tabular-nums font-bold">
                        <span
                          className={
                            feat.psiScore >= 0.25
                              ? 'text-status-critical'
                              : feat.psiScore >= 0.15
                                ? 'text-status-warning'
                                : 'text-status-healthy'
                          }
                        >
                          {feat.psiScore.toFixed(3)}
                        </span>
                      </td>
                      <td className="py-2.5 pl-2 pr-4 text-right">
                        <Badge variant={feat.status} dot className="capitalize text-[10px]">
                          {feat.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
