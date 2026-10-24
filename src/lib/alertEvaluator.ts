import type { AlertRuleEntity, TimeSeriesPoint } from '@/types';

export interface AlertEvaluationResult {
  metricName: string;
  unit: string;
  threshold: number;
  firingCount: number;
  totalPoints: number;
  firingPercentage: number;
  seriesData: Array<{ timestamp: string; value: number }>;
  firingZones: Array<[string, string]>;
  firingPoints: Array<{ timestamp: string; value: number }>;
}

export function extractMetricValue(
  point: TimeSeriesPoint,
  metric: AlertRuleEntity['metric']
): number {
  switch (metric) {
    case 'latencyP95':
      return point.latencyP95;
    case 'errorRate':
      return point.errorRate;
    case 'driftPsi':
      return point.driftPsi;
    case 'costUsd':
      return point.costUsd;
    case 'accuracyScore':
      return point.accuracyScore;
    default:
      return point.latencyP95;
  }
}

export function evaluateAlertCondition(
  value: number,
  condition: AlertRuleEntity['condition'],
  threshold: number
): boolean {
  switch (condition) {
    case 'gt':
      return value > threshold;
    case 'lt':
      return value < threshold;
    case 'pct_change':
      return Math.abs(value - threshold) / Math.max(1, threshold) > 0.2;
    default:
      return value > threshold;
  }
}

export function evaluateAlertRuleHistorical(
  series: TimeSeriesPoint[],
  metric: AlertRuleEntity['metric'],
  condition: AlertRuleEntity['condition'],
  threshold: number
): AlertEvaluationResult {
  const metricUnits: Record<AlertRuleEntity['metric'], { name: string; unit: string }> = {
    latencyP95: { name: 'Tail Latency (p95)', unit: 'ms' },
    errorRate: { name: 'Error Rate', unit: '%' },
    driftPsi: { name: 'Feature Drift PSI', unit: 'PSI' },
    costUsd: { name: 'Inference Cost', unit: '$' },
    accuracyScore: { name: 'Quality / Accuracy', unit: '%' },
  };

  const info = metricUnits[metric] ?? { name: 'Metric', unit: '' };

  const seriesData = series.map((pt) => ({
    timestamp: pt.timestamp,
    value: extractMetricValue(pt, metric),
  }));

  const firingPoints: Array<{ timestamp: string; value: number }> = [];
  const firingZones: Array<[string, string]> = [];

  let activeZoneStart: string | null = null;

  seriesData.forEach((pt, idx) => {
    const isFiring = evaluateAlertCondition(pt.value, condition, threshold);

    if (isFiring) {
      firingPoints.push(pt);
      if (!activeZoneStart) {
        activeZoneStart = pt.timestamp;
      }
      // If last item and still firing, close the zone
      if (idx === seriesData.length - 1 && activeZoneStart) {
        firingZones.push([activeZoneStart, pt.timestamp]);
      }
    } else if (activeZoneStart) {
      firingZones.push([activeZoneStart, seriesData[idx - 1]?.timestamp ?? activeZoneStart]);
      activeZoneStart = null;
    }
  });

  const firingCount = firingPoints.length;
  const totalPoints = series.length;
  const firingPercentage =
    totalPoints > 0 ? Number(((firingCount / totalPoints) * 100).toFixed(1)) : 0;

  return {
    metricName: info.name,
    unit: info.unit,
    threshold,
    firingCount,
    totalPoints,
    firingPercentage,
    seriesData,
    firingZones,
    firingPoints,
  };
}
