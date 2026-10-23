import { useMemo, useState } from 'react';
import type * as echarts from 'echarts';
import { Activity, Flame, Zap } from 'lucide-react';
import { useAppSelector } from '@/app/store';
import { BaseEChart, type AccessibleTableData } from '@/components/charts/BaseEChart';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { formatCompactNumber, formatPercent } from '@/lib/formatters';
import type { TimeSeriesPoint } from '@/types';

interface PerformanceTimeSeriesPanelProps {
  series: TimeSeriesPoint[];
  compareToPrevious?: boolean;
}

type MetricMode = 'throughput' | 'accuracy' | 'tokenVelocity';

export function PerformanceTimeSeriesPanel({
  series,
  compareToPrevious = true,
}: PerformanceTimeSeriesPanelProps) {
  const [metricMode, setMetricMode] = useState<MetricMode>('throughput');
  const resolvedTheme = useAppSelector((state) => state.theme.resolved);

  const chartOption = useMemo<echarts.EChartsOption>(() => {
    if (!series || series.length === 0) return {};

    const dates = series.map((pt) => {
      const d = new Date(pt.timestamp);
      return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:00`;
    });

    let currentData: number[];
    let prevData: number[];
    let unitLabel: string;
    let seriesName: string;
    let prevSeriesName: string;
    let primaryColor: string;
    const prevColor = '#94a3b8';

    if (metricMode === 'throughput') {
      currentData = series.map((pt) => Math.round(pt.requests / 3600)); // Requests per second
      prevData = series.map((pt) => Math.round(pt.prevRequests / 3600));
      unitLabel = 'req/s';
      seriesName = 'Throughput (Current)';
      prevSeriesName = 'Throughput (Prev Period)';
      primaryColor = resolvedTheme === 'dark' ? '#6366f1' : '#4f46e5';
    } else if (metricMode === 'accuracy') {
      currentData = series.map((pt) => pt.accuracyScore);
      prevData = series.map((pt) => pt.prevAccuracyScore);
      unitLabel = '%';
      seriesName = 'Quality / F1 (Current)';
      prevSeriesName = 'Quality / F1 (Prev Period)';
      primaryColor = resolvedTheme === 'dark' ? '#10b981' : '#059669';
    } else {
      currentData = series.map((pt) => pt.tokensPerSec);
      prevData = series.map((pt) => Math.round(pt.tokensPerSec * 0.88));
      unitLabel = 'tok/s';
      seriesName = 'Token Velocity (Current)';
      prevSeriesName = 'Token Velocity (Prev Period)';
      primaryColor = resolvedTheme === 'dark' ? '#06b6d4' : '#0891b2';
    }

    // Mark anomaly dates
    const anomalyPoints = series
      .map((pt, idx) => ({ pt, idx }))
      .filter(({ pt }) => pt.isAnomaly)
      .map(({ pt, idx }) => ({
        name: 'Anomaly Spike',
        coord: [dates[idx] ?? '', currentData[idx] ?? 0],
        value: 'Spike',
        itemStyle: { color: '#f43f5e' },
        tooltip: {
          formatter: `Anomaly Alert: ${pt.anomalyLabel ?? 'Threshold breached'}`,
        },
      }));

    const seriesConfig: echarts.SeriesOption[] = [
      {
        name: seriesName,
        type: 'line',
        data: currentData,
        smooth: 0.3,
        showSymbol: false,
        lineStyle: {
          width: 2.5,
          color: primaryColor,
        },
        itemStyle: {
          color: primaryColor,
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: `${primaryColor}35` },
              { offset: 1, color: `${primaryColor}00` },
            ],
          },
        },
        markPoint:
          anomalyPoints.length > 0
            ? {
                data: anomalyPoints,
                symbol: 'pin',
                symbolSize: 34,
                label: {
                  fontSize: 10,
                  color: '#ffffff',
                },
              }
            : undefined,
      },
    ];

    if (compareToPrevious) {
      seriesConfig.push({
        name: prevSeriesName,
        type: 'line',
        data: prevData,
        smooth: 0.3,
        showSymbol: false,
        lineStyle: {
          width: 1.75,
          type: 'dashed',
          color: prevColor,
        },
        itemStyle: {
          color: prevColor,
        },
      });
    }

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross',
          crossStyle: { color: '#94a3b8' },
        },
        formatter: (params: unknown) => {
          const items = Array.isArray(params) ? params : [params];
          if (items.length === 0) return '';
          const first = items[0] as { axisValue: string };
          let res = `<div class="font-semibold mb-1 text-xs">${first.axisValue}</div>`;

          items.forEach((item: { seriesName: string; value: number; color: string }) => {
            const formattedVal =
              metricMode === 'accuracy'
                ? formatPercent(item.value)
                : `${formatCompactNumber(item.value)} ${unitLabel}`;
            res += `<div class="flex items-center justify-between gap-4 text-xs py-0.5">
              <span class="flex items-center gap-1.5">
                <span class="w-2 h-2 rounded-full inline-block" style="background-color: ${item.color}"></span>
                <span class="text-text-secondary">${item.seriesName}:</span>
              </span>
              <strong class="font-mono tabular-nums text-text-primary">${formattedVal}</strong>
            </div>`;
          });

          return res;
        },
      },
      legend: {
        show: true,
        top: 0,
        right: 80,
        textStyle: {
          fontSize: 11,
          color: resolvedTheme === 'dark' ? '#94a3b8' : '#475569',
        },
      },
      grid: {
        top: 40,
        right: 24,
        bottom: 56,
        left: 20,
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: dates,
        boundaryGap: false,
        axisLine: { lineStyle: { color: resolvedTheme === 'dark' ? '#1e293b' : '#e2e8f0' } },
        axisLabel: {
          fontSize: 10,
          color: resolvedTheme === 'dark' ? '#64748b' : '#94a3b8',
        },
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          fontSize: 10,
          color: resolvedTheme === 'dark' ? '#64748b' : '#94a3b8',
          formatter: (v: number) => (metricMode === 'accuracy' ? `${v}%` : formatCompactNumber(v)),
        },
        splitLine: {
          lineStyle: {
            color: resolvedTheme === 'dark' ? '#1e293b' : '#f1f5f9',
            type: 'dashed',
          },
        },
      },
      dataZoom: [
        {
          type: 'slider',
          show: true,
          bottom: 10,
          height: 18,
          borderColor: 'transparent',
          backgroundColor: resolvedTheme === 'dark' ? '#161f30' : '#f1f5f9',
          fillerColor:
            resolvedTheme === 'dark' ? 'rgba(99, 102, 241, 0.2)' : 'rgba(79, 70, 229, 0.15)',
          handleStyle: { color: primaryColor },
          textStyle: { fontSize: 10, color: '#94a3b8' },
        },
        {
          type: 'inside',
        },
      ],
      series: seriesConfig,
    };
  }, [series, compareToPrevious, metricMode, resolvedTheme]);

  const accessibleTableData = useMemo<AccessibleTableData>(() => {
    return {
      title: 'Performance Time-Series Data Table',
      columns: ['Timestamp', 'Current Value', 'Previous Period Value', 'Anomaly Flag'],
      rows: series.map((pt) => [
        new Date(pt.timestamp).toLocaleDateString(),
        metricMode === 'accuracy'
          ? `${pt.accuracyScore}%`
          : metricMode === 'throughput'
            ? `${Math.round(pt.requests / 3600)} req/s`
            : `${pt.tokensPerSec} tok/s`,
        metricMode === 'accuracy'
          ? `${pt.prevAccuracyScore}%`
          : metricMode === 'throughput'
            ? `${Math.round(pt.prevRequests / 3600)} req/s`
            : `${Math.round(pt.tokensPerSec * 0.88)} tok/s`,
        pt.isAnomaly ? `Spike (${pt.anomalyLabel ?? 'Incident'})` : 'Normal',
      ]),
    };
  }, [series, metricMode]);

  return (
    <Card className="w-full">
      <CardHeader className="flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-accent-primary" />
            Performance & Quality Telemetry
          </CardTitle>
          <CardDescription className="mt-0.5">
            Throughput, evaluation accuracy, and token velocity with interactive brush/zoom and
            anomaly detection
          </CardDescription>
        </div>

        {/* Metric Mode Switcher Buttons */}
        <div className="inline-flex items-center rounded-lg border border-border-default bg-bg-elevated/70 p-0.5 text-xs">
          <button
            type="button"
            onClick={() => setMetricMode('throughput')}
            className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 font-medium transition-colors cursor-pointer ${
              metricMode === 'throughput'
                ? 'bg-bg-surface text-text-primary shadow-xs font-semibold'
                : 'text-text-muted hover:text-text-primary'
            }`}
          >
            <Zap className="h-3 w-3" />
            <span>Throughput RPS</span>
          </button>

          <button
            type="button"
            onClick={() => setMetricMode('accuracy')}
            className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 font-medium transition-colors cursor-pointer ${
              metricMode === 'accuracy'
                ? 'bg-bg-surface text-text-primary shadow-xs font-semibold'
                : 'text-text-muted hover:text-text-primary'
            }`}
          >
            <Activity className="h-3 w-3" />
            <span>Accuracy / Quality</span>
          </button>

          <button
            type="button"
            onClick={() => setMetricMode('tokenVelocity')}
            className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 font-medium transition-colors cursor-pointer ${
              metricMode === 'tokenVelocity'
                ? 'bg-bg-surface text-text-primary shadow-xs font-semibold'
                : 'text-text-muted hover:text-text-primary'
            }`}
          >
            <Flame className="h-3 w-3" />
            <span>Token Velocity</span>
          </button>
        </div>
      </CardHeader>

      <CardContent className="pt-2">
        <BaseEChart
          option={chartOption}
          height={330}
          accessibleTable={accessibleTableData}
          ariaLabel="Performance time-series line chart"
          exportFileName="modelsight-performance-telemetry"
        />
      </CardContent>
    </Card>
  );
}
