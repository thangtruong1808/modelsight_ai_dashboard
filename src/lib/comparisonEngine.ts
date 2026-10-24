import type { ModelEntity } from '@/types';

export interface RadarDimensionScore {
  speed: number;
  accuracy: number;
  costEfficiency: number;
  stability: number;
  lowDrift: number;
}

/**
 * Normalizes model telemetry into a 0-100 radar metric score:
 * - Speed: derived from latency (lower latency -> higher score, capped at 100)
 * - Accuracy: direct percentage score
 * - Cost Efficiency: derived from cost per 1k requests (lower cost -> higher score)
 * - Stability: derived from error rate (lower error -> higher score)
 * - Low Drift: derived from PSI drift score (lower PSI -> higher score)
 */
export function calculateRadarScores(model: ModelEntity): RadarDimensionScore {
  // Speed: 100ms -> 100, 1000ms -> 20
  const speed = Math.max(10, Math.min(100, Math.round(110 - model.latencyP95 / 10)));

  // Accuracy: direct percentage (typically 80 - 99%)
  const accuracy = Math.max(10, Math.min(100, Math.round(model.accuracyScore)));

  // Cost Efficiency: calculate estimated cost per 1k requests
  const costPer1k = model.requests24h > 0 ? (model.cost24hUsd / model.requests24h) * 1000 : 3.0;
  // $0.50/1k -> 95 score, $8/1k -> 30 score
  const costEfficiency = Math.max(10, Math.min(100, Math.round(100 - costPer1k * 9)));

  // Stability: 0% error -> 100, 3% error -> 40
  const stability = Math.max(10, Math.min(100, Math.round(100 - model.errorRate * 20)));

  // Low Drift: 0 PSI -> 100, 0.3 PSI -> 40
  const lowDrift = Math.max(10, Math.min(100, Math.round(100 - model.driftPsi * 200)));

  return {
    speed,
    accuracy,
    costEfficiency,
    stability,
    lowDrift,
  };
}

export type BestWorstEvaluation = Record<string, { best: boolean; worst: boolean }>;

/**
 * Evaluate best and worst model values for a numerical row across selected models
 */
export function evaluateBestAndWorst(
  models: readonly ModelEntity[],
  getValue: (m: ModelEntity) => number,
  lowerIsBetter = false
): BestWorstEvaluation {
  const result: BestWorstEvaluation = {};
  if (models.length < 2) {
    for (const m of models) result[m.id] = { best: false, worst: false };
    return result;
  }

  const values = models.map((m) => ({ id: m.id, val: getValue(m) }));
  const sorted = [...values].sort((a, b) => (lowerIsBetter ? a.val - b.val : b.val - a.val));

  const bestVal = sorted[0]!.val;
  const worstVal = sorted[sorted.length - 1]!.val;

  // If all values are identical, neither is best or worst
  const allIdentical = bestVal === worstVal;

  for (const m of models) {
    const val = getValue(m);
    result[m.id] = {
      best: !allIdentical && val === bestVal,
      worst: !allIdentical && val === worstVal,
    };
  }

  return result;
}

export interface FinOpsProjection {
  currentSpend: number;
  projectedMonthEnd: number;
  monthlyBudget: number;
  utilizationPct: number;
  isOverBudget: boolean;
  daysRemaining: number;
  dailyBurnRate: number;
}

/**
 * Calculates budget utilization and projected month-end burnup
 */
export function calculateBudgetProjection(
  dailyCosts: number[],
  monthlyBudget = 65000,
  daysInMonth = 30
): FinOpsProjection {
  const daysElapsed = Math.max(1, dailyCosts.length);
  const currentSpend = Number(dailyCosts.reduce((acc, c) => acc + c, 0).toFixed(2));
  const dailyBurnRate = Number((currentSpend / daysElapsed).toFixed(2));
  const daysRemaining = Math.max(0, daysInMonth - daysElapsed);
  const projectedMonthEnd = Number((currentSpend + dailyBurnRate * daysRemaining).toFixed(2));
  const utilizationPct = Number(((currentSpend / monthlyBudget) * 100).toFixed(1));

  return {
    currentSpend,
    projectedMonthEnd,
    monthlyBudget,
    utilizationPct,
    isOverBudget: projectedMonthEnd > monthlyBudget,
    daysRemaining,
    dailyBurnRate,
  };
}
