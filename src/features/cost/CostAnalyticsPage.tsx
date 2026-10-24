import { useMemo, useState } from 'react';
import type * as echarts from 'echarts';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Coins,
  Cpu,
  DollarSign,
  Lightbulb,
  PieChart,
  Sparkles,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react';
import { BaseEChart } from '@/components/charts/BaseEChart';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { cn } from '@/lib/cn';
import { calculateBudgetProjection } from '@/lib/comparisonEngine';
import { formatCompactNumber, formatCurrency, formatNumber } from '@/lib/formatters';
import { useGetModelsListQuery } from '@/services/baseApi';

export default function CostAnalyticsPage() {
  const { data: models = [] } = useGetModelsListQuery();

  const [timeHorizon, setTimeHorizon] = useState<'7d' | '14d' | '30d'>('30d');
  const [groupBy, setGroupBy] = useState<'team' | 'model'>('team');

  const daysCount = timeHorizon === '7d' ? 7 : timeHorizon === '14d' ? 14 : 30;

  // Extract engineering teams and model categories
  const teams = useMemo(() => {
    const set = new Set<string>();
    for (const m of models) set.add(m.team);
    return Array.from(set);
  }, [models]);

  // Daily spend calculation across all models for the selected horizon
  const dailyCosts = useMemo(() => {
    if (models.length === 0) return Array.from({ length: daysCount }, () => 1400);

    const firstModelSeries = models[0]!.timeSeries;
    const seriesSlice = firstModelSeries.slice(-daysCount);

    return seriesSlice.map((_, dayIdx) => {
      const actualIdx = firstModelSeries.length - daysCount + dayIdx;
      return models.reduce((acc, m) => {
        const pt = m.timeSeries[actualIdx];
        return acc + (pt ? pt.costUsd : 0);
      }, 0);
    });
  }, [models, daysCount]);

  // Dates labels for charts
  const dateLabels = useMemo(() => {
    if (models.length === 0) return [];
    return models[0]!.timeSeries.slice(-daysCount).map((p) => {
      const d = new Date(p.timestamp);
      return `${d.getMonth() + 1}/${d.getDate()}`;
    });
  }, [models, daysCount]);

  // FinOps budget projections
  const projection = useMemo(() => {
    return calculateBudgetProjection(dailyCosts, 65000, 30);
  }, [dailyCosts]);

  // Total tokens breakdown across fleet
  const tokenStats = useMemo(() => {
    const input = models.reduce((acc, m) => acc + m.inputTokens24h * daysCount, 0);
    const output = models.reduce((acc, m) => acc + m.outputTokens24h * daysCount, 0);
    const cached = models.reduce((acc, m) => acc + m.cachedTokens24h * daysCount, 0);
    const total = input + output;
    const cacheHitPct = input > 0 ? (cached / input) * 100 : 0;
    const estimatedSavings = (cached / 1000) * 0.0035; // ~$0.0035 per 1k cached tokens

    return { input, output, cached, total, cacheHitPct, estimatedSavings };
  }, [models, daysCount]);

  // Average cost per 1k requests across all models
  const avgCostPer1k = useMemo(() => {
    const totalCost = dailyCosts.reduce((acc, c) => acc + c, 0);
    const totalReq = models.reduce((acc, m) => {
      const slice = m.timeSeries.slice(-daysCount);
      return acc + slice.reduce((s, p) => s + p.requests, 0);
    }, 0);
    return totalReq > 0 ? (totalCost / totalReq) * 1000 : 3.85;
  }, [dailyCosts, models, daysCount]);

  // ECharts Option 1: Stacked Spend Breakdown (By Team or By Model)
  const spendBreakdownOption = useMemo<echarts.EChartsOption>(() => {
    const seriesList: echarts.SeriesOption[] = [];

    if (groupBy === 'team') {
      const teamColors: Record<string, string> = {
        'Core AI': '#6366f1',
        'Customer Experience': '#06b6d4',
        'Risk & Fraud': '#f59e0b',
        'Search & Growth': '#10b981',
        'Platform Infra': '#8b5cf6',
      };

      for (const team of teams) {
        const teamModels = models.filter((m) => m.team === team);
        const data = dateLabels.map((_, dayIdx) => {
          const actualIdx = (models[0]?.timeSeries.length ?? 30) - daysCount + dayIdx;
          const sum = teamModels.reduce((acc, m) => {
            const pt = m.timeSeries[actualIdx];
            return acc + (pt ? pt.costUsd : 0);
          }, 0);
          return Number(sum.toFixed(2));
        });

        seriesList.push({
          name: team,
          type: 'bar',
          stack: 'total',
          data,
          itemStyle: { color: teamColors[team] ?? '#3b82f6' },
        });
      }
    } else {
      // By Model (Top 6 models + Others)
      const sortedByCost = [...models].sort((a, b) => b.cost24hUsd - a.cost24hUsd);
      const topModels = sortedByCost.slice(0, 6);
      const otherModels = sortedByCost.slice(6);

      for (const model of topModels) {
        const data = model.timeSeries.slice(-daysCount).map((p) => Number(p.costUsd.toFixed(2)));
        seriesList.push({
          name: model.name,
          type: 'bar',
          stack: 'total',
          data,
        });
      }

      if (otherModels.length > 0) {
        const othersData = dateLabels.map((_, dayIdx) => {
          const actualIdx = (models[0]?.timeSeries.length ?? 30) - daysCount + dayIdx;
          const sum = otherModels.reduce((acc, m) => {
            const pt = m.timeSeries[actualIdx];
            return acc + (pt ? pt.costUsd : 0);
          }, 0);
          return Number(sum.toFixed(2));
        });

        seriesList.push({
          name: 'Other Models (8)',
          type: 'bar',
          stack: 'total',
          data: othersData,
        });
      }
    }

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        valueFormatter: (value) => `$${Number(value).toFixed(2)}`,
      },
      legend: {
        type: 'scroll',
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
        data: dateLabels,
        boundaryGap: true,
      },
      yAxis: {
        type: 'value',
        name: 'Spend (USD)',
        splitLine: { lineStyle: { type: 'dashed' } },
        axisLabel: { formatter: (v: number) => `$${v}` },
      },
      series: seriesList,
    };
  }, [groupBy, teams, models, dateLabels, daysCount]);

  // ECharts Option 2: Budget Burn-Up & Month-End Forecast Chart
  const budgetBurnupOption = useMemo<echarts.EChartsOption>(() => {
    // Generate cumulative curve
    let cumulative = 0;
    const cumulativeData: number[] = [];
    for (const c of dailyCosts) {
      cumulative += c;
      cumulativeData.push(Number(cumulative.toFixed(2)));
    }

    // Extended 30-day timeline with forecast projections
    const full30Labels: string[] = [...dateLabels];
    const forecastData: (number | null)[] = new Array(dailyCosts.length - 1).fill(null);
    forecastData.push(cumulativeData[cumulativeData.length - 1] ?? null);

    const daysRemaining = 30 - dailyCosts.length;
    let forecastCum = cumulative;
    for (let i = 1; i <= daysRemaining; i++) {
      full30Labels.push(`Day ${dailyCosts.length + i}`);
      forecastCum += projection.dailyBurnRate;
      forecastData.push(Number(forecastCum.toFixed(2)));
    }

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'line' },
        valueFormatter: (value) => (value ? `$${Number(value).toFixed(2)}` : '--'),
      },
      legend: {
        data: ['Actual Spend (Cumulative)', 'Projected Month-End Forecast', 'Monthly Budget Limit'],
        top: 0,
        textStyle: { color: 'inherit' },
      },
      grid: {
        top: 36,
        right: 24,
        bottom: 24,
        left: 20,
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: full30Labels,
        boundaryGap: false,
      },
      yAxis: {
        type: 'value',
        name: 'Cumulative USD',
        splitLine: { lineStyle: { type: 'dashed' } },
        axisLabel: { formatter: (v: number) => `$${formatCompactNumber(v)}` },
      },
      series: [
        {
          name: 'Actual Spend (Cumulative)',
          type: 'line',
          data: cumulativeData,
          smooth: 0.2,
          lineStyle: { width: 2.5, color: '#3b82f6' },
          itemStyle: { color: '#3b82f6' },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(59, 130, 246, 0.2)' },
                { offset: 1, color: 'rgba(59, 130, 246, 0.01)' },
              ],
            },
          },
        },
        {
          name: 'Projected Month-End Forecast',
          type: 'line',
          data: forecastData,
          smooth: 0.2,
          lineStyle: { width: 2, color: '#f59e0b', type: 'dashed' },
          itemStyle: { color: '#f59e0b' },
          markLine: {
            symbol: 'none',
            data: [
              {
                yAxis: projection.monthlyBudget,
                name: 'Monthly Budget Limit',
                lineStyle: { color: '#f43f5e', type: 'dashed', width: 2 },
                label: {
                  formatter: `Budget: $${formatCompactNumber(projection.monthlyBudget)}`,
                  position: 'insideEndTop',
                  color: '#f43f5e',
                },
              },
            ],
          },
        },
      ],
    };
  }, [dailyCosts, dateLabels, projection]);

  // ECharts Option 3: Token Distribution Donut Chart
  const tokenDonutOption = useMemo<echarts.EChartsOption>(() => {
    return {
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c} tokens ({d}%)',
      },
      legend: {
        orient: 'vertical',
        right: 10,
        top: 'center',
        textStyle: { color: 'inherit', fontSize: 11 },
      },
      series: [
        {
          name: 'Token Breakdown',
          type: 'pie',
          radius: ['52%', '78%'],
          center: ['38%', '50%'],
          avoidLabelOverlap: false,
          label: { show: false },
          emphasis: {
            label: {
              show: true,
              fontSize: 12,
              fontWeight: 'bold',
            },
          },
          data: [
            {
              value: tokenStats.input,
              name: 'Prompt Tokens (Input)',
              itemStyle: { color: '#3b82f6' },
            },
            {
              value: tokenStats.output,
              name: 'Completion Tokens (Output)',
              itemStyle: { color: '#8b5cf6' },
            },
            {
              value: tokenStats.cached,
              name: 'Cached Prompt Tokens',
              itemStyle: { color: '#10b981' },
            },
          ],
        },
      ],
    };
  }, [tokenStats]);

  // Sorted models for cost leaderboard table
  const sortedModels = useMemo(() => {
    const totalFleetCost = models.reduce((acc, m) => acc + m.cost24hUsd, 0);
    return [...models]
      .sort((a, b) => b.cost24hUsd - a.cost24hUsd)
      .map((model) => {
        const costPer1k = model.requests24h > 0 ? (model.cost24hUsd / model.requests24h) * 1000 : 0;
        const budgetSharePct = totalFleetCost > 0 ? (model.cost24hUsd / totalFleetCost) * 100 : 0;
        return {
          ...model,
          costPer1k,
          budgetSharePct,
        };
      });
  }, [models]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col justify-between gap-4 border-b border-border-default pb-5 lg:flex-row lg:items-center">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="indigo">FinOps & AI Unit Economics</Badge>
            <Badge variant="outline">Enterprise Cost Governance</Badge>
          </div>
          <h1 className="mt-2 text-xl font-bold tracking-tight text-text-primary sm:text-2xl">
            Cost & Token Usage Analytics
          </h1>
          <p className="mt-1 text-xs text-text-secondary sm:text-sm">
            Observe compute spend, token distribution, prompt caching efficiency, and monthly budget
            burn-up forecasts
          </p>
        </div>

        {/* Filters: Time Horizon & Grouping */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Time Horizon */}
          <div className="inline-flex items-center rounded-lg border border-border-default bg-bg-surface p-1 text-xs">
            {(['7d', '14d', '30d'] as const).map((range) => (
              <button
                key={range}
                type="button"
                onClick={() => setTimeHorizon(range)}
                className={cn(
                  'rounded px-2.5 py-1 text-xs font-mono font-medium transition-colors cursor-pointer',
                  timeHorizon === range
                    ? 'bg-accent-primary text-white shadow-xs'
                    : 'text-text-secondary hover:text-text-primary'
                )}
              >
                {range}
              </button>
            ))}
          </div>

          {/* Group By Selector */}
          <div className="inline-flex items-center rounded-lg border border-border-default bg-bg-surface p-1 text-xs">
            <button
              type="button"
              onClick={() => setGroupBy('team')}
              className={cn(
                'rounded px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer flex items-center gap-1',
                groupBy === 'team'
                  ? 'bg-accent-primary text-white shadow-xs'
                  : 'text-text-secondary hover:text-text-primary'
              )}
            >
              <Users className="h-3 w-3" />
              <span>By Team</span>
            </button>
            <button
              type="button"
              onClick={() => setGroupBy('model')}
              className={cn(
                'rounded px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer flex items-center gap-1',
                groupBy === 'model'
                  ? 'bg-accent-primary text-white shadow-xs'
                  : 'text-text-secondary hover:text-text-primary'
              )}
            >
              <Cpu className="h-3 w-3" />
              <span>By Model</span>
            </button>
          </div>
        </div>
      </div>

      {/* FinOps KPI Summary Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Month Spend & Budget Utilization */}
        <Card className="p-4 border-border-default bg-bg-surface space-y-3">
          <div className="flex items-center justify-between text-xs text-text-muted">
            <span>Spend / Monthly Budget</span>
            <DollarSign className="h-4 w-4 text-accent-primary" />
          </div>

          <div className="space-y-1">
            <div className="flex items-baseline justify-between">
              <strong className="text-2xl font-bold font-mono text-text-primary tabular-nums">
                {formatCurrency(projection.currentSpend)}
              </strong>
              <span className="text-xs font-mono text-text-muted">
                / {formatCurrency(projection.monthlyBudget)}
              </span>
            </div>

            {/* Progress bar */}
            <div className="h-2 w-full rounded-full bg-bg-subtle overflow-hidden">
              <div
                style={{ width: `${Math.min(100, projection.utilizationPct)}%` }}
                className={cn(
                  'h-full transition-all duration-500 rounded-full',
                  projection.utilizationPct > 90
                    ? 'bg-status-critical'
                    : projection.utilizationPct > 75
                      ? 'bg-status-warning'
                      : 'bg-status-healthy'
                )}
              />
            </div>
            <div className="flex justify-between text-[11px] font-mono text-text-muted pt-0.5">
              <span>{projection.utilizationPct}% utilized</span>
              <span>{projection.daysRemaining} days remaining</span>
            </div>
          </div>
        </Card>

        {/* Card 2: Projected Month-End Forecast */}
        <Card className="p-4 border-border-default bg-bg-surface space-y-3">
          <div className="flex items-center justify-between text-xs text-text-muted">
            <span>Projected Month-End Spend</span>
            <TrendingUp className="h-4 w-4 text-accent-cyan" />
          </div>

          <div className="space-y-1">
            <div className="flex items-baseline gap-2">
              <strong
                className={cn(
                  'text-2xl font-bold font-mono tabular-nums',
                  projection.isOverBudget ? 'text-status-critical' : 'text-text-primary'
                )}
              >
                {formatCurrency(projection.projectedMonthEnd)}
              </strong>
            </div>

            <p className="text-[11px] text-text-muted flex items-center gap-1">
              {projection.isOverBudget ? (
                <>
                  <AlertCircle className="h-3 w-3 text-status-critical" />
                  <span className="text-status-critical font-medium">
                    Forecast exceeds budget by{' '}
                    {formatCurrency(projection.projectedMonthEnd - projection.monthlyBudget)}
                  </span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-3 w-3 text-status-healthy" />
                  <span className="text-status-healthy font-medium">
                    Within budget envelope (
                    {formatCurrency(projection.monthlyBudget - projection.projectedMonthEnd)}{' '}
                    headroom)
                  </span>
                </>
              )}
            </p>
            <p className="text-[11px] text-text-muted font-mono">
              Run rate: {formatCurrency(projection.dailyBurnRate)}/day
            </p>
          </div>
        </Card>

        {/* Card 3: Cost Per 1k Requests */}
        <Card className="p-4 border-border-default bg-bg-surface space-y-3">
          <div className="flex items-center justify-between text-xs text-text-muted">
            <span>Unit Cost / 1k Requests</span>
            <Coins className="h-4 w-4 text-status-warning" />
          </div>

          <div className="space-y-1">
            <strong className="text-2xl font-bold font-mono text-text-primary tabular-nums">
              {formatCurrency(avgCostPer1k, 3)}
            </strong>
            <p className="text-[11px] text-text-muted">
              Fleet average across LLM reasoning & ML inference
            </p>
            <p className="text-[11px] text-text-muted font-mono">
              LLMs: ~$4.85/1k • Traditional ML: ~$0.04/1k
            </p>
          </div>
        </Card>

        {/* Card 4: Prompt Cache Savings */}
        <Card className="p-4 border-border-default bg-bg-surface space-y-3">
          <div className="flex items-center justify-between text-xs text-text-muted">
            <span>Prompt Caching Efficiency</span>
            <Zap className="h-4 w-4 text-status-healthy" />
          </div>

          <div className="space-y-1">
            <div className="flex items-baseline gap-1.5">
              <strong className="text-2xl font-bold font-mono text-status-healthy tabular-nums">
                {tokenStats.cacheHitPct.toFixed(1)}%
              </strong>
              <span className="text-xs text-text-muted font-mono">hit rate</span>
            </div>
            <p className="text-[11px] text-text-muted">
              Saved ~{formatCurrency(tokenStats.estimatedSavings)} this period via semantic prefix
              caching
            </p>
            <p className="text-[11px] text-text-muted font-mono">
              {formatCompactNumber(tokenStats.cached)} cached tokens
            </p>
          </div>
        </Card>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Chart 1: Spend Breakdown */}
        <Card className="border-border-default bg-bg-surface">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold flex items-center justify-between">
              <span>Daily Spend Breakdown ({groupBy === 'team' ? 'By Team' : 'By Model'})</span>
              <span className="text-xs font-mono font-normal text-text-muted">
                {timeHorizon} Horizon
              </span>
            </CardTitle>
            <CardDescription className="text-xs">
              Daily compute and API cost aggregated across{' '}
              {groupBy === 'team' ? 'engineering teams' : 'model endpoints'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <BaseEChart
              option={spendBreakdownOption}
              height={280}
              exportFileName={`modelsight-spend-breakdown-${groupBy}`}
              ariaLabel="Daily spend breakdown stacked chart"
            />
          </CardContent>
        </Card>

        {/* Chart 2: Budget Burn-Up Forecast */}
        <Card className="border-border-default bg-bg-surface">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold flex items-center justify-between">
              <span>Monthly Budget Burn-Up & Forecast</span>
              <Badge
                variant={projection.isOverBudget ? 'critical' : 'healthy'}
                className="text-[10px]"
              >
                {projection.isOverBudget ? 'Risk: Over Budget' : 'On Track'}
              </Badge>
            </CardTitle>
            <CardDescription className="text-xs">
              Cumulative month-to-date spend trendline with projected forecast through day 30 vs
              budget limit
            </CardDescription>
          </CardHeader>
          <CardContent>
            <BaseEChart
              option={budgetBurnupOption}
              height={280}
              exportFileName="modelsight-budget-burnup-forecast"
              ariaLabel="Budget burn-up cumulative and forecast chart"
            />
          </CardContent>
        </Card>
      </div>

      {/* Secondary Row: Token Donut & FinOps Optimization Insights */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Token Distribution Donut (1 Col) */}
        <Card className="border-border-default bg-bg-surface lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <PieChart className="h-4 w-4 text-accent-primary" />
              <span>Token Distribution</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Total: {formatCompactNumber(tokenStats.total)} tokens processed
            </CardDescription>
          </CardHeader>
          <CardContent>
            <BaseEChart
              option={tokenDonutOption}
              height={240}
              exportFileName="modelsight-token-distribution"
              ariaLabel="Donut chart showing prompt, completion, and cached token split"
            />
          </CardContent>
        </Card>

        {/* FinOps Optimization Opportunities (2 Cols) */}
        <Card className="border-border-default bg-bg-surface lg:col-span-2">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-status-warning" />
                <span>Automated FinOps Routing Recommendations</span>
              </CardTitle>
              <CardDescription className="text-xs mt-1">
                Data-driven routing rules to lower token spend without degrading accuracy or SLAs
              </CardDescription>
            </div>
            <Badge variant="healthy" className="text-[11px] font-mono">
              +$9,050/mo Potential Savings
            </Badge>
          </CardHeader>

          <CardContent className="space-y-3 pt-2">
            {/* Recommendation 1 */}
            <div className="rounded-lg border border-border-subtle bg-bg-elevated/50 p-3 text-xs flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <Lightbulb className="h-4 w-4 text-accent-cyan shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="font-semibold text-text-primary">
                    Cascading Model Routing for Support Concierge
                  </h4>
                  <p className="text-text-secondary leading-relaxed">
                    Route 35% of low-complexity FAQ inquiries from{' '}
                    <code className="font-mono text-[11px]">gpt-4o-customer-support</code> to{' '}
                    <code className="font-mono text-[11px]">claude-3-5-haiku</code>. Evaluator shows
                    99.4% intent match with zero quality degradation.
                  </p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <span className="font-mono text-xs font-bold text-status-healthy block">
                  +$4,280 / mo
                </span>
                <span className="text-[10px] text-text-muted">Estimated Savings</span>
              </div>
            </div>

            {/* Recommendation 2 */}
            <div className="rounded-lg border border-border-subtle bg-bg-elevated/50 p-3 text-xs flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <Zap className="h-4 w-4 text-status-healthy shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="font-semibold text-text-primary">
                    System Prompt Semantic Caching on Knowledge RAG
                  </h4>
                  <p className="text-text-secondary leading-relaxed">
                    Enable prefix prompt caching on the 12,000-token system prompt for{' '}
                    <code className="font-mono text-[11px]">llama-3-3-70b-rag</code>. Eliminates
                    re-tokenization overhead on repetitive documentation queries.
                  </p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <span className="font-mono text-xs font-bold text-status-healthy block">
                  +$2,850 / mo
                </span>
                <span className="text-[10px] text-text-muted">Estimated Savings</span>
              </div>
            </div>

            {/* Recommendation 3 */}
            <div className="rounded-lg border border-border-subtle bg-bg-elevated/50 p-3 text-xs flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <Clock className="h-4 w-4 text-status-warning shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="font-semibold text-text-primary">
                    Off-Peak Provisioned GPU Auto-Scaling (Staging / Shadow)
                  </h4>
                  <p className="text-text-secondary leading-relaxed">
                    Scale down 3 dedicated H100 GPU pods powering{' '}
                    <code className="font-mono text-[11px]">mistral-large-2411</code> and{' '}
                    <code className="font-mono text-[11px]">deepseek-v3-coder</code> during off-peak
                    hours (22:00–06:00 UTC).
                  </p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <span className="font-mono text-xs font-bold text-status-healthy block">
                  +$1,920 / mo
                </span>
                <span className="text-[10px] text-text-muted">Estimated Savings</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Model Fleet Unit Economics Table */}
      <Card className="border-border-default bg-bg-surface overflow-hidden">
        <CardHeader className="pb-3 border-b border-border-subtle">
          <CardTitle className="text-base font-bold flex items-center justify-between">
            <span>Model Fleet Unit Economics Leaderboard</span>
            <span className="text-xs font-mono font-normal text-text-muted">
              {models.length} Production & Staging Models
            </span>
          </CardTitle>
          <CardDescription className="text-xs">
            Detailed breakdown of spend, unit cost per 1k transactions, and prompt cache utilization
            by model
          </CardDescription>
        </CardHeader>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-bg-elevated text-text-secondary border-b border-border-default font-semibold text-[11px]">
              <tr>
                <th className="py-2.5 pl-4 pr-3">Model Name</th>
                <th className="px-3 py-2.5">Category</th>
                <th className="px-3 py-2.5">Team</th>
                <th className="px-3 py-2.5 text-right">24h Requests</th>
                <th className="px-3 py-2.5 text-right">Cost / 1k Reqs</th>
                <th className="px-3 py-2.5 text-right">Daily Spend</th>
                <th className="px-3 py-2.5 text-right">Cache Hit %</th>
                <th className="py-2.5 pl-3 pr-4 text-right">% of Fleet Budget</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle font-mono">
              {sortedModels.map((model) => (
                <tr key={model.id} className="hover:bg-bg-elevated/40 transition-colors">
                  <td className="py-2.5 pl-4 pr-3 font-sans font-medium text-text-primary">
                    {model.displayName}
                  </td>
                  <td className="px-3 py-2.5">
                    <Badge variant="outline" className="text-[10px]">
                      {model.category}
                    </Badge>
                  </td>
                  <td className="px-3 py-2.5 font-sans text-text-secondary text-[11px]">
                    {model.team}
                  </td>
                  <td className="px-3 py-2.5 text-right text-text-primary tabular-nums">
                    {formatNumber(model.requests24h)}
                  </td>
                  <td className="px-3 py-2.5 text-right text-text-primary tabular-nums font-semibold">
                    {formatCurrency(model.costPer1k, 3)}
                  </td>
                  <td className="px-3 py-2.5 text-right text-text-primary tabular-nums font-bold">
                    {formatCurrency(model.cost24hUsd)}
                  </td>
                  <td className="px-3 py-2.5 text-right text-status-healthy tabular-nums">
                    {model.inputTokens24h > 0
                      ? `${((model.cachedTokens24h / model.inputTokens24h) * 100).toFixed(0)}%`
                      : '0%'}
                  </td>
                  <td className="py-2.5 pl-3 pr-4 text-right text-text-secondary tabular-nums">
                    {model.budgetSharePct.toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
