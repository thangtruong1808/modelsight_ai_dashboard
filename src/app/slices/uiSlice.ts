import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { GlobalFilterState, NetworkSimulatorState } from '@/types';

const SIDEBAR_STORAGE_KEY = 'modelsight_sidebar_collapsed';

function getInitialSidebarCollapsed(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(SIDEBAR_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

interface UiState {
  sidebarCollapsed: boolean;
  mobileNavOpen: boolean;
  commandPaletteOpen: boolean;
  notificationsOpen: boolean;
  simulator: NetworkSimulatorState;
  globalFilters: GlobalFilterState;
}

const initialState: UiState = {
  sidebarCollapsed: getInitialSidebarCollapsed(),
  mobileNavOpen: false,
  commandPaletteOpen: false,
  notificationsOpen: false,
  simulator: {
    latencyMs: 220,
    errorRatePercent: 0,
    forceOfflineError: false,
  },
  globalFilters: {
    environment: 'production',
    timeRange: '7d',
    compareToPrevious: true,
    team: 'all',
    modelId: 'all',
  },
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar(state) {
      state.sidebarCollapsed = !state.sidebarCollapsed;
      try {
        window.localStorage.setItem(SIDEBAR_STORAGE_KEY, String(state.sidebarCollapsed));
      } catch {
        // Ignore storage errors
      }
    },
    setSidebarCollapsed(state, action: PayloadAction<boolean>) {
      state.sidebarCollapsed = action.payload;
      try {
        window.localStorage.setItem(SIDEBAR_STORAGE_KEY, String(action.payload));
      } catch {
        // Ignore storage errors
      }
    },
    setMobileNavOpen(state, action: PayloadAction<boolean>) {
      state.mobileNavOpen = action.payload;
    },
    setCommandPaletteOpen(state, action: PayloadAction<boolean>) {
      state.commandPaletteOpen = action.payload;
    },
    setNotificationsOpen(state, action: PayloadAction<boolean>) {
      state.notificationsOpen = action.payload;
    },
    setSimulatorLatency(state, action: PayloadAction<number>) {
      state.simulator.latencyMs = Math.max(0, Math.min(3000, action.payload));
    },
    setSimulatorErrorRate(state, action: PayloadAction<number>) {
      state.simulator.errorRatePercent = Math.max(0, Math.min(100, action.payload));
    },
    setForceOfflineError(state, action: PayloadAction<boolean>) {
      state.simulator.forceOfflineError = action.payload;
    },
    resetSimulator(state) {
      state.simulator = {
        latencyMs: 220,
        errorRatePercent: 0,
        forceOfflineError: false,
      };
    },
    updateGlobalFilters(state, action: PayloadAction<Partial<GlobalFilterState>>) {
      state.globalFilters = {
        ...state.globalFilters,
        ...action.payload,
      };
    },
    resetGlobalFilters(state) {
      state.globalFilters = initialState.globalFilters;
    },
  },
});

export const {
  toggleSidebar,
  setSidebarCollapsed,
  setMobileNavOpen,
  setCommandPaletteOpen,
  setNotificationsOpen,
  setSimulatorLatency,
  setSimulatorErrorRate,
  setForceOfflineError,
  resetSimulator,
  updateGlobalFilters,
  resetGlobalFilters,
} = uiSlice.actions;

export default uiSlice.reducer;
