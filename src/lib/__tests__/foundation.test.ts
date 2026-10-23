import { describe, expect, it } from 'vitest';
import {
  formatCompactNumber,
  formatCurrency,
  formatLatency,
  formatPercent,
} from '@/lib/formatters';
import uiReducer, {
  resetSimulator,
  setForceOfflineError,
  setSimulatorErrorRate,
  setSimulatorLatency,
  toggleSidebar,
} from '@/app/slices/uiSlice';

describe('formatters utility', () => {
  it('formats compact numbers accurately', () => {
    expect(formatCompactNumber(842)).toBe('842');
    expect(formatCompactNumber(14_800)).toBe('14.8K');
    expect(formatCompactNumber(14_820_490)).toBe('14.82M');
    expect(formatCompactNumber(2_400_000_000)).toBe('2.40B');
  });

  it('formats latency values in ms and seconds', () => {
    expect(formatLatency(142.4)).toBe('142ms');
    expect(formatLatency(1450)).toBe('1.45s');
  });

  it('formats percentages and USD currency', () => {
    expect(formatPercent(99.942, 2)).toBe('99.94%');
    expect(formatCurrency(3842.5)).toBe('$3,842.50');
  });
});

describe('uiSlice state reducer', () => {
  it('toggles sidebar collapsed state', () => {
    const initial = uiReducer(undefined, { type: '@@INIT' });
    const next = uiReducer(initial, toggleSidebar());
    expect(next.sidebarCollapsed).toBe(!initial.sidebarCollapsed);
  });

  it('clamps simulator latency and error rates and resets cleanly', () => {
    let state = uiReducer(undefined, { type: '@@INIT' });
    state = uiReducer(state, setSimulatorLatency(5000));
    expect(state.simulator.latencyMs).toBe(3000);

    state = uiReducer(state, setSimulatorErrorRate(140));
    expect(state.simulator.errorRatePercent).toBe(100);

    state = uiReducer(state, setForceOfflineError(true));
    expect(state.simulator.forceOfflineError).toBe(true);

    state = uiReducer(state, resetSimulator());
    expect(state.simulator).toEqual({
      latencyMs: 220,
      errorRatePercent: 0,
      forceOfflineError: false,
    });
  });
});
