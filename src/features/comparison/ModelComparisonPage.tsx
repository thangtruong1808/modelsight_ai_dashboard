import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router';
import type * as echarts from 'echarts';
import { Activity, Scale, X, Zap } from 'lucide-react';
import { BaseEChart } from '@/components/charts/BaseEChart';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { cn } from '@/lib/cn';
import { calculateRadarScores, evaluateBestAndWorst } from '@/lib/comparisonEngine';
import { formatCurrency, formatLatency, formatPercent } from '@/lib/formatters';
import { useGetModelsListQuery } from '@/services/baseApi';
import type { ModelEntity } from '@/types';

const COMPARISON_COLORS = ['#3b82f6', '#06b6d4', '#8b5cf6', '#f59e0b'] as const;

const PRESETS = [
  {
    name: 'Top 3 Enterprise LLMs',
    ids: ['claude-3-7-sonnet-prod', 'gpt-4o-customer-support', 'llama-3-3-70b-rag'],
  },
  {
    name: 'Code & Reasoning Frontier',
    ids: ['claude-3-7-sonnet-prod', 'deepseek-v3-coder', 'mistral-large-2411'],
  },
  {
    name: 'Fraud & Risk Tabular ML',
    ids: ['fraud-xgboost-v4', 'credit-risk-tabular-v3', 'churn-lightgbm-v2'],
  },
];

