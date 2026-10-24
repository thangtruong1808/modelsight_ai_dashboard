// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import uiReducer, {
  resetSimulator,
  setCommandPaletteOpen,
  setForceOfflineError,
  setNotificationsOpen,
  setSimulatorErrorRate,
  setSimulatorLatency,
  toggleSidebar,
} from '@/app/slices/uiSlice';
import { deleteSavedView, getSavedViews, saveView, togglePinSavedView } from '@/lib/savedViews';

describe('Phase 8: Settings, Saved Views & Command Workflows', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  describe('Saved Views Manager', () => {
    it('returns default saved views when storage is empty', () => {
      const views = getSavedViews();
      expect(views.length).toBeGreaterThanOrEqual(4);
      expect(views[0]!.name).toBeDefined();
      expect(views[0]!.path).toBeDefined();
      expect(views[0]!.searchParams).toBeDefined();
    });

    it('creates and persists a new custom saved view', () => {
      const newView = saveView({
        name: 'Staging Code LLM Watch',
        description: 'DeepSeek and Mistral latency audit',
        path: '/models',
        searchParams: '?env=staging',
        isPinned: true,
      });

      expect(newView.id).toMatch(/^view-/);
      expect(newView.name).toBe('Staging Code LLM Watch');
      expect(newView.isPinned).toBe(true);

      const all = getSavedViews();
      expect(all.some((v) => v.id === newView.id)).toBe(true);
    });

    it('toggles pinned status of an existing saved view', () => {
      const views = getSavedViews();
      const target = views[0]!;
      const originalPinned = target.isPinned;

      togglePinSavedView(target.id);
      const afterToggle = getSavedViews().find((v) => v.id === target.id);
      expect(afterToggle?.isPinned).toBe(!originalPinned);
    });

    it('deletes an existing saved view by ID', () => {
      const views = getSavedViews();
      const target = views[0]!;

      deleteSavedView(target.id);
      const remaining = getSavedViews();
      expect(remaining.some((v) => v.id === target.id)).toBe(false);
    });
  });

  describe('Redux UI State & Chaos Simulator Reducers', () => {
    const getInitialState = () => uiReducer(undefined, { type: '@@INIT' });

    it('handles command palette and notifications drawer toggles', () => {
      let state = getInitialState();
      expect(state.commandPaletteOpen).toBe(false);

      state = uiReducer(state, setCommandPaletteOpen(true));
      expect(state.commandPaletteOpen).toBe(true);

      state = uiReducer(state, setNotificationsOpen(true));
      expect(state.notificationsOpen).toBe(true);
    });

    it('toggles sidebar state', () => {
      let state = getInitialState();
      const initial = state.sidebarCollapsed;

      state = uiReducer(state, toggleSidebar());
      expect(state.sidebarCollapsed).toBe(!initial);
    });

    it('clamps simulated latency between 0ms and 3000ms', () => {
      let state = getInitialState();

      state = uiReducer(state, setSimulatorLatency(850));
      expect(state.simulator.latencyMs).toBe(850);

      // Clamps upper bound
      state = uiReducer(state, setSimulatorLatency(9999));
      expect(state.simulator.latencyMs).toBe(3000);

      // Clamps lower bound
      state = uiReducer(state, setSimulatorLatency(-100));
      expect(state.simulator.latencyMs).toBe(0);
    });

    it('clamps simulated error rate between 0% and 100%', () => {
      let state = getInitialState();

      state = uiReducer(state, setSimulatorErrorRate(35));
      expect(state.simulator.errorRatePercent).toBe(35);

      state = uiReducer(state, setSimulatorErrorRate(150));
      expect(state.simulator.errorRatePercent).toBe(100);

      state = uiReducer(state, setSimulatorErrorRate(-20));
      expect(state.simulator.errorRatePercent).toBe(0);
    });

    it('manages 503 forced offline outage and resets to defaults', () => {
      let state = getInitialState();

      state = uiReducer(state, setForceOfflineError(true));
      expect(state.simulator.forceOfflineError).toBe(true);

      state = uiReducer(state, resetSimulator());
      expect(state.simulator.forceOfflineError).toBe(false);
      expect(state.simulator.latencyMs).toBe(220);
      expect(state.simulator.errorRatePercent).toBe(0);
    });
  });
});
