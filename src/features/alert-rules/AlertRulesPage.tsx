import { useMemo, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type * as echarts from 'echarts';
import { BellRing, Plus, Sliders, Sparkles, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';
import { BaseEChart } from '@/components/charts/BaseEChart';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { getSeedDatabase } from '@/data/seed';
import { evaluateAlertRuleHistorical } from '@/lib/alertEvaluator';
import { cn } from '@/lib/cn';
import {
  useCreateAlertRuleMutation,
  useDeleteAlertRuleMutation,
  useGetAlertRulesQuery,
  useToggleAlertRuleMutation,
} from '@/services/baseApi';

const alertRuleSchema = z.object({
  name: z.string().min(3, 'Rule name must be at least 3 characters'),
  modelId: z.string(),
  environment: z.enum(['all', 'production', 'staging', 'shadow']),
  metric: z.enum(['latencyP95', 'errorRate', 'driftPsi', 'costUsd', 'accuracyScore']),
  condition: z.enum(['gt', 'lt', 'pct_change']),
  threshold: z.number().min(0, 'Threshold must be a positive number'),
  window: z.enum(['5m', '15m', '1h', '24h']),
  severity: z.enum(['critical', 'warning', 'info']),
  channel: z.enum(['Slack #ml-ops-alerts', 'PagerDuty Primary', 'Webhook Ops', 'Email FinOps']),
});

type AlertRuleFormData = z.infer<typeof alertRuleSchema>;

export default function AlertRulesPage() {
  const { data: rules = [] } = useGetAlertRulesQuery();
  const [createAlertRule, { isLoading: isCreating }] = useCreateAlertRuleMutation();
  const [toggleAlertRule] = useToggleAlertRuleMutation();
  const [deleteAlertRule] = useDeleteAlertRuleMutation();

  const [activeTab, setActiveTab] = useState<'create' | 'manage'>('create');

  const db = getSeedDatabase();
  const models = db.models;

  const {
    register,
    handleSubmit,
    control,
    setValue,
    reset,
    formState: { errors },
  } = useForm<AlertRuleFormData>({
    resolver: zodResolver(alertRuleSchema),
    defaultValues: {
      name: 'Production LLM p95 Latency SLA Breach',
      modelId: 'claude-3-7-sonnet-prod',
      environment: 'production',
      metric: 'latencyP95',
      condition: 'gt',
      threshold: 500,
      window: '15m',
      severity: 'critical',
      channel: 'PagerDuty Primary',
    },
  });

  // Watch fields in real-time to drive the live backtesting preview chart
  const watchedMetric = useWatch({ control, name: 'metric' }) ?? 'latencyP95';
  const watchedCondition = useWatch({ control, name: 'condition' }) ?? 'gt';
  const watchedThreshold = useWatch({ control, name: 'threshold' }) ?? 500;
  const watchedModelId = useWatch({ control, name: 'modelId' }) ?? 'claude-3-7-sonnet-prod';

  const evaluationResult = useMemo(() => {
    const targetModel = models.find((m) => m.id === watchedModelId) ?? models[0]!;
    return evaluateAlertRuleHistorical(
      targetModel.timeSeries.slice(-14),
      watchedMetric,
      watchedCondition,
      Number(watchedThreshold) || 0
    );
  }, [models, watchedModelId, watchedMetric, watchedCondition, watchedThreshold]);

  // ECharts live preview chart with markLine and shaded markArea firing zones
  const previewChartOption = useMemo<echarts.EChartsOption>(() => {
    const dates = evaluationResult.seriesData.map((d) => {
      const date = new Date(d.timestamp);
      return `${date.getMonth() + 1}/${date.getDate()} ${String(date.getHours()).padStart(2, '0')}:00`;
    });

    const values = evaluationResult.seriesData.map((d) => d.value);

    // Build markArea coordinates from firingZones
    const markAreaPairs: [{ xAxis: string }, { xAxis: string }][] =
      evaluationResult.firingZones.map(([start, end]) => {
        const s = new Date(start);
        const e = new Date(end);
        const sStr = `${s.getMonth() + 1}/${s.getDate()} ${String(s.getHours()).padStart(2, '0')}:00`;
        const eStr = `${e.getMonth() + 1}/${e.getDate()} ${String(e.getHours()).padStart(2, '0')}:00`;
        return [{ xAxis: sStr }, { xAxis: eStr }];
      });

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'cross' },
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
        data: dates,
        boundaryGap: false,
      },
      yAxis: {
        type: 'value',
        name: `${evaluationResult.metricName} (${evaluationResult.unit})`,
        splitLine: { lineStyle: { type: 'dashed' } },
      },
      series: [
        {
          name: evaluationResult.metricName,
          type: 'line',
          data: values,
          smooth: 0.3,
          lineStyle: { width: 2.2, color: '#6366f1' },
          itemStyle: { color: '#6366f1' },
          markLine: {
            symbol: 'none',
            data: [
              {
                yAxis: evaluationResult.threshold,
                name: 'Rule Threshold',
                lineStyle: { color: '#f43f5e', type: 'dashed', width: 2 },
                label: {
                  formatter: `Threshold: {c} ${evaluationResult.unit}`,
                  position: 'insideEndTop',
                  fontSize: 10,
                  color: '#f43f5e',
                },
              },
            ],
          },
          markArea: {
            itemStyle: {
              color: 'rgba(244, 63, 94, 0.15)',
            },
            data: markAreaPairs,
          },
        },
      ],
    };
  }, [evaluationResult]);

  const onSubmit = async (data: AlertRuleFormData) => {
    try {
      await createAlertRule({
        ...data,
        enabled: true,
      }).unwrap();
      toast.success(`Alert Rule created: "${data.name}"`, {
        description: `Monitors ${data.metric} ${data.condition} ${data.threshold} via ${data.channel}.`,
      });
      setActiveTab('manage');
      reset();
    } catch {
      toast.error('Failed to create alert rule');
    }
  };

  const handleToggle = async (ruleId: string, currentEnabled: boolean) => {
    try {
      await toggleAlertRule({ ruleId, enabled: !currentEnabled }).unwrap();
      toast.success(currentEnabled ? 'Rule muted' : 'Rule enabled');
    } catch {
      toast.error('Failed to update rule status');
    }
  };

  const handleDelete = async (ruleId: string) => {
    try {
      await deleteAlertRule({ ruleId }).unwrap();
      toast.success('Alert rule deleted');
    } catch {
      toast.error('Failed to delete alert rule');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 border-b border-border-default pb-5 lg:flex-row lg:items-center">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="indigo">Schema Validated (Zod + React Hook Form)</Badge>
            <Badge variant="outline">Live Backtest Preview Active</Badge>
          </div>
          <h1 className="mt-2 text-xl font-bold tracking-tight text-text-primary sm:text-2xl">
            Alert Rules Builder
          </h1>
          <p className="mt-1 text-xs text-text-secondary sm:text-sm">
            Define SLA thresholds, drift detectors, and notification triggers with live historical
            backtesting
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="inline-flex items-center rounded-lg border border-border-default bg-bg-surface p-1 text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('create')}
              className={cn(
                'rounded-md px-3 py-1.5 font-medium transition-colors cursor-pointer',
                activeTab === 'create'
                  ? 'bg-accent-primary text-white shadow-xs'
                  : 'text-text-secondary hover:text-text-primary'
              )}
            >
              Rule Builder
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('manage')}
              className={cn(
                'rounded-md px-3 py-1.5 font-medium transition-colors cursor-pointer',
                activeTab === 'manage'
                  ? 'bg-accent-primary text-white shadow-xs'
                  : 'text-text-secondary hover:text-text-primary'
              )}
            >
              Active Rules ({rules.length})
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'create' ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Left Column: Validated Form (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <Card>
              <CardHeader>
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Sliders className="h-4 w-4 text-accent-primary" />
                    Rule Configuration
                  </CardTitle>
                  <CardDescription className="mt-0.5">
                    Target model, metric threshold, and dispatch channels
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-xs">
                  {/* Rule Name */}
                  <div className="space-y-1">
                    <label htmlFor="name" className="font-medium text-text-primary">
                      Rule Name
                    </label>
                    <input
                      id="name"
                      type="text"
                      {...register('name')}
                      className="h-8 w-full rounded-lg border border-border-default bg-bg-canvas px-3 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-primary"
                    />
                    {errors.name && (
                      <p className="text-[11px] text-status-critical">{errors.name.message}</p>
                    )}
                  </div>

                  {/* Target Model & Environment */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label htmlFor="modelId" className="font-medium text-text-primary">
                        Target Model
                      </label>
                      <select
                        id="modelId"
                        {...register('modelId')}
                        className="h-8 w-full rounded-lg border border-border-default bg-bg-canvas px-2.5 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-primary cursor-pointer truncate"
                      >
                        {models.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.displayName}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label htmlFor="environment" className="font-medium text-text-primary">
                        Environment
                      </label>
                      <select
                        id="environment"
                        {...register('environment')}
                        className="h-8 w-full rounded-lg border border-border-default bg-bg-canvas px-2.5 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-primary cursor-pointer"
                      >
                        <option value="production">Production</option>
                        <option value="staging">Staging</option>
                        <option value="shadow">Shadow</option>
                        <option value="all">All Envs</option>
                      </select>
                    </div>
                  </div>

                  {/* Metric & Condition */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label htmlFor="metric" className="font-medium text-text-primary">
                        Metric to Monitor
                      </label>
                      <select
                        id="metric"
                        {...register('metric')}
                        onChange={(e) => {
                          const val = e.target.value as AlertRuleFormData['metric'];
                          setValue('metric', val);
                          if (val === 'latencyP95') setValue('threshold', 500);
                          else if (val === 'errorRate') setValue('threshold', 1.0);
                          else if (val === 'driftPsi') setValue('threshold', 0.25);
                          else if (val === 'costUsd') setValue('threshold', 250);
                          else if (val === 'accuracyScore') setValue('threshold', 92);
                        }}
                        className="h-8 w-full rounded-lg border border-border-default bg-bg-canvas px-2.5 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-primary cursor-pointer"
                      >
                        <option value="latencyP95">Tail Latency (p95)</option>
                        <option value="errorRate">Inference Error Rate</option>
                        <option value="driftPsi">Feature Drift PSI</option>
                        <option value="costUsd">Daily Compute Cost</option>
                        <option value="accuracyScore">Accuracy / Quality</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label htmlFor="condition" className="font-medium text-text-primary">
                        Condition
                      </label>
                      <select
                        id="condition"
                        {...register('condition')}
                        className="h-8 w-full rounded-lg border border-border-default bg-bg-canvas px-2.5 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-primary cursor-pointer"
                      >
                        <option value="gt">Greater Than (&gt;)</option>
                        <option value="lt">Less Than (&lt;)</option>
                        <option value="pct_change">Spike &gt; 20%</option>
                      </select>
                    </div>
                  </div>

                  {/* Threshold Value & Evaluation Window */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <label htmlFor="threshold" className="font-medium text-text-primary">
                          Threshold ({evaluationResult.unit})
                        </label>
                        <span className="font-mono text-text-secondary tabular-nums">
                          {watchedThreshold}
                        </span>
                      </div>
                      <input
                        id="threshold"
                        type="number"
                        step={
                          watchedMetric === 'driftPsi'
                            ? '0.01'
                            : watchedMetric === 'errorRate'
                              ? '0.1'
                              : '10'
                        }
                        {...register('threshold', { valueAsNumber: true })}
                        className="h-8 w-full rounded-lg border border-border-default bg-bg-canvas px-3 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-primary"
                      />
                      {errors.threshold && (
                        <p className="text-[11px] text-status-critical">
                          {errors.threshold.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-1">
                      <label htmlFor="window" className="font-medium text-text-primary">
                        Evaluation Window
                      </label>
                      <select
                        id="window"
                        {...register('window')}
                        className="h-8 w-full rounded-lg border border-border-default bg-bg-canvas px-2.5 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-primary cursor-pointer"
                      >
                        <option value="5m">5 Minutes</option>
                        <option value="15m">15 Minutes</option>
                        <option value="1h">1 Hour</option>
                        <option value="24h">24 Hours</option>
                      </select>
                    </div>
                  </div>

                  {/* Severity & Channel */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label htmlFor="severity" className="font-medium text-text-primary">
                        Incident Severity
                      </label>
                      <select
                        id="severity"
                        {...register('severity')}
                        className="h-8 w-full rounded-lg border border-border-default bg-bg-canvas px-2.5 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-primary cursor-pointer"
                      >
                        <option value="critical">Critical (Page on-call)</option>
                        <option value="warning">Warning (Slack alert)</option>
                        <option value="info">Info (Digest)</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label htmlFor="channel" className="font-medium text-text-primary">
                        Dispatch Channel
                      </label>
                      <select
                        id="channel"
                        {...register('channel')}
                        className="h-8 w-full rounded-lg border border-border-default bg-bg-canvas px-2.5 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-primary cursor-pointer truncate"
                      >
                        <option value="PagerDuty Primary">PagerDuty Primary</option>
                        <option value="Slack #ml-ops-alerts">Slack #ml-ops-alerts</option>
                        <option value="Webhook Ops">Webhook Ops</option>
                        <option value="Email FinOps">Email FinOps</option>
                      </select>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="pt-2">
                    <Button
                      type="submit"
                      variant="primary"
                      size="sm"
                      isLoading={isCreating}
                      className="w-full gap-1.5"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Create & Deploy Alert Rule</span>
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Live Backtesting Chart (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <Card>
              <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-accent-cyan" />
                    Live Historical Backtesting Preview
                  </CardTitle>
                  <CardDescription className="mt-0.5">
                    Evaluated against{' '}
                    {models.find((m) => m.id === watchedModelId)?.displayName ?? 'selected model'}{' '}
                    over the past 14 days
                  </CardDescription>
                </div>

                <Badge
                  variant={evaluationResult.firingCount > 0 ? 'critical' : 'healthy'}
                  className="font-mono text-xs"
                >
                  {evaluationResult.firingCount > 0
                    ? `Would have fired ${evaluationResult.firingCount} times (${evaluationResult.firingPercentage}%)`
                    : '0 firings (Clean baseline)'}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-4">
                <BaseEChart
                  option={previewChartOption}
                  height={320}
                  ariaLabel="Live historical rule preview chart"
                  exportFileName="alert-rule-historical-preview"
                />

                <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border-default bg-bg-elevated/40 p-3 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-status-critical" />
                    <span className="text-text-secondary">
                      Red shaded zones represent historical windows where the rule triggered.
                    </span>
                  </div>
                  <span className="font-mono text-[11px] text-text-muted">
                    Threshold: {watchedThreshold} {evaluationResult.unit}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        /* Manage Tab: List of Existing Alert Rules */
        <Card>
          <CardHeader>
            <div>
              <CardTitle className="flex items-center gap-2">
                <BellRing className="h-4 w-4 text-accent-primary" />
                Active Alert Rules Fleet
              </CardTitle>
              <CardDescription className="mt-0.5">
                Enabled thresholds and automated paging policies
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs" aria-label="Active Alert Rules">
                <thead className="border-b border-border-subtle bg-bg-elevated/40 text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                  <tr>
                    <th scope="col" className="py-2.5 pl-4 pr-3">
                      Rule Name
                    </th>
                    <th scope="col" className="px-3 py-2.5">
                      Target
                    </th>
                    <th scope="col" className="px-3 py-2.5">
                      Condition & Threshold
                    </th>
                    <th scope="col" className="px-3 py-2.5">
                      Severity
                    </th>
                    <th scope="col" className="px-3 py-2.5">
                      Channel
                    </th>
                    <th scope="col" className="px-3 py-2.5 text-center">
                      Status
                    </th>
                    <th scope="col" className="py-2.5 pl-3 pr-4 text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {rules.map((rule) => (
                    <tr key={rule.id} className="hover:bg-bg-elevated/40 transition-colors">
                      <td className="py-3 pl-4 pr-3 font-semibold text-text-primary">
                        {rule.name}
                      </td>
                      <td className="px-3 py-3 font-mono text-[11px] text-text-secondary">
                        {rule.modelId} ({rule.environment})
                      </td>
                      <td className="px-3 py-3 font-mono text-text-primary">
                        {rule.metric} {rule.condition === 'gt' ? '>' : '<'} {rule.threshold} (
                        {rule.window})
                      </td>
                      <td className="px-3 py-3">
                        <Badge variant={rule.severity} dot className="capitalize text-[10px]">
                          {rule.severity}
                        </Badge>
                      </td>
                      <td className="px-3 py-3 text-text-secondary">{rule.channel}</td>
                      <td className="px-3 py-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggle(rule.id, rule.enabled)}
                          className={cn(
                            'inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none',
                            rule.enabled ? 'bg-accent-primary' : 'bg-bg-subtle'
                          )}
                          aria-label={`Toggle rule ${rule.name}`}
                        >
                          <span
                            className={cn(
                              'pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out',
                              rule.enabled ? 'translate-x-4' : 'translate-x-0'
                            )}
                          />
                        </button>
                      </td>
                      <td className="py-3 pl-3 pr-4 text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(rule.id)}
                          className="h-7 w-7 text-text-muted hover:text-status-critical"
                          aria-label={`Delete rule ${rule.name}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
