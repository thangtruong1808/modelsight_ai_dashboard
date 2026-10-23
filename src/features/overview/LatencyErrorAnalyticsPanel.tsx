import { useMemo } from 'react';
import type * as echarts from 'echarts';
import { Clock, ShieldAlert } from 'lucide-react';
import { useAppSelector } from '@/app/store';
import { BaseEChart, type AccessibleTableData } from '@/components/charts/BaseEChart';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { formatCompactNumber, formatLatency } from '@/lib/formatters';
import type { ErrorBreakdownItem, TimeSeriesPoint } from '@/types';

interface LatencyErrorAnalyticsPanelProps {
  series: TimeSeriesPoint[];
  errorBreakdown: ErrorBreakdownItem[];
  slaThresholdMs?: number;
}

export function LatencyErrorAnalyticsPanel({
  series,
  errorBreakdown,
  slaThresholdMs = 450,
}: LatencyErrorAnalyticsPanelProps) {
  const resolvedTheme = useAppSelector((state) => state.theme.resolved);

  // 1. Percentile Bands Chart Option (p50, p95, p99 + SLA markLine)
  const latencyOption = useMemo<echarts.EChartsOption>(() => {
    if (!series || series.length === 0) return {};

    const dates = series.map((pt) => {
      const d = new Date(pt.timestamp);
      return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:00`;
    });

    const p50Data = series.map((pt) => pt.latencyP50);
    const p95Data = series.map((pt) => pt.latencyP95);
    const p99Data = series.map((pt) => pt.latencyP99);

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'line' },
        formatter: (params: unknown) => {
          const items = Array.isArray(params) ? params : [params];
          if (items.length === 0) return '';
          const first = items[0] as { axisValue: string };
          let res = `<div class="font-semibold mb-1 text-xs">${first.axisValue}</div>`;

          items.forEach((item: { seriesName: string; value: number; color: string }) => {
            res += `<div class="flex items-center justify-between gap-4 text-xs py-0.5">
              <span class="flex items-center gap-1.5">
                <span class="w-2 h-2 rounded-full inline-block" style="background-color: ${item.color}"></span>
                <span class="text-text-secondary">${item.seriesName}:</span>
              </span>
              <strong class="font-mono tabular-nums text-text-primary">${formatLatency(item.value)}</strong>
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
        top: 36,
        right: 20,
        bottom: 24,
        left: 16,
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
          formatter: (v: number) => `${v}ms`,
        },
        splitLine: {
          lineStyle: {
            color: resolvedTheme === 'dark' ? '#1e293b' : '#f1f5f9',
            type: 'dashed',
          },
        },
      },
      series: [
        {
          name: 'p50 Median',
          type: 'line',
          data: p50Data,
          smooth: 0.3,
          showSymbol: false,
          lineStyle: { width: 1.5, color: '#38bdf8' },
          itemStyle: { color: '#38bdf8' },
        },
        {
          name: 'p95 Tail',
          type: 'line',
          data: p95Data,
          smooth: 0.3,
          showSymbol: false,
          lineStyle: { width: 2, color: '#6366f1' },
          itemStyle: { color: '#6366f1' },
          markLine: {
            symbol: 'none',
            data: [
              {
                yAxis: slaThresholdMs,
                name: 'SLA Limit',
                lineStyle: { color: '#f43f5e', type: 'dashed', width: 1.5 },
                label: {
                  formatter: `SLA Target (${slaThresholdMs}ms)`,
                  position: 'insideEndTop',
                  fontSize: 10,
                  color: '#f43f5e',
                },
              },
            ],
          },
        },
        {
          name: 'p99 Peak',
          type: 'line',
          data: p99Data,
          smooth: 0.3,
          showSymbol: false,
          lineStyle: { width: 1.5, color: '#f59e0b' },
          itemStyle: { color: '#f59e0b' },
        },
      ],
    };
  }, [series, slaThresholdMs, resolvedTheme]);

  // 2. Error Breakdown Donut Option
  const errorOption = useMemo<echarts.EChartsOption>(() => {
    return {
      tooltip: {
        trigger: 'item',
        formatter: (params: unknown) => {
          const item = params as { name: string; value: number; percent: number; color: string };
          return `<div class="text-xs">
            <div class="font-semibold mb-1">${item.name}</div>
            <div class="flex items-center justify-between gap-4">
              <span>Count:</span>
              <strong class="font-mono tabular-nums">${formatCompactNumber(item.value)}</strong>
            </div>
            <div class="flex items-center justify-between gap-4 mt-0.5">
              <span>Proportion:</span>
              <strong class="font-mono tabular-nums">${item.percent}%</strong>
            </div>
          </div>`;
        },
      },
      legend: {
        orient: 'vertical',
        right: 12,
        top: 'center',
        itemWidth: 10,
        itemHeight: 10,
        textStyle: {
          fontSize: 11,
          color: resolvedTheme === 'dark' ? '#94a3b8' : '#475569',
        },
      },
      series: [
        {
          name: 'Error Classification',
          type: 'pie',
          radius: ['45%', '72%'],
          center: ['35%', '50%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 6,
            borderColor: resolvedTheme === 'dark' ? '#0f1623' : '#ffffff',
            borderWidth: 2,
          },
          label: {
            show: false,
          },
          emphasis: {
            label: {
              show: false,
            },
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)',
            },
          },
          data: errorBreakdown.map((item) => ({
            value: item.count,
            name: item.label,
            itemStyle: { color: item.color },
          })),
        },
      ],
    };
  }, [errorBreakdown, resolvedTheme]);

  const latencyTableData = useMemo<AccessibleTableData>(() => {
    return {
      title: 'Latency Percentile Distribution Data',
      columns: ['Timestamp', 'p50 Median', 'p95 Tail Latency', 'p99 Peak Latency'],
      rows: series.map((pt) => [
        new Date(pt.timestamp).toLocaleDateString(),
        `${pt.latencyP50}ms`,
        `${pt.latencyP95}ms`,
        `${pt.latencyP99}ms`,
      ]),
    };
  }, [series]);

  const errorTableData = useMemo<AccessibleTableData>(() => {
    return {
      title: 'Inference Failure Taxonomy Table',
      columns: ['Failure Type', 'Incident Count', 'Percentage of Total'],
      rows: errorBreakdown.map((item) => [
        item.label,
        formatCompactNumber(item.count),
        `${item.percentage}%`,
      ]),
    };
  }, [errorBreakdown]);

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {/* Latency Percentiles Card */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-accent-cyan" />
              Tail Latency Distribution (p50 / p95 / p99)
            </CardTitle>
            <CardDescription className="mt-0.5">
              Multi-percentile latency bands with automated SLA boundary detection
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="pt-2">
          <BaseEChart
            option={latencyOption}
            height={280}
            accessibleTable={latencyTableData}
            ariaLabel="Latency percentiles multi-series line chart"
            exportFileName="modelsight-latency-percentiles"
          />
        </CardContent>
      </Card>

      {/* Error Taxonomy Donut Card */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle className="flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-status-warning" />
              Inference Failure Taxonomy
            </CardTitle>
            <CardDescription className="mt-0.5">
              Distribution of 429 rate limits, context timeouts, and guardrail blocks
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="pt-2">
          <BaseEChart
            option={errorOption}
            height={280}
            accessibleTable={errorTableData}
            ariaLabel="Error distribution donut chart"
            exportFileName="modelsight-error-taxonomy"
          />
        </CardContent>
      </Card>
    </div>
  );
}
