export type ThemeMode = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

export type EnvironmentType = 'production' | 'staging' | 'shadow';
export type TimeRangeType = '1h' | '24h' | '7d' | '30d' | '90d';

export type ModelHealthStatus = 'healthy' | 'degraded' | 'critical';
export type SeverityLevel = 'critical' | 'warning' | 'info' | 'healthy';
export type ModelCategory = 'LLM' | 'Classification' | 'Ranking' | 'Embedding' | 'Vision';
export type EngineeringTeam =
  'Core AI' | 'Customer Experience' | 'Risk & Fraud' | 'Search & Growth' | 'Platform Infra';

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

export interface TimeSeriesPoint {
  timestamp: string;
  requests: number;
  prevRequests: number;
  successRate: number;
  prevSuccessRate: number;
  errorRate: number;
  prevErrorRate: number;
  latencyP50: number;
  latencyP95: number;
  latencyP99: number;
  prevLatencyP95: number;
  accuracyScore: number;
  prevAccuracyScore: number;
  tokensPerSec: number;
  costUsd: number;
  prevCostUsd: number;
  driftPsi: number;
  isAnomaly?: boolean;
  anomalyLabel?: string;
}

export interface ModelVersionInfo {
  version: string;
  deployedAt: string;
  trafficSplitPercent: number;
  status: 'active' | 'canary' | 'shadow' | 'archived';
  commitSha: string;
  author: string;
  notes: string;
}

export interface ModelEntity {
  id: string;
  name: string;
  displayName: string;
  provider: string;
  framework: string;
  category: ModelCategory;
  environment: EnvironmentType;
  team: EngineeringTeam;
  status: ModelHealthStatus;
  activeVersion: string;
  endpoint: string;
  slaLatencyMs: number;
  updatedAt: string;
  description: string;
  /* Aggregated 24h / current window metrics */
  requests24h: number;
  requestsDeltaPct: number;
  successRate: number;
  successRateDeltaPct: number;
  errorRate: number;
  errorRateDeltaPct: number;
  latencyP50: number;
  latencyP95: number;
  latencyP99: number;
  latencyDeltaPct: number;
  accuracyScore: number;
  accuracyDeltaPct: number;
  driftPsi: number;
  cost24hUsd: number;
  costDeltaPct: number;
  inputTokens24h: number;
  outputTokens24h: number;
  cachedTokens24h: number;
  qualityScores: {
    groundedness: number;
    relevance: number;
    coherence: number;
    safetyRate: number;
  };
  sparklineRequests: number[];
  sparklineLatency: number[];
  versions: ModelVersionInfo[];
  timeSeries: TimeSeriesPoint[];
}

export interface DriftFeatureMetric {
  featureName: string;
  category: 'Numerical' | 'Categorical' | 'Embedding' | 'Prompt Token';
  psiScore: number;
  ksStat: number;
  status: ModelHealthStatus;
  baselineMean: string;
  productionMean: string;
  hourlyPsi: number[]; // 14 time buckets for heatmap
  baselineDistribution: number[]; // 10 bins
  productionDistribution: number[]; // 10 bins
  distributionBins: string[];
}

export interface IncidentTimelineEvent {
  id: string;
  timestamp: string;
  actor: string;
  type: 'triggered' | 'diagnostic' | 'acknowledged' | 'resolved' | 'note';
  message: string;
}

export interface IncidentEntity {
  id: string;
  title: string;
  summary: string;
  severity: 'critical' | 'warning' | 'info';
  status: 'active' | 'acknowledged' | 'resolved';
  modelId: string;
  modelName: string;
  environment: EnvironmentType;
  team: EngineeringTeam;
  metricName: string;
  metricValue: string;
  thresholdValue: string;
  triggeredAt: string;
  acknowledgedAt?: string;
  resolvedAt?: string;
  affectedEndpoint: string;
  rootCauseHint: string;
  timeline: IncidentTimelineEvent[];
}

export interface AlertRuleEntity {
  id: string;
  name: string;
  modelId: string; // 'all' or specific model id
  environment: EnvironmentType | 'all';
  metric: 'latencyP95' | 'errorRate' | 'driftPsi' | 'costUsd' | 'accuracyScore';
  condition: 'gt' | 'lt' | 'pct_change';
  threshold: number;
  window: '5m' | '15m' | '1h' | '24h';
  severity: 'critical' | 'warning' | 'info';
  channel: 'Slack #ml-ops-alerts' | 'PagerDuty Primary' | 'Webhook Ops' | 'Email FinOps';
  enabled: boolean;
  lastTriggeredAt?: string;
}

export interface KpiMetricCardData {
  id: 'requests' | 'successRate' | 'latencyP95' | 'errorRate' | 'totalCost' | 'activeModels';
  label: string;
  rawValue: number;
  previousValue: number;
  deltaPercent: number;
  /** Whether an increase in this metric is positive ('up-good') or negative ('down-good') */
  trendSentiment: 'up-good' | 'down-good' | 'neutral';
  unit: 'count' | 'percent' | 'ms' | 'currency' | 'ratio';
  subtitle: string;
  sparkline: number[];
  status: ModelHealthStatus;
}

export interface ErrorBreakdownItem {
  code: string;
  label: string;
  count: number;
  percentage: number;
  color: string;
}

export interface OverviewDashboardPayload {
  kpis: KpiMetricCardData[];
  aggregatedSeries: TimeSeriesPoint[];
  topModels: ModelEntity[];
  activeIncidents: IncidentEntity[];
  errorBreakdown: ErrorBreakdownItem[];
  filterEcho: GlobalFilterState;
  lastUpdatedIso: string;
}

export interface LogEntry {
  id: string;
  traceId: string;
  timestamp: string;
  modelId: string;
  modelName: string;
  environment: EnvironmentType;
  statusCode: number;
  latencyMs: number;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  costUsd: number;
  userHash: string;
  promptSnippet: string;
  completionSnippet: string;
  fullPrompt: string;
  fullCompletion: string;
  requestPayload: Record<string, unknown>;
  responsePayload: Record<string, unknown>;
  metadata: {
    clientSdk: string;
    ipCountry: string;
    cached: boolean;
    vectorDistance?: number;
    guardrailScore?: number;
    finishReason?: 'stop' | 'length' | 'tool_call' | 'guardrail_block';
  };
}

export interface LiveTelemetryTick {
  timestamp: number;
  timeLabel: string;
  rps: number;
  latencyP50: number;
  latencyP95: number;
  errorRatePct: number;
  activeTokensSec: number;
}

export interface LiveAnomalyEvent {
  id: string;
  timestamp: string;
  type: 'latency_spike' | 'error_burst' | 'drift_detected' | 'rate_limit' | 'guardrail_flag';
  severity: 'critical' | 'warning' | 'info';
  modelName: string;
  message: string;
  value: string;
}
