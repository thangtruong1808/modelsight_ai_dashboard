import { describe, expect, it } from 'vitest';
import { buildOverviewDashboardPayload, getSeedDatabase, SEED_ANCHOR_DATE } from '@/data/seed';
import type { GlobalFilterState } from '@/types';

describe('Seed Database & Overview Aggregator', () => {
  it('generates exactly 14 deterministic models across multiple categories and teams', () => {
    const db = getSeedDatabase();
    expect(db.models).toHaveLength(14);

    const categories = new Set(db.models.map((m) => m.category));
    expect(categories.has('LLM')).toBe(true);
    expect(categories.has('Classification')).toBe(true);
    expect(categories.has('Ranking')).toBe(true);
    expect(categories.has('Embedding')).toBe(true);
    expect(categories.has('Vision')).toBe(true);

    const envs = new Set(db.models.map((m) => m.environment));
    expect(envs.has('production')).toBe(true);
    expect(envs.has('staging')).toBe(true);
    expect(envs.has('shadow')).toBe(true);
  });

  it('aggregates overview metrics correctly for production filter', () => {
    const filters: GlobalFilterState = {
      environment: 'production',
      timeRange: '7d',
      compareToPrevious: true,
      team: 'all',
      modelId: 'all',
    };

    const payload = buildOverviewDashboardPayload(filters);
    expect(payload.kpis).toHaveLength(6);

    const requestsKpi = payload.kpis.find((k) => k.id === 'requests');
    expect(requestsKpi).toBeDefined();
    expect(requestsKpi!.rawValue).toBeGreaterThan(0);
    expect(requestsKpi!.sparkline.length).toBe(7);

    const successKpi = payload.kpis.find((k) => k.id === 'successRate');
    expect(successKpi).toBeDefined();
    expect(successKpi!.rawValue).toBeGreaterThan(95);
    expect(successKpi!.rawValue).toBeLessThanOrEqual(100);

    const latencyKpi = payload.kpis.find((k) => k.id === 'latencyP95');
    expect(latencyKpi).toBeDefined();
    expect(latencyKpi!.rawValue).toBeGreaterThan(0);
    expect(latencyKpi!.trendSentiment).toBe('down-good');

    const costKpi = payload.kpis.find((k) => k.id === 'totalCost');
    expect(costKpi).toBeDefined();
    expect(costKpi!.rawValue).toBeGreaterThan(0);

    const modelsKpi = payload.kpis.find((k) => k.id === 'activeModels');
    expect(modelsKpi).toBeDefined();
    expect(modelsKpi!.rawValue).toBe(11); // 11 production models out of 14 total
  });

  it('filters by engineering team accurately', () => {
    const filters: GlobalFilterState = {
      environment: 'all',
      timeRange: '7d',
      compareToPrevious: true,
      team: 'Risk & Fraud',
      modelId: 'all',
    };

    const payload = buildOverviewDashboardPayload(filters);
    expect(payload.topModels.every((m) => m.team === 'Risk & Fraud')).toBe(true);
    expect(payload.topModels.length).toBeGreaterThan(0);
  });

  it('maintains a fixed reference seed date', () => {
    expect(SEED_ANCHOR_DATE.toISOString()).toBe('2026-10-24T09:00:00.000Z');
  });
});
