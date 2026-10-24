import { describe, expect, it } from 'vitest';
import { getSeedDatabase } from '@/data/seed';
import {
  calculateBudgetProjection,
  calculateRadarScores,
  evaluateBestAndWorst,
} from '@/lib/comparisonEngine';
import type { ModelEntity } from '@/types';

describe('Phase 7: FinOps Cost Analytics & Model Comparison Engine', () => {
  const db = getSeedDatabase();
  const models = db.models;

  describe('calculateBudgetProjection', () => {
    it('calculates current spend, burn rate, and month-end forecast within budget envelope', () => {
      const dailyCosts = [1400, 1500, 1450, 1600, 1550, 1400, 1500]; // 7 days
      const projection = calculateBudgetProjection(dailyCosts, 65000, 30);

      expect(projection.currentSpend).toBe(10400);
      expect(projection.dailyBurnRate).toBeCloseTo(1485.71, 1);
      expect(projection.daysRemaining).toBe(23);
      // 10400 + (1485.71 * 23) = 44571.33
      expect(projection.projectedMonthEnd).toBeLessThan(65000);
      expect(projection.isOverBudget).toBe(false);
      expect(projection.utilizationPct).toBeCloseTo((10400 / 65000) * 100, 1);
    });

    it('flags over-budget risk when run-rate projects beyond the monthly limit', () => {
      const dailyCosts = [2600, 2800, 2700, 2900, 2750]; // 5 days @ ~2750/day
      const projection = calculateBudgetProjection(dailyCosts, 65000, 30);

      expect(projection.dailyBurnRate).toBe(2750);
      // 5 days = 13750, 25 remaining * 2750 = 68750 -> total 82500
      expect(projection.projectedMonthEnd).toBeGreaterThan(65000);
      expect(projection.isOverBudget).toBe(true);
    });
  });

  describe('calculateRadarScores', () => {
    it('normalizes telemetry into bounded 0-100 scores across all 5 operational dimensions', () => {
      const model = models[0]!;
      const scores = calculateRadarScores(model);

      expect(scores.speed).toBeGreaterThanOrEqual(10);
      expect(scores.speed).toBeLessThanOrEqual(100);

      expect(scores.accuracy).toBeGreaterThanOrEqual(10);
      expect(scores.accuracy).toBeLessThanOrEqual(100);

      expect(scores.costEfficiency).toBeGreaterThanOrEqual(10);
      expect(scores.costEfficiency).toBeLessThanOrEqual(100);

      expect(scores.stability).toBeGreaterThanOrEqual(10);
      expect(scores.stability).toBeLessThanOrEqual(100);

      expect(scores.lowDrift).toBeGreaterThanOrEqual(10);
      expect(scores.lowDrift).toBeLessThanOrEqual(100);
    });

    it('assigns higher speed to lower latency models', () => {
      const fastModel: ModelEntity = { ...models[0]!, latencyP95: 140 };
      const slowModel: ModelEntity = { ...models[0]!, latencyP95: 850 };

      const fastScore = calculateRadarScores(fastModel);
      const slowScore = calculateRadarScores(slowModel);

      expect(fastScore.speed).toBeGreaterThan(slowScore.speed);
    });

    it('assigns higher stability to models with lower error rates', () => {
      const stableModel: ModelEntity = { ...models[0]!, errorRate: 0.1 };
      const unstableModel: ModelEntity = { ...models[0]!, errorRate: 2.8 };

      const stableScore = calculateRadarScores(stableModel);
      const unstableScore = calculateRadarScores(unstableModel);

      expect(stableScore.stability).toBeGreaterThan(unstableScore.stability);
    });
  });

  describe('evaluateBestAndWorst', () => {
    it('accurately identifies best (min) and worst (max) when lowerIsBetter is true', () => {
      const testModels = [
        { ...models[0]!, id: 'm1', latencyP95: 220 },
        { ...models[1]!, id: 'm2', latencyP95: 450 },
        { ...models[2]!, id: 'm3', latencyP95: 780 },
      ];

      const res = evaluateBestAndWorst(testModels, (m) => m.latencyP95, true);

      expect(res['m1']).toEqual({ best: true, worst: false });
      expect(res['m2']).toEqual({ best: false, worst: false });
      expect(res['m3']).toEqual({ best: false, worst: true });
    });

    it('accurately identifies best (max) and worst (min) when lowerIsBetter is false', () => {
      const testModels = [
        { ...models[0]!, id: 'm1', successRate: 99.8 },
        { ...models[1]!, id: 'm2', successRate: 98.4 },
        { ...models[2]!, id: 'm3', successRate: 96.1 },
      ];

      const res = evaluateBestAndWorst(testModels, (m) => m.successRate, false);

      expect(res['m1']).toEqual({ best: true, worst: false });
      expect(res['m2']).toEqual({ best: false, worst: false });
      expect(res['m3']).toEqual({ best: false, worst: true });
    });

    it('does not flag best or worst when values are identical', () => {
      const testModels = [
        { ...models[0]!, id: 'm1', accuracyScore: 95.0 },
        { ...models[1]!, id: 'm2', accuracyScore: 95.0 },
      ];

      const res = evaluateBestAndWorst(testModels, (m) => m.accuracyScore, false);

      expect(res['m1']).toEqual({ best: false, worst: false });
      expect(res['m2']).toEqual({ best: false, worst: false });
    });
  });
});
