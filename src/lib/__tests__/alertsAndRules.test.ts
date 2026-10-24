import { describe, expect, it } from 'vitest';
import { getSeedDatabase } from '@/data/seed';
import {
  evaluateAlertCondition,
  evaluateAlertRuleHistorical,
  extractMetricValue,
} from '@/lib/alertEvaluator';

describe('Alert Rules & Historical Evaluation Engine', () => {
  it('evaluates threshold conditions correctly', () => {
    expect(evaluateAlertCondition(650, 'gt', 500)).toBe(true);
    expect(evaluateAlertCondition(400, 'gt', 500)).toBe(false);
    expect(evaluateAlertCondition(92, 'lt', 95)).toBe(true);
    expect(evaluateAlertCondition(97, 'lt', 95)).toBe(false);
    expect(evaluateAlertCondition(150, 'pct_change', 100)).toBe(true);
  });

  it('extracts specific metric values from time-series points accurately', () => {
    const db = getSeedDatabase();
    const pt = db.models[0]!.timeSeries[0]!;

    expect(extractMetricValue(pt, 'latencyP95')).toBe(pt.latencyP95);
    expect(extractMetricValue(pt, 'errorRate')).toBe(pt.errorRate);
    expect(extractMetricValue(pt, 'driftPsi')).toBe(pt.driftPsi);
    expect(extractMetricValue(pt, 'costUsd')).toBe(pt.costUsd);
    expect(extractMetricValue(pt, 'accuracyScore')).toBe(pt.accuracyScore);
  });

  it('accurately calculates historical firing counts and zones over model telemetry', () => {
    const db = getSeedDatabase();
    const degradedModel = db.models.find((m) => m.status === 'degraded')!;

    // A low threshold of 200ms should fire multiple times on degraded models
    const result = evaluateAlertRuleHistorical(
      degradedModel.timeSeries.slice(-14),
      'latencyP95',
      'gt',
      200
    );

    expect(result.firingCount).toBeGreaterThan(0);
    expect(result.firingPercentage).toBeGreaterThan(0);
    expect(result.seriesData.length).toBe(14);
    expect(result.firingZones.length).toBeGreaterThan(0);

    // An extremely high threshold (5000ms) should never fire
    const zeroResult = evaluateAlertRuleHistorical(
      degradedModel.timeSeries.slice(-14),
      'latencyP95',
      'gt',
      5000
    );

    expect(zeroResult.firingCount).toBe(0);
    expect(zeroResult.firingPercentage).toBe(0);
    expect(zeroResult.firingZones.length).toBe(0);
  });
});
