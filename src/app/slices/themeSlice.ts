import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { ResolvedTheme, ThemeMode } from '@/types';

const THEME_STORAGE_KEY = 'modelsight_theme';

function getSystemTheme(): ResolvedTheme {
  if (typeof window === 'undefined') return 'dark';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function getInitialThemeMode(): ThemeMode {
  if (typeof window === 'undefined') return 'dark';
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === 'light' || stored === 'dark' || stored === 'system') {
      return stored;
    }
  } catch {
    // Ignore storage read errors in restricted environments
  }
  return 'dark';
}

export function resolveTheme(mode: ThemeMode): ResolvedTheme {
  return mode === 'system' ? getSystemTheme() : mode;
}

export function applyThemeToDom(resolved: ResolvedTheme): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.classList.remove('light', 'dark');
  root.classList.add(resolved);
  root.style.colorScheme = resolved;
}

interface ThemeState {
  mode: ThemeMode;
  resolved: ResolvedTheme;
}

const initialMode = getInitialThemeMode();
const initialState: ThemeState = {
  mode: initialMode,
  resolved: resolveTheme(initialMode),
};

const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    setThemeMode(state, action: PayloadAction<ThemeMode>) {
      const mode = action.payload;
      const resolved = resolveTheme(mode);
      state.mode = mode;
      state.resolved = resolved;
      try {
        window.localStorage.setItem(THEME_STORAGE_KEY, mode);
      } catch {
        // Ignore storage write errors
      }
      applyThemeToDom(resolved);
    },
    syncSystemTheme(state) {
      if (state.mode === 'system') {
        const resolved = getSystemTheme();
        state.resolved = resolved;
        applyThemeToDom(resolved);
      }
    },
  },
});

export const { setThemeMode, syncSystemTheme } = themeSlice.actions;
export default themeSlice.reducer;

