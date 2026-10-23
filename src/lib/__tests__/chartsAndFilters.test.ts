import { describe, expect, it } from 'vitest';
import uiReducer, { resetGlobalFilters, updateGlobalFilters } from '@/app/slices/uiSlice';
import { buildOverviewDashboardPayload } from '@/data/seed';
import type { GlobalFilterState } from '@/types';

describe('Global Filters & Analytics Data Transformations', () => {
  it('updates environment and time range in global filter state', () => {
    let state = uiReducer(undefined, { type: '@@INIT' });
    state = uiReducer(
      state,
      updateGlobalFilters({ environment: 'staging', timeRange: '30d', team: 'Risk & Fraud' })
    );

    expect(state.globalFilters.environment).toBe('staging');
    expect(state.globalFilters.timeRange).toBe('30d');
    expect(state.globalFilters.team).toBe('Risk & Fraud');

    state = uiReducer(state, resetGlobalFilters());
    expect(state.globalFilters.environment).toBe('production');
    expect(state.globalFilters.timeRange).toBe('7d');
    expect(state.globalFilters.team).toBe('all');
  });

  it('computes time-series anomaly points and percentile bands', () => {
    const filters: GlobalFilterState = {
      environment: 'production',
      timeRange: '30d',
      compareToPrevious: true,
      team: 'all',
      modelId: 'all',
    };

    const payload = buildOverviewDashboardPayload(filters);
    expect(payload.aggregatedSeries.length).toBe(30);

    // Verify percentile order: p50 <= p95 <= p99
    payload.aggregatedSeries.forEach((pt) => {
      expect(pt.latencyP50).toBeLessThanOrEqual(pt.latencyP95);
      expect(pt.latencyP95).toBeLessThanOrEqual(pt.latencyP99);
      expect(pt.tokensPerSec).toBeGreaterThan(0);
      expect(pt.requests).toBeGreaterThan(0);
    });

    // Check error breakdown sums to ~100%
    const totalPercentage = payload.errorBreakdown.reduce((sum, item) => sum + item.percentage, 0);
    expect(Math.round(totalPercentage)).toBe(100);
  });

  it('aggregates correctly when comparing to previous period', () => {
    const filters: GlobalFilterState = {
      environment: 'all',
      timeRange: '7d',
      compareToPrevious: true,
      team: 'all',
      modelId: 'all',
    };

    const payload = buildOverviewDashboardPayload(filters);
    expect(payload.aggregatedSeries).toHaveLength(7);
    payload.aggregatedSeries.forEach((pt) => {
      expect(pt.prevRequests).toBeGreaterThan(0);
      expect(pt.prevLatencyP95).toBeGreaterThan(0);
      expect(pt.prevAccuracyScore).toBeGreaterThan(0);
    });
  });
});