export default function ModelComparisonPage() {
  const { data: allModels = [] } = useGetModelsListQuery();
  const [searchParams, setSearchParams] = useSearchParams();

  // Active metric tab for overlay time-series
  const [metricTab, setMetricTab] = useState<'latency' | 'errorRate' | 'throughput' | 'accuracy'>(
    'latency'
  );

  // Selected model IDs from URL or default
  const selectedModelIds = useMemo(() => {
    const raw = searchParams.get('models');
    if (!raw) {
      return ['claude-3-7-sonnet-prod', 'gpt-4o-customer-support', 'llama-3-3-70b-rag'];
    }
    return raw.split(',').filter(Boolean);
  }, [searchParams]);

  // Selected Model Entities
  const selectedModels = useMemo(() => {
    if (allModels.length === 0) return [];
    return selectedModelIds
      .map((id) => allModels.find((m) => m.id === id))
      .filter((m): m is ModelEntity => Boolean(m));
  }, [allModels, selectedModelIds]);

  // Models available to add (not yet selected)
  const unselectedModels = useMemo(() => {
    return allModels.filter((m) => !selectedModelIds.includes(m.id));
  }, [allModels, selectedModelIds]);

  // URL sync helpers
  const updateSelectedModelIds = (ids: string[]) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (ids.length > 0) {
        next.set('models', ids.join(','));
      } else {
        next.delete('models');
      }
      return next;
    });
  };

  const handleAddModel = (modelId: string) => {
    if (selectedModelIds.length < 4 && !selectedModelIds.includes(modelId)) {
      updateSelectedModelIds([...selectedModelIds, modelId]);
    }
  };

  const handleRemoveModel = (modelId: string) => {
    updateSelectedModelIds(selectedModelIds.filter((id) => id !== modelId));
  };

  const handleApplyPreset = (ids: string[]) => {
    updateSelectedModelIds(ids);
  };

  // ECharts Option 1: Multi-Series Synchronized Overlay Chart
  const overlayChartOption = useMemo<echarts.EChartsOption>(() => {
    if (selectedModels.length === 0) return {};

    const dates = selectedModels[0]!.timeSeries.slice(-14).map((p) => {
      const d = new Date(p.timestamp);
      return `${d.getMonth() + 1}/${d.getDate()}`;
    });

    const seriesList: echarts.SeriesOption[] = selectedModels.map((model, idx) => {
      const color = COMPARISON_COLORS[idx % COMPARISON_COLORS.length];
      const slice14 = model.timeSeries.slice(-14);

      let data: number[];
      if (metricTab === 'latency') {
        data = slice14.map((p) => p.latencyP95);
      } else if (metricTab === 'errorRate') {
        data = slice14.map((p) => p.errorRate);
      } else if (metricTab === 'throughput') {
        data = slice14.map((p) => Math.round(p.requests / 3600)); // approx RPS
      } else {
        data = slice14.map((p) => p.accuracyScore);
      }

      return {
        name: model.name,
        type: 'line',
        data,
        smooth: 0.3,
        showSymbol: true,
        symbolSize: 6,
        lineStyle: { width: 2.5, color },
        itemStyle: { color },
      };
    });

    const unitMap = {
      latency: 'Latency (ms)',
      errorRate: 'Error Rate (%)',
      throughput: 'Throughput (req/sec)',
      accuracy: 'Eval Accuracy (%)',
    };

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'cross' },
      },
      legend: {
        data: selectedModels.map((m) => m.name),
        top: 0,
        textStyle: { color: 'inherit' },
      },
      grid: {
        top: 36,
        right: 20,
        bottom: 24,
        left: 20,
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: dates,
        boundaryGap: false,
      },
      yAxis: {
        type: 'value',
        name: unitMap[metricTab],
        splitLine: { lineStyle: { type: 'dashed' } },
      },
      series: seriesList,
    };
  }, [selectedModels, metricTab]);

  // ECharts Option 2: 5-Axis Normalized Radar Chart
  const radarChartOption = useMemo<echarts.EChartsOption>(() => {
    if (selectedModels.length === 0) return {};

    const radarData = selectedModels.map((model, idx) => {
      const color = COMPARISON_COLORS[idx % COMPARISON_COLORS.length];
      const s = calculateRadarScores(model);
      return {
        name: model.name,
        value: [s.speed, s.accuracy, s.costEfficiency, s.stability, s.lowDrift],
        lineStyle: { width: 2, color },
        itemStyle: { color },
        areaStyle: {
          color,
          opacity: 0.18,
        },
      };
    });

    return {
      tooltip: {
        trigger: 'item',
      },
      legend: {
        data: selectedModels.map((m) => m.name),
        bottom: 0,
        textStyle: { color: 'inherit', fontSize: 11 },
      },
      radar: {
        indicator: [
          { name: 'Speed (Latency)', max: 100 },
          { name: 'Accuracy (Quality)', max: 100 },
          { name: 'Cost Efficiency', max: 100 },
          { name: 'Stability (Reliability)', max: 100 },
          { name: 'Low Drift (Consistency)', max: 100 },
        ],
        shape: 'polygon',
        splitNumber: 4,
        axisName: {
          color: 'inherit',
          fontSize: 11,
        },
        splitArea: {
          show: true,
          areaStyle: {
            color: ['rgba(255, 255, 255, 0.02)', 'rgba(255, 255, 255, 0.05)'],
          },
        },
      },
      series: [
        {
          type: 'radar',
          data: radarData,
        },
      ],
    };
  }, [selectedModels]);

  // Matrix Row Evaluators
  const evals = useMemo(() => {
    return {
      p50: evaluateBestAndWorst(selectedModels, (m) => m.latencyP50, true),
      p95: evaluateBestAndWorst(selectedModels, (m) => m.latencyP95, true),
      p99: evaluateBestAndWorst(selectedModels, (m) => m.latencyP99, true),
      success: evaluateBestAndWorst(selectedModels, (m) => m.successRate, false),
      error: evaluateBestAndWorst(selectedModels, (m) => m.errorRate, true),
      accuracy: evaluateBestAndWorst(selectedModels, (m) => m.accuracyScore, false),
      groundedness: evaluateBestAndWorst(
        selectedModels,
        (m) => m.qualityScores.groundedness,
        false
      ),
      cost: evaluateBestAndWorst(
        selectedModels,
        (m) => (m.requests24h > 0 ? (m.cost24hUsd / m.requests24h) * 1000 : 0),
        true
      ),
      cost24h: evaluateBestAndWorst(selectedModels, (m) => m.cost24hUsd, true),
      cacheHit: evaluateBestAndWorst(
        selectedModels,
        (m) => (m.inputTokens24h > 0 ? (m.cachedTokens24h / m.inputTokens24h) * 100 : 0),
        false
      ),
      drift: evaluateBestAndWorst(selectedModels, (m) => m.driftPsi, true),
    };
  }, [selectedModels]);

  const renderCellHighlight = (
    evalObj: Record<string, { best: boolean; worst: boolean }>,
    modelId: string,
    formattedValue: string | React.ReactNode
  ) => {
    const isBest = evalObj[modelId]?.best;
    const isWorst = evalObj[modelId]?.worst;

    return (
      <div className="flex items-center justify-end gap-1.5 font-mono">
        <span
          className={cn(
            'px-1.5 py-0.5 rounded text-xs tabular-nums',
            isBest &&
              'bg-status-healthy/15 text-status-healthy font-bold ring-1 ring-status-healthy/40',
            isWorst &&
              'bg-status-critical/15 text-status-critical font-bold ring-1 ring-status-critical/40',
            !isBest && !isWorst && 'text-text-primary'
          )}
        >
          {formattedValue}
        </span>
        {isBest && (
          <span
            className="text-[10px] font-bold text-status-healthy"
            title="Best across compared models"
          >
            ★ Best
          </span>
        )}
        {isWorst && (
          <span
            className="text-[10px] font-bold text-status-critical"
            title="Worst across compared models"
          >
            ▼ Worst
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col justify-between gap-4 border-b border-border-default pb-5 lg:flex-row lg:items-center">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="indigo">Side-by-Side Model Benchmarking</Badge>
            <Badge variant="outline">2 to 4 Models Evaluated</Badge>
          </div>
          <h1 className="mt-2 text-xl font-bold tracking-tight text-text-primary sm:text-2xl">
            Model Comparison Matrix
          </h1>
          <p className="mt-1 text-xs text-text-secondary sm:text-sm">
            Head-to-head evaluation of inference latency, error rates, quality evaluations, and unit
            economics with automatic best/worst highlighting
          </p>
        </div>

        {/* Presets Switcher */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-text-muted">Quick Presets:</span>
          {PRESETS.map((preset) => (
            <button
              key={preset.name}
              type="button"
              onClick={() => handleApplyPreset(preset.ids)}
              className="rounded-md border border-border-default bg-bg-surface px-2.5 py-1 text-xs text-text-secondary hover:text-text-primary hover:bg-bg-elevated transition-colors cursor-pointer"
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>

      {/* Model Selector Bar */}
      <Card className="p-4 border-border-default bg-bg-surface space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Scale className="h-4 w-4 text-accent-primary" />
            <span className="text-xs font-semibold text-text-primary">
              Compared Models ({selectedModels.length} of 4 max)
            </span>
            <span className="text-[11px] text-text-muted font-mono">
              (URL synced: <code className="text-accent-cyan">?models=...</code>)
            </span>
          </div>

          {/* Add Model Dropdown */}
          {selectedModels.length < 4 && unselectedModels.length > 0 && (
            <div className="flex items-center gap-2">
              <select
                defaultValue=""
                onChange={(e) => {
                  if (e.target.value) {
                    handleAddModel(e.target.value);
                    e.target.value = '';
                  }
                }}
                className="rounded-md border border-border-default bg-bg-base px-2.5 py-1.5 text-xs text-text-primary focus:border-accent-primary focus:outline-none cursor-pointer"
              >
                <option value="" disabled>
                  + Add Model to Comparison...
                </option>
                {unselectedModels.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.displayName} ({m.team})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Selected Model Chips */}
        <div className="flex flex-wrap items-center gap-2">
          {selectedModels.map((model, idx) => {
            const color = COMPARISON_COLORS[idx % COMPARISON_COLORS.length];
            return (
              <div
                key={model.id}
                className="flex items-center gap-2 rounded-lg border border-border-default bg-bg-base px-3 py-1.5 text-xs shadow-xs"
              >
                <span
                  style={{ backgroundColor: color }}
                  className="h-2.5 w-2.5 rounded-full shrink-0"
                />
                <span className="font-semibold text-text-primary">{model.displayName}</span>
                <Badge variant="outline" className="text-[10px]">
                  {model.environment}
                </Badge>
                {selectedModels.length > 2 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveModel(model.id)}
                    className="text-text-muted hover:text-status-critical transition-colors cursor-pointer ml-1"
                    aria-label={`Remove ${model.name}`}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Main Visualizations: Multi-Series Synchronized Time-Series & 5-Axis Radar Chart */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Synchronized Multi-Series Overlay Chart (2 Cols) */}
        <Card className="border-border-default bg-bg-surface lg:col-span-2">
          <CardHeader className="pb-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Activity className="h-4 w-4 text-accent-primary" />
                <span>Multi-Series Telemetry Overlay</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Synchronized historical metric curves over the past 14 days
              </CardDescription>
            </div>

            {/* Metric Tab Selector */}
            <div className="inline-flex items-center rounded-lg border border-border-default bg-bg-base p-1 text-xs">
              {(
                [
                  { id: 'latency', label: 'Tail Latency' },
                  { id: 'errorRate', label: 'Error Rate' },
                  { id: 'throughput', label: 'Throughput' },
                  { id: 'accuracy', label: 'Accuracy' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setMetricTab(tab.id)}
                  className={cn(
                    'rounded px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer',
                    metricTab === tab.id
                      ? 'bg-accent-primary text-white shadow-xs'
                      : 'text-text-secondary hover:text-text-primary'
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            <BaseEChart
              option={overlayChartOption}
              height={300}
              exportFileName={`modelsight-comparison-${metricTab}`}
              ariaLabel="Multi-series synchronized comparison chart"
            />
          </CardContent>
        </Card>

        {/* 5-Axis Radar Chart (1 Col) */}
        <Card className="border-border-default bg-bg-surface lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Zap className="h-4 w-4 text-accent-cyan" />
              <span>Multi-Dimensional Radar Profile</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Normalized 0-100 radar scores across 5 core operational dimensions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <BaseEChart
              option={radarChartOption}
              height={300}
              exportFileName="modelsight-comparison-radar"
              ariaLabel="Radar chart showing normalized model operational dimensions"
            />
          </CardContent>
        </Card>
      </div>

      {/* Side-by-Side Comparison Matrix Table */}
      <Card className="border-border-default bg-bg-surface overflow-hidden">
        <CardHeader className="pb-3 border-b border-border-subtle flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <span>Comprehensive Metric Comparison Matrix</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Side-by-side performance, reliability, quality, and FinOps unit economics with
              automatic best/worst highlighting
            </CardDescription>
          </div>

          {/* Highlighting Legend */}
          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="flex items-center gap-1.5 text-status-healthy font-semibold">
              <span className="h-2 w-2 rounded-full bg-status-healthy" />★ Best in Row
            </span>
            <span className="flex items-center gap-1.5 text-status-critical font-semibold">
              <span className="h-2 w-2 rounded-full bg-status-critical" />▼ Worst in Row
            </span>
          </div>
        </CardHeader>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-bg-elevated text-text-secondary border-b border-border-default font-semibold text-[11px]">
              <tr>
                <th className="py-3 pl-4 pr-3 w-1/4">Evaluation Metric</th>
                {selectedModels.map((model, idx) => (
                  <th key={model.id} className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <span
                        style={{
                          backgroundColor: COMPARISON_COLORS[idx % COMPARISON_COLORS.length],
                        }}
                        className="h-2 w-2 rounded-full"
                      />
                      <span className="font-sans font-bold text-text-primary text-xs truncate max-w-[160px]">
                        {model.displayName}
                      </span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {/* Category 1: Infrastructure & Metadata */}
              <tr className="bg-bg-base/60">
                <td
                  colSpan={selectedModels.length + 1}
                  className="py-1.5 pl-4 pr-3 text-[10px] font-bold uppercase tracking-wider text-text-muted"
                >
                  1. Model Architecture & Deployment
                </td>
              </tr>
              <tr>
                <td className="py-2.5 pl-4 pr-3 text-text-secondary">Provider & Framework</td>
                {selectedModels.map((m) => (
                  <td key={m.id} className="px-4 py-2.5 text-right font-sans text-text-primary">
                    {m.provider} / {m.framework}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-2.5 pl-4 pr-3 text-text-secondary">Environment & Team</td>
                {selectedModels.map((m) => (
                  <td key={m.id} className="px-4 py-2.5 text-right font-sans text-text-primary">
                    <span className="capitalize">{m.environment}</span> ({m.team})
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-2.5 pl-4 pr-3 text-text-secondary">Active Release Version</td>
                {selectedModels.map((m) => (
                  <td
                    key={m.id}
                    className="px-4 py-2.5 text-right font-mono text-[11px] text-text-primary"
                  >
                    {m.activeVersion}
                  </td>
                ))}
              </tr>

              {/* Category 2: Latency & Speed */}
              <tr className="bg-bg-base/60">
                <td
                  colSpan={selectedModels.length + 1}
                  className="py-1.5 pl-4 pr-3 text-[10px] font-bold uppercase tracking-wider text-text-muted"
                >
                  2. Latency & Response Speed
                </td>
              </tr>
              <tr>
                <td className="py-2.5 pl-4 pr-3 text-text-secondary">Median Latency (p50)</td>
                {selectedModels.map((m) => (
                  <td key={m.id} className="px-4 py-2.5 text-right">
                    {renderCellHighlight(evals.p50, m.id, formatLatency(m.latencyP50))}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-2.5 pl-4 pr-3 text-text-secondary">Tail Latency (p95)</td>
                {selectedModels.map((m) => (
                  <td key={m.id} className="px-4 py-2.5 text-right">
                    {renderCellHighlight(evals.p95, m.id, formatLatency(m.latencyP95))}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-2.5 pl-4 pr-3 text-text-secondary">Outlier Latency (p99)</td>
                {selectedModels.map((m) => (
                  <td key={m.id} className="px-4 py-2.5 text-right">
                    {renderCellHighlight(evals.p99, m.id, formatLatency(m.latencyP99))}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-2.5 pl-4 pr-3 text-text-secondary">Configured Latency SLA</td>
                {selectedModels.map((m) => (
                  <td key={m.id} className="px-4 py-2.5 text-right font-mono text-text-muted">
                    {m.slaLatencyMs}ms
                  </td>
                ))}
              </tr>

              {/* Category 3: Reliability & Availability */}
              <tr className="bg-bg-base/60">
                <td
                  colSpan={selectedModels.length + 1}
                  className="py-1.5 pl-4 pr-3 text-[10px] font-bold uppercase tracking-wider text-text-muted"
                >
                  3. Reliability & Availability
                </td>
              </tr>
              <tr>
                <td className="py-2.5 pl-4 pr-3 text-text-secondary">Inference Success Rate</td>
                {selectedModels.map((m) => (
                  <td key={m.id} className="px-4 py-2.5 text-right">
                    {renderCellHighlight(evals.success, m.id, formatPercent(m.successRate))}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-2.5 pl-4 pr-3 text-text-secondary">Inference Error Rate</td>
                {selectedModels.map((m) => (
                  <td key={m.id} className="px-4 py-2.5 text-right">
                    {renderCellHighlight(evals.error, m.id, formatPercent(m.errorRate))}
                  </td>
                ))}
              </tr>

              {/* Category 4: Model Quality & Safety */}
              <tr className="bg-bg-base/60">
                <td
                  colSpan={selectedModels.length + 1}
                  className="py-1.5 pl-4 pr-3 text-[10px] font-bold uppercase tracking-wider text-text-muted"
                >
                  4. Evaluation Quality & Safety
                </td>
              </tr>
              <tr>
                <td className="py-2.5 pl-4 pr-3 text-text-secondary">Overall Evaluation Score</td>
                {selectedModels.map((m) => (
                  <td key={m.id} className="px-4 py-2.5 text-right">
                    {renderCellHighlight(evals.accuracy, m.id, `${m.accuracyScore.toFixed(1)}%`)}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-2.5 pl-4 pr-3 text-text-secondary">Groundedness Score</td>
                {selectedModels.map((m) => (
                  <td key={m.id} className="px-4 py-2.5 text-right">
                    {renderCellHighlight(
                      evals.groundedness,
                      m.id,
                      `${m.qualityScores.groundedness}%`
                    )}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-2.5 pl-4 pr-3 text-text-secondary">Guardrail Safety Pass Rate</td>
                {selectedModels.map((m) => (
                  <td key={m.id} className="px-4 py-2.5 text-right font-mono text-text-primary">
                    {m.qualityScores.safetyRate}%
                  </td>
                ))}
              </tr>

              {/* Category 5: Economics & FinOps */}
              <tr className="bg-bg-base/60">
                <td
                  colSpan={selectedModels.length + 1}
                  className="py-1.5 pl-4 pr-3 text-[10px] font-bold uppercase tracking-wider text-text-muted"
                >
                  5. Cost & Token Economics
                </td>
              </tr>
              <tr>
                <td className="py-2.5 pl-4 pr-3 text-text-secondary">Unit Cost / 1k Requests</td>
                {selectedModels.map((m) => {
                  const costPer1k = m.requests24h > 0 ? (m.cost24hUsd / m.requests24h) * 1000 : 0;
                  return (
                    <td key={m.id} className="px-4 py-2.5 text-right">
                      {renderCellHighlight(evals.cost, m.id, formatCurrency(costPer1k, 3))}
                    </td>
                  );
                })}
              </tr>
              <tr>
                <td className="py-2.5 pl-4 pr-3 text-text-secondary">Daily Compute Spend (24h)</td>
                {selectedModels.map((m) => (
                  <td key={m.id} className="px-4 py-2.5 text-right">
                    {renderCellHighlight(evals.cost24h, m.id, formatCurrency(m.cost24hUsd))}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-2.5 pl-4 pr-3 text-text-secondary">Prompt Cache Hit Rate</td>
                {selectedModels.map((m) => {
                  const hitPct =
                    m.inputTokens24h > 0 ? (m.cachedTokens24h / m.inputTokens24h) * 100 : 0;
                  return (
                    <td key={m.id} className="px-4 py-2.5 text-right">
                      {renderCellHighlight(evals.cacheHit, m.id, `${hitPct.toFixed(0)}%`)}
                    </td>
                  );
                })}
              </tr>

              {/* Category 6: Stability & Data Drift */}
              <tr className="bg-bg-base/60">
                <td
                  colSpan={selectedModels.length + 1}
                  className="py-1.5 pl-4 pr-3 text-[10px] font-bold uppercase tracking-wider text-text-muted"
                >
                  6. Stability & Data Drift
                </td>
              </tr>
              <tr>
                <td className="py-2.5 pl-4 pr-3 text-text-secondary">Feature PSI Drift Score</td>
                {selectedModels.map((m) => (
                  <td key={m.id} className="px-4 py-2.5 text-right">
                    {renderCellHighlight(evals.drift, m.id, m.driftPsi.toFixed(3))}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
