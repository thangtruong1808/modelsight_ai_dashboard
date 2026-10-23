export type ThemeMode = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

export type EnvironmentType = 'production' | 'staging' | 'shadow';
export type TimeRangeType = '1h' | '24h' | '7d' | '30d' | '90d';

export type ModelHealthStatus = 'healthy' | 'degraded' | 'critical';
export type SeverityLevel = 'critical' | 'warning' | 'info' | 'healthy';

export interface NetworkSimulatorState {
  latencyMs: number;
  errorRatePercent: number;
  forceOfflineError: boolean;
}

export interface GlobalFilterState {
  environment: EnvironmentType | 'all';
  timeRange: TimeRangeType;
  compareToPrevious: boolean;
  team: string;
  modelId: string;
}

