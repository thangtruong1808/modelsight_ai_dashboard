import { Faker, en } from '@faker-js/faker';
import { subDays, subHours, formatISO } from 'date-fns';
import type {
  AlertRuleEntity,
  DriftFeatureMetric,
  EngineeringTeam,
  EnvironmentType,
  ErrorBreakdownItem,
  GlobalFilterState,
  IncidentEntity,
  KpiMetricCardData,
  ModelCategory,
  ModelEntity,
  ModelHealthStatus,
  OverviewDashboardPayload,
  TimeSeriesPoint,
} from '@/types';

/**
 * Deterministic reference timestamp so that charts, deltas, and unit tests
 * produce consistent, realistic numbers on every run.
 */
export const SEED_ANCHOR_DATE = new Date('2026-10-24T09:00:00.000Z');

interface ModelBlueprint {
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
  baseRph: number; // Base requests per hour
  baseLatencyP50: number;
  baseLatencyP95: number;
  baseErrorRate: number;
  baseAccuracy: number;
  baseDriftPsi: number;
  costPer1kReq: number;
  description: string;
}

const MODEL_BLUEPRINTS: ModelBlueprint[] = [
  {
    id: 'claude-3-7-sonnet-prod',
    name: 'claude-3-7-sonnet-prod',
    displayName: 'Claude 3.7 Sonnet (Enterprise Orchestrator)',
    provider: 'Anthropic Bedrock',
    framework: 'vLLM / Anthropic API',
    category: 'LLM',
    environment: 'production',
    team: 'Core AI',
    status: 'healthy',
    activeVersion: 'v3.7.2-prod',
    endpoint: '/v1/chat/orchestrator',
    slaLatencyMs: 650,
    baseRph: 48_500,
    baseLatencyP50: 245,
    baseLatencyP95: 468,
    baseErrorRate: 0.14,
    baseAccuracy: 96.4,
    baseDriftPsi: 0.08,
    costPer1kReq: 4.85,
    description:
      'Primary multi-step reasoning and tool-calling agent backing enterprise copilot workflows.',
  },
  {
    id: 'gpt-4o-customer-support',
    name: 'gpt-4o-customer-support',
    displayName: 'GPT-4o Omni Support Concierge',
    provider: 'Azure OpenAI',
    framework: 'Semantic Kernel',
    category: 'LLM',
    environment: 'production',
    team: 'Customer Experience',
    status: 'degraded',
    activeVersion: 'v4.2.0-canary',
    endpoint: '/v1/support/concierge',
    slaLatencyMs: 700,
    baseRph: 62_400,
    baseLatencyP50: 340,
    baseLatencyP95: 742,
    baseErrorRate: 1.48,
    baseAccuracy: 93.8,
    baseDriftPsi: 0.24,
    costPer1kReq: 5.4,
    description:
      'Customer ticket resolution, refund eligibility synthesis, and multilingual live chat.',
  },
  {
    id: 'llama-3-3-70b-rag',
    name: 'llama-3-3-70b-rag',
    displayName: 'Llama 3.3 70B Instruct (Knowledge RAG)',
    provider: 'Internal GPU Cluster (H100)',
    framework: 'TensorRT-LLM',
    category: 'LLM',
    environment: 'production',
    team: 'Core AI',
    status: 'healthy',
    activeVersion: 'v2.4.1',
    endpoint: '/v1/rag/knowledge-synthesis',
    slaLatencyMs: 450,
    baseRph: 84_000,
    baseLatencyP50: 168,
    baseLatencyP95: 312,
    baseErrorRate: 0.22,
    baseAccuracy: 94.9,
    baseDriftPsi: 0.11,
    costPer1kReq: 1.35,
    description:
      'Self-hosted FP8 quantized Llama 3.3 70B serving enterprise document Q&A with citation grounding.',
  },
  {
    id: 'gemini-2-5-flash-router',
    name: 'gemini-2-5-flash-router',
    displayName: 'Gemini 2.5 Flash Intent Router',
    provider: 'Google Vertex AI',
    framework: 'Vertex Endpoint',
    category: 'LLM',
    environment: 'production',
    team: 'Platform Infra',
    status: 'healthy',
    activeVersion: 'v1.9.0',
    endpoint: '/v1/router/classify-intent',
    slaLatencyMs: 200,
    baseRph: 145_000,
    baseLatencyP50: 68,
    baseLatencyP95: 134,
    baseErrorRate: 0.08,
    baseAccuracy: 98.1,
    baseDriftPsi: 0.06,
    costPer1kReq: 0.42,
    description:
      'Ultra-low-latency semantic prompt router classifying complexity and guardrail policy before LLM dispatch.',
  },
  {
    id: 'fraud-shield-xgboost-v4',
    name: 'fraud-shield-xgboost-v4',
    displayName: 'FraudShield Real-Time Transaction Scorer',
    provider: 'AWS SageMaker',
    framework: 'XGBoost / ONNX Runtime',
    category: 'Classification',
    environment: 'production',
    team: 'Risk & Fraud',
    status: 'critical',
    activeVersion: 'v4.1.3',
    endpoint: '/v2/risk/transaction-score',
    slaLatencyMs: 65,
    baseRph: 210_000,
    baseLatencyP50: 24,
    baseLatencyP95: 78,
    baseErrorRate: 2.35,
    baseAccuracy: 91.2,
    baseDriftPsi: 0.34,
    costPer1kReq: 0.18,
    description:
      'Sub-50ms payment velocity and card-not-present fraud probability scorer across global checkout.',
  },
  {
    id: 'search-reranker-bge-v2',
    name: 'search-reranker-bge-v2',
    displayName: 'BGE-Large Cross-Encoder Reranker',
    provider: 'Internal GPU Cluster (L40S)',
    framework: 'Triton Inference Server',
    category: 'Ranking',
    environment: 'production',
    team: 'Search & Growth',
    status: 'healthy',
    activeVersion: 'v2.2.0',
    endpoint: '/v1/search/rerank',
    slaLatencyMs: 120,
    baseRph: 128_000,
    baseLatencyP50: 42,
    baseLatencyP95: 89,
    baseErrorRate: 0.11,
    baseAccuracy: 95.7,
    baseDriftPsi: 0.09,
    costPer1kReq: 0.28,
    description:
      'Second-stage neural passage reranker optimizing top-10 hybrid vector + BM25 retrieval hits.',
  },
  {
    id: 'text-embedding-v3-large',
    name: 'text-embedding-v3-large',
    displayName: 'Semantic Vectorizer v3 (3072-dim)',
    provider: 'Internal GPU Cluster (A100)',
    framework: 'Text Embeddings Inference',
    category: 'Embedding',
    environment: 'production',
    team: 'Search & Growth',
    status: 'healthy',
    activeVersion: 'v3.0.4',
    endpoint: '/v1/embeddings/encode',
    slaLatencyMs: 90,
    baseRph: 195_000,
    baseLatencyP50: 29,
    baseLatencyP95: 58,
    baseErrorRate: 0.05,
    baseAccuracy: 99.1,
    baseDriftPsi: 0.07,
    costPer1kReq: 0.14,
    description:
      'High-throughput dense embedding pipeline indexing real-time knowledge articles and user queries.',
  },
  {
    id: 'churn-predictor-lightgbm',
    name: 'churn-predictor-lightgbm',
    displayName: 'Enterprise Account Churn Propensity',
    provider: 'Databricks Model Serving',
    framework: 'LightGBM / MLflow',
    category: 'Classification',
    environment: 'production',
    team: 'Customer Experience',
    status: 'healthy',
    activeVersion: 'v2.8.1',
    endpoint: '/v1/crm/churn-propensity',
    slaLatencyMs: 150,
    baseRph: 34_000,
    baseLatencyP50: 48,
    baseLatencyP95: 104,
    baseErrorRate: 0.19,
    baseAccuracy: 94.3,
    baseDriftPsi: 0.12,
    costPer1kReq: 0.22,
    description:
      'Predicts 30-day renewal risk from product telemetry, seat utilization, and support sentiment.',
  },
  {
    id: 'pii-guardrail-deberta',
    name: 'pii-guardrail-deberta',
    displayName: 'Zero-Trust PII & Prompt Injection Guard',
    provider: 'Internal GPU Cluster (L4)',
    framework: 'PyTorch / TorchScript',
    category: 'Classification',
    environment: 'production',
    team: 'Platform Infra',
    status: 'healthy',
    activeVersion: 'v5.0.1',
    endpoint: '/v1/guardrails/inspect',
    slaLatencyMs: 80,
    baseRph: 176_000,
    baseLatencyP50: 21,
    baseLatencyP95: 47,
    baseErrorRate: 0.04,
    baseAccuracy: 99.3,
    baseDriftPsi: 0.05,
    costPer1kReq: 0.11,
    description:
      'Inline token-level PII redaction, jailbreak detection, and policy compliance classifier.',
  },
  {
    id: 'recsys-two-tower-v3',
    name: 'recsys-two-tower-v3',
    displayName: 'Personalized Feed Two-Tower Retriever',
    provider: 'Google Kubernetes Engine',
    framework: 'TensorFlow Recommenders',
    category: 'Ranking',
    environment: 'production',
    team: 'Search & Growth',
    status: 'degraded',
    activeVersion: 'v3.4.0',
    endpoint: '/v1/recommendations/feed',
    slaLatencyMs: 140,
    baseRph: 94_000,
    baseLatencyP50: 66,
    baseLatencyP95: 149,
    baseErrorRate: 0.88,
    baseAccuracy: 92.5,
    baseDriftPsi: 0.22,
    costPer1kReq: 0.31,
    description:
      'Real-time candidate generation matching user session embeddings against 5M catalog items.',
  },
  {
    id: 'doc-vision-ocr-v2',
    name: 'doc-vision-ocr-v2',
    displayName: 'DocVision Multimodal Invoice Extractor',
    provider: 'Internal GPU Cluster (H100)',
    framework: 'vLLM Vision / Qwen2.5-VL',
    category: 'Vision',
    environment: 'production',
    team: 'Risk & Fraud',
    status: 'healthy',
    activeVersion: 'v2.1.0',
    endpoint: '/v1/vision/invoice-parse',
    slaLatencyMs: 950,
    baseRph: 22_500,
    baseLatencyP50: 410,
    baseLatencyP95: 790,
    baseErrorRate: 0.31,
    baseAccuracy: 96.8,
    baseDriftPsi: 0.1,
    costPer1kReq: 3.1,
    description:
      'Structured JSON key-value extraction and tamper detection for KYC documents and invoices.',
  },
  {
    id: 'deepseek-r1-code-staging',
    name: 'deepseek-r1-code-staging',
    displayName: 'DeepSeek-R1 Distill 32B (SQL Synthesizer)',
    provider: 'Internal GPU Cluster (H100)',
    framework: 'SGLang',
    category: 'LLM',
    environment: 'staging',
    team: 'Core AI',
    status: 'healthy',
    activeVersion: 'v0.9.4-rc',
    endpoint: '/staging/v1/sql/generate',
    slaLatencyMs: 900,
    baseRph: 14_200,
    baseLatencyP50: 380,
    baseLatencyP95: 695,
    baseErrorRate: 0.45,
    baseAccuracy: 95.2,
    baseDriftPsi: 0.09,
    costPer1kReq: 1.95,
    description:
      'Staging evaluation of reasoning-distilled text-to-SQL generation over warehouse schemas.',
  },
  {
    id: 'credit-underwrite-catboost-staging',
    name: 'credit-underwrite-catboost-staging',
    displayName: 'CatBoost Commercial Credit Underwriter',
    provider: 'AWS SageMaker Staging',
    framework: 'CatBoost',
    category: 'Classification',
    environment: 'staging',
    team: 'Risk & Fraud',
    status: 'degraded',
    activeVersion: 'v6.0.0-stage',
    endpoint: '/staging/v2/credit/underwrite',
    slaLatencyMs: 110,
    baseRph: 9_800,
    baseLatencyP50: 54,
    baseLatencyP95: 122,
    baseErrorRate: 1.15,
    baseAccuracy: 92.9,
    baseDriftPsi: 0.21,
    costPer1kReq: 0.24,
    description:
      'Pre-production validation of macroeconomic feature adjustments for credit limit underwriting.',
  },
  {
    id: 'mistral-small-3-shadow',
    name: 'mistral-small-3-shadow',
    displayName: 'Mistral Small 3 24B (Shadow Traffic Mirror)',
    provider: 'Internal GPU Cluster (A100)',
    framework: 'vLLM',
    category: 'LLM',
    environment: 'shadow',
    team: 'Customer Experience',
    status: 'healthy',
    activeVersion: 'v3.1.0-shadow',
    endpoint: '/shadow/v1/support/concierge',
    slaLatencyMs: 500,
    baseRph: 31_200,
    baseLatencyP50: 192,
    baseLatencyP95: 365,
    baseErrorRate: 0.29,
    baseAccuracy: 94.1,
    baseDriftPsi: 0.13,
    costPer1kReq: 0.92,
    description:
      'Shadow-mirroring 50% of GPT-4o customer support traffic to benchmark cost-to-quality parity.',
  },
];

function createSeededFaker(seed = 42): Faker {
  const instance = new Faker({ locale: [en] });
  instance.seed(seed);
  return instance;
}

function buildModelTimeSeries(
  blueprint: ModelBlueprint,
  faker: Faker,
  days = 30
): TimeSeriesPoint[] {
  const series: TimeSeriesPoint[] = [];

  for (let i = days - 1; i >= 0; i--) {
    const pointDate = subDays(SEED_ANCHOR_DATE, i);
    const dayPhase = Math.sin((i / 4.5) * Math.PI);
    const noise = faker.number.float({ min: -0.07, max: 0.08 });

    // Inject realistic anomaly spike on recent days for degraded/critical models
    const isAnomalyDay =
      (blueprint.status === 'critical' && (i === 1 || i === 4)) ||
      (blueprint.status === 'degraded' && i === 2);

    const dailyRequests = Math.round(
      blueprint.baseRph * 24 * (1 + dayPhase * 0.12 + noise) * (isAnomalyDay ? 1.24 : 1)
    );
    const prevRequests = Math.round(
      blueprint.baseRph * 24 * 0.91 * (1 + Math.cos((i / 5) * Math.PI) * 0.1)
    );

    const errorRate = Number(
      Math.max(
        0.02,
        blueprint.baseErrorRate *
          (1 + faker.number.float({ min: -0.2, max: 0.25 })) *
          (isAnomalyDay ? 2.6 : 1)
      ).toFixed(2)
    );
    const prevErrorRate = Number(
      Math.max(
        0.02,
        blueprint.baseErrorRate * 0.92 * (1 + faker.number.float({ min: -0.15, max: 0.15 }))
      ).toFixed(2)
    );

    const successRate = Number((100 - errorRate).toFixed(2));
    const prevSuccessRate = Number((100 - prevErrorRate).toFixed(2));

    const latencyP50 = Math.round(
      blueprint.baseLatencyP50 * (1 + dayPhase * 0.06 + noise * 0.5) * (isAnomalyDay ? 1.32 : 1)
    );
    const latencyP95 = Math.round(
      blueprint.baseLatencyP95 * (1 + dayPhase * 0.08 + noise * 0.7) * (isAnomalyDay ? 1.45 : 1)
    );
    const latencyP99 = Math.round(latencyP95 * faker.number.float({ min: 1.28, max: 1.48 }));
    const prevLatencyP95 = Math.round(
      blueprint.baseLatencyP95 * 0.96 * (1 + faker.number.float({ min: -0.06, max: 0.07 }))
    );

    const accuracyScore = Number(
      Math.min(
        99.8,
        Math.max(
          82.0,
          blueprint.baseAccuracy +
            faker.number.float({ min: -0.6, max: 0.6 }) -
            (isAnomalyDay ? 2.4 : 0)
        )
      ).toFixed(2)
    );
    const prevAccuracyScore = Number(
      Math.min(
        99.8,
        blueprint.baseAccuracy - 0.3 + faker.number.float({ min: -0.4, max: 0.4 })
      ).toFixed(2)
    );

    const costUsd = Number(((dailyRequests / 1000) * blueprint.costPer1kReq).toFixed(2));
    const prevCostUsd = Number(((prevRequests / 1000) * blueprint.costPer1kReq * 0.98).toFixed(2));

    const driftPsi = Number(
      Math.max(
        0.02,
        blueprint.baseDriftPsi *
          (1 + faker.number.float({ min: -0.15, max: 0.18 })) *
          (isAnomalyDay ? 1.45 : 1)
      ).toFixed(3)
    );

    const tokensPerSec =
      blueprint.category === 'LLM'
        ? Math.round((dailyRequests / 86400) * 680)
        : Math.round((dailyRequests / 86400) * 45);

    series.push({
      timestamp: formatISO(pointDate),
      requests: dailyRequests,
      prevRequests,
      successRate,
      prevSuccessRate,
      errorRate,
      prevErrorRate,
      latencyP50,
      latencyP95,
      latencyP99,
      prevLatencyP95,
      accuracyScore,
      prevAccuracyScore,
      tokensPerSec,
      costUsd,
      prevCostUsd,
      driftPsi,
      isAnomaly: isAnomalyDay,
      anomalyLabel: isAnomalyDay ? `${blueprint.displayName} SLA/Drift spike` : undefined,
    });
  }

  return series;
}

export interface SeedDatabase {
  models: ModelEntity[];
  driftFeatures: DriftFeatureMetric[];
  incidents: IncidentEntity[];
  alertRules: AlertRuleEntity[];
  errorBreakdown: ErrorBreakdownItem[];
}

let cachedDatabase: SeedDatabase | null = null;

export function getSeedDatabase(): SeedDatabase {
  if (cachedDatabase) {
    return cachedDatabase;
  }

  const faker = createSeededFaker(42);

  const models: ModelEntity[] = MODEL_BLUEPRINTS.map((bp, idx) => {
    const timeSeries = buildModelTimeSeries(bp, faker, 30);
    const recent7 = timeSeries.slice(-7);
    const prev7 = timeSeries.slice(-14, -7);

    const sumRecentReq = recent7.reduce((acc, p) => acc + p.requests, 0);
    const sumPrevReq = prev7.reduce((acc, p) => acc + p.requests, 0);
    const lastPoint = timeSeries[timeSeries.length - 1]!;

    const requests24h = lastPoint.requests;
    const requestsDeltaPct = Number(
      (((sumRecentReq - sumPrevReq) / Math.max(1, sumPrevReq)) * 100).toFixed(1)
    );

    const avgErrorRecent =
      recent7.reduce((acc, p) => acc + p.errorRate, 0) / Math.max(1, recent7.length);
    const avgErrorPrev = prev7.reduce((acc, p) => acc + p.errorRate, 0) / Math.max(1, prev7.length);
    const errorRateDeltaPct = Number(
      (((avgErrorRecent - avgErrorPrev) / Math.max(0.01, avgErrorPrev)) * 100).toFixed(1)
    );

    const avgLatencyRecent =
      recent7.reduce((acc, p) => acc + p.latencyP95, 0) / Math.max(1, recent7.length);
    const avgLatencyPrev =
      prev7.reduce((acc, p) => acc + p.latencyP95, 0) / Math.max(1, prev7.length);
    const latencyDeltaPct = Number(
      (((avgLatencyRecent - avgLatencyPrev) / Math.max(1, avgLatencyPrev)) * 100).toFixed(1)
    );

    const inputTokens24h = bp.category === 'LLM' ? requests24h * 520 : requests24h * 38;
    const outputTokens24h = bp.category === 'LLM' ? requests24h * 240 : requests24h * 12;
    const cachedTokens24h = Math.round(inputTokens24h * 0.34);

    return {
      id: bp.id,
      name: bp.name,
      displayName: bp.displayName,
      provider: bp.provider,
      framework: bp.framework,
      category: bp.category,
      environment: bp.environment,
      team: bp.team,
      status: bp.status,
      activeVersion: bp.activeVersion,
      endpoint: bp.endpoint,
      slaLatencyMs: bp.slaLatencyMs,
      updatedAt: formatISO(subHours(SEED_ANCHOR_DATE, (idx % 9) + 1)),
      description: bp.description,
      requests24h,
      requestsDeltaPct,
      successRate: lastPoint.successRate,
      successRateDeltaPct: Number((lastPoint.successRate - lastPoint.prevSuccessRate).toFixed(2)),
      errorRate: lastPoint.errorRate,
      errorRateDeltaPct,
      latencyP50: lastPoint.latencyP50,
      latencyP95: lastPoint.latencyP95,
      latencyP99: lastPoint.latencyP99,
      latencyDeltaPct,
      accuracyScore: lastPoint.accuracyScore,
      accuracyDeltaPct: Number((lastPoint.accuracyScore - lastPoint.prevAccuracyScore).toFixed(2)),
      driftPsi: lastPoint.driftPsi,
      cost24hUsd: lastPoint.costUsd,
      costDeltaPct: Number(
        (
          ((lastPoint.costUsd - lastPoint.prevCostUsd) / Math.max(1, lastPoint.prevCostUsd)) *
          100
        ).toFixed(1)
      ),
      inputTokens24h,
      outputTokens24h,
      cachedTokens24h,
      qualityScores: {
        groundedness: Number(faker.number.float({ min: 91.5, max: 98.8 }).toFixed(1)),
        relevance: Number(faker.number.float({ min: 92.0, max: 99.1 }).toFixed(1)),
        coherence: Number(faker.number.float({ min: 94.0, max: 99.4 }).toFixed(1)),
        safetyRate: Number(faker.number.float({ min: 99.2, max: 99.98 }).toFixed(2)),
      },
      sparklineRequests: timeSeries.slice(-14).map((p) => p.requests),
      sparklineLatency: timeSeries.slice(-14).map((p) => p.latencyP95),
      versions: [
        {
          version: bp.activeVersion,
          deployedAt: formatISO(subDays(SEED_ANCHOR_DATE, 3)),
          trafficSplitPercent: bp.status === 'degraded' ? 85 : 100,
          status: 'active',
          commitSha: faker.git.commitSha({ length: 7 }),
          author: 'alex.chen',
          notes: 'Production release with dynamicKV cache compression enabled.',
        },
        {
          version: `${bp.activeVersion}-canary`,
          deployedAt: formatISO(subHours(SEED_ANCHOR_DATE, 14)),
          trafficSplitPercent: bp.status === 'degraded' ? 15 : 0,
          status: bp.status === 'degraded' ? 'canary' : 'archived',
          commitSha: faker.git.commitSha({ length: 7 }),
          author: 'priya.nair',
          notes: 'Updated system prompt guardrail & temperature calibration.',
        },
      ],
      timeSeries,
    };
  });

  const incidents: IncidentEntity[] = [
    {
      id: 'INC-2409',
      title: 'PSI Drift Breach & False-Positive Spike on FraudShield v4',
      summary:
        'Feature `card_velocity_15m` shifted +0.34 PSI following EMEA holiday flash sale, elevating p95 latency and decline rate.',
      severity: 'critical',
      status: 'active',
      modelId: 'fraud-shield-xgboost-v4',
      modelName: 'FraudShield Real-Time Transaction Scorer',
      environment: 'production',
      team: 'Risk & Fraud',
      metricName: 'Feature Drift PSI',
      metricValue: '0.342 PSI',
      thresholdValue: '0.250 PSI',
      triggeredAt: formatISO(subHours(SEED_ANCHOR_DATE, 2)),
      affectedEndpoint: '/v2/risk/transaction-score',
      rootCauseHint:
        'Upstream payment gateway batch retry burst altered 15-minute velocity distribution.',
      timeline: [
        {
          id: 'ev-1',
          timestamp: formatISO(subHours(SEED_ANCHOR_DATE, 2)),
          actor: 'ModelSight Anomaly Engine',
          type: 'triggered',
          message: 'PSI score crossed 0.25 critical threshold (observed: 0.342).',
        },
        {
          id: 'ev-2',
          timestamp: formatISO(subHours(SEED_ANCHOR_DATE, 1)),
          actor: 'Automated Root-Cause Analyzer',
          type: 'diagnostic',
          message:
            'Identified `card_velocity_15m` and `ip_asn_entropy` as top 2 contributing drift features.',
        },
      ],
    },
    {
      id: 'INC-2408',
      title: 'Tail Latency (p95 > 700ms) on GPT-4o Omni Support Concierge',
      summary:
        'Azure OpenAI East-US region experiencing elevated time-to-first-token (TTFT) on prompts exceeding 6k context tokens.',
      severity: 'warning',
      status: 'active',
      modelId: 'gpt-4o-customer-support',
      modelName: 'GPT-4o Omni Support Concierge',
      environment: 'production',
      team: 'Customer Experience',
      metricName: 'p95 Latency',
      metricValue: '742 ms',
      thresholdValue: '700 ms',
      triggeredAt: formatISO(subHours(SEED_ANCHOR_DATE, 5)),
      affectedEndpoint: '/v1/support/concierge',
      rootCauseHint:
        'Uncompressed knowledge-base snippets injected into system prompt increased average input tokens by 38%.',
      timeline: [
        {
          id: 'ev-3',
          timestamp: formatISO(subHours(SEED_ANCHOR_DATE, 5)),
          actor: 'ModelSight SLA Monitor',
          type: 'triggered',
          message: 'Rolling 15m p95 latency reached 742ms (SLA threshold: 700ms).',
        },
      ],
    },
    {
      id: 'INC-2407',
      title: 'Candidate Embedding Staleness on Personalized Feed Two-Tower',
      summary:
        'Item catalog vector index lag exceeded 20 minutes, causing mild click-through degradation.',
      severity: 'warning',
      status: 'acknowledged',
      modelId: 'recsys-two-tower-v3',
      modelName: 'Personalized Feed Two-Tower Retriever',
      environment: 'production',
      team: 'Search & Growth',
      metricName: 'Embedding Drift PSI',
      metricValue: '0.224 PSI',
      thresholdValue: '0.200 PSI',
      triggeredAt: formatISO(subHours(SEED_ANCHOR_DATE, 9)),
      acknowledgedAt: formatISO(subHours(SEED_ANCHOR_DATE, 7)),
      affectedEndpoint: '/v1/recommendations/feed',
      rootCauseHint: 'Kafka consumer group rebalance delayed incremental vector upsert.',
      timeline: [
        {
          id: 'ev-4',
          timestamp: formatISO(subHours(SEED_ANCHOR_DATE, 9)),
          actor: 'ModelSight Drift Monitor',
          type: 'triggered',
          message: 'Cosine distance shift detected on user-session embedding tower.',
        },
        {
          id: 'ev-5',
          timestamp: formatISO(subHours(SEED_ANCHOR_DATE, 7)),
          actor: 'Alex Chen',
          type: 'acknowledged',
          message: 'Acknowledged incident; scaling vector ingestion workers from 8 to 16.',
        },
      ],
    },
    {
      id: 'INC-2404',
      title: 'Rate-Limit 429 Burst Resolved via Semantic Router Failover',
      summary:
        'Automatic fallback to self-hosted Llama 3.3 70B absorbed traffic spike with zero user-facing downtime.',
      severity: 'info',
      status: 'resolved',
      modelId: 'claude-3-7-sonnet-prod',
      modelName: 'Claude 3.7 Sonnet (Enterprise Orchestrator)',
      environment: 'production',
      team: 'Core AI',
      metricName: 'HTTP 429 Rate',
      metricValue: '1.85%',
      thresholdValue: '1.00%',
      triggeredAt: formatISO(subDays(SEED_ANCHOR_DATE, 1)),
      acknowledgedAt: formatISO(subHours(SEED_ANCHOR_DATE, 23)),
      resolvedAt: formatISO(subHours(SEED_ANCHOR_DATE, 22)),
      affectedEndpoint: '/v1/chat/orchestrator',
      rootCauseHint: 'Enterprise batch evaluation job shared production quota.',
      timeline: [
        {
          id: 'ev-6',
          timestamp: formatISO(subDays(SEED_ANCHOR_DATE, 1)),
          actor: 'ModelSight Gateway',
          type: 'triggered',
          message: '429 rate exceeded 1.0% over 5m window.',
        },
        {
          id: 'ev-7',
          timestamp: formatISO(subHours(SEED_ANCHOR_DATE, 22)),
          actor: 'Auto-Remediation Policy',
          type: 'resolved',
          message: 'Throttled batch job and verified error rate returned to 0.14%.',
        },
      ],
    },
  ];

  const errorBreakdown: ErrorBreakdownItem[] = [
    {
      code: 'RATE_LIMIT_429',
      label: 'Upstream Token Rate Limit (429)',
      count: 4_820,
      percentage: 38.4,
      color: '#f59e0b',
    },
    {
      code: 'CONTEXT_OVERFLOW_400',
      label: 'Context Window Exceeded',
      count: 3_190,
      percentage: 25.4,
      color: '#6366f1',
    },
    {
      code: 'TIMEOUT_504',
      label: 'Inference Deadline Exceeded (504)',
      count: 2_210,
      percentage: 17.6,
      color: '#f43f5e',
    },
    {
      code: 'GUARDRAIL_BLOCKED_422',
      label: 'PII / Prompt Injection Blocked',
      count: 1_480,
      percentage: 11.8,
      color: '#06b6d4',
    },
    {
      code: 'SCHEMA_PARSE_502',
      label: 'Structured JSON Validation Error',
      count: 850,
      percentage: 6.8,
      color: '#8b5cf6',
    },
  ];

  const driftFeatures: DriftFeatureMetric[] = [
    {
      featureName: 'card_velocity_15m',
      category: 'Numerical',
      psiScore: 0.342,
      ksStat: 0.29,
      status: 'critical',
      baselineMean: '2.14 tx/15m',
      productionMean: '4.85 tx/15m',
      hourlyPsi: [
        0.09, 0.1, 0.11, 0.12, 0.14, 0.16, 0.19, 0.22, 0.25, 0.28, 0.31, 0.33, 0.34, 0.342,
      ],
      baselineDistribution: [32, 26, 18, 11, 6, 3, 2, 1, 0.6, 0.4],
      productionDistribution: [14, 17, 19, 16, 12, 9, 6, 4, 2, 1],
      distributionBins: ['0-1', '1-2', '2-3', '3-4', '4-5', '5-6', '6-8', '8-10', '10-15', '15+'],
    },
    {
      featureName: 'prompt_context_token_len',
      category: 'Prompt Token',
      psiScore: 0.244,
      ksStat: 0.21,
      status: 'degraded',
      baselineMean: '1,840 tokens',
      productionMean: '2,910 tokens',
      hourlyPsi: [
        0.08, 0.09, 0.1, 0.12, 0.13, 0.15, 0.16, 0.18, 0.19, 0.21, 0.22, 0.23, 0.24, 0.244,
      ],
      baselineDistribution: [15, 24, 26, 16, 9, 5, 2.5, 1.5, 0.6, 0.4],
      productionDistribution: [8, 14, 20, 21, 15, 10, 6, 3.5, 1.5, 1],
      distributionBins: ['<512', '1k', '2k', '3k', '4k', '6k', '8k', '12k', '16k', '32k+'],
    },
  ];

  const alertRules: AlertRuleEntity[] = [
    {
      id: 'rule-1',
      name: 'Production LLM Tail Latency SLA (>650ms)',
      modelId: 'claude-3-7-sonnet-prod',
      environment: 'production',
      metric: 'latencyP95',
      condition: 'gt',
      threshold: 650,
      window: '15m',
      severity: 'critical',
      channel: 'PagerDuty Primary',
      enabled: true,
      lastTriggeredAt: formatISO(subDays(SEED_ANCHOR_DATE, 4)),
    },
    {
      id: 'rule-2',
      name: 'Critical Feature Drift PSI (>0.25)',
      modelId: 'fraud-shield-xgboost-v4',
      environment: 'production',
      metric: 'driftPsi',
      condition: 'gt',
      threshold: 0.25,
      window: '1h',
      severity: 'critical',
      channel: 'Slack #ml-ops-alerts',
      enabled: true,
      lastTriggeredAt: formatISO(subHours(SEED_ANCHOR_DATE, 2)),
    },
  ];

  cachedDatabase = {
    models,
    driftFeatures,
    incidents,
    alertRules,
    errorBreakdown,
  };

  return cachedDatabase;
}

const TIME_RANGE_DAYS: Record<GlobalFilterState['timeRange'], number> = {
  '1h': 2,
  '24h': 3,
  '7d': 7,
  '30d': 30,
  '90d': 30,
};

/**
 * Pure aggregation selector that computes the Overview KPI cards and combined time-series
 * for any combination of global filters (environment, timeRange, team, modelId).
 */
export function buildOverviewDashboardPayload(
  filters: GlobalFilterState
): OverviewDashboardPayload {
  const db = getSeedDatabase();

  const matchingModels = db.models.filter((model) => {
    if (filters.environment !== 'all' && model.environment !== filters.environment) {
      return false;
    }
    if (filters.team !== 'all' && model.team !== filters.team) {
      return false;
    }
    if (filters.modelId !== 'all' && model.id !== filters.modelId) {
      return false;
    }
    return true;
  });

  const activeList = matchingModels.length > 0 ? matchingModels : db.models;
  const windowDays = TIME_RANGE_DAYS[filters.timeRange] ?? 7;

  // Aggregate daily time series across all matching models
  const sampleSeriesLen = activeList[0]?.timeSeries.length ?? 30;
  const startIdx = Math.max(0, sampleSeriesLen - windowDays);

  const aggregatedSeries: TimeSeriesPoint[] = [];

  for (let idx = startIdx; idx < sampleSeriesLen; idx++) {
    let totalReq = 0;
    let totalPrevReq = 0;
    let weightedError = 0;
    let weightedPrevError = 0;
    let weightedP50 = 0;
    let weightedP95 = 0;
    let weightedP99 = 0;
    let weightedPrevP95 = 0;
    let weightedAccuracy = 0;
    let weightedPrevAccuracy = 0;
    let totalTokensPerSec = 0;
    let totalCost = 0;
    let totalPrevCost = 0;
    let maxDrift = 0;
    let isAnomaly = false;
    let anomalyLabel: string | undefined;

    for (const model of activeList) {
      const pt = model.timeSeries[idx];
      if (!pt) continue;
      totalReq += pt.requests;
      totalPrevReq += pt.prevRequests;
      weightedError += pt.errorRate * pt.requests;
      weightedPrevError += pt.prevErrorRate * pt.prevRequests;
      weightedP50 += pt.latencyP50 * pt.requests;
      weightedP95 += pt.latencyP95 * pt.requests;
      weightedP99 += pt.latencyP99 * pt.requests;
      weightedPrevP95 += pt.prevLatencyP95 * pt.prevRequests;
      weightedAccuracy += pt.accuracyScore * pt.requests;
      weightedPrevAccuracy += pt.prevAccuracyScore * pt.prevRequests;
      totalTokensPerSec += pt.tokensPerSec;
      totalCost += pt.costUsd;
      totalPrevCost += pt.prevCostUsd;
      if (pt.driftPsi > maxDrift) maxDrift = pt.driftPsi;
      if (pt.isAnomaly) {
        isAnomaly = true;
        anomalyLabel = pt.anomalyLabel;
      }
    }

    const safeReq = Math.max(1, totalReq);
    const safePrevReq = Math.max(1, totalPrevReq);
    const avgErr = Number((weightedError / safeReq).toFixed(2));
    const avgPrevErr = Number((weightedPrevError / safePrevReq).toFixed(2));

    aggregatedSeries.push({
      timestamp: activeList[0]!.timeSeries[idx]!.timestamp,
      requests: totalReq,
      prevRequests: totalPrevReq,
      errorRate: avgErr,
      prevErrorRate: avgPrevErr,
      successRate: Number((100 - avgErr).toFixed(2)),
      prevSuccessRate: Number((100 - avgPrevErr).toFixed(2)),
      latencyP50: Math.round(weightedP50 / safeReq),
      latencyP95: Math.round(weightedP95 / safeReq),
      latencyP99: Math.round(weightedP99 / safeReq),
      prevLatencyP95: Math.round(weightedPrevP95 / safePrevReq),
      accuracyScore: Number((weightedAccuracy / safeReq).toFixed(2)),
      prevAccuracyScore: Number((weightedPrevAccuracy / safePrevReq).toFixed(2)),
      tokensPerSec: totalTokensPerSec,
      costUsd: Number(totalCost.toFixed(2)),
      prevCostUsd: Number(totalPrevCost.toFixed(2)),
      driftPsi: maxDrift,
      isAnomaly,
      anomalyLabel,
    });
  }

  const totalRequests = aggregatedSeries.reduce((acc, p) => acc + p.requests, 0);
  const totalPrevRequests = aggregatedSeries.reduce((acc, p) => acc + p.prevRequests, 0);
  const requestsDelta = Number(
    (((totalRequests - totalPrevRequests) / Math.max(1, totalPrevRequests)) * 100).toFixed(1)
  );

  const avgSuccess =
    aggregatedSeries.reduce((acc, p) => acc + p.successRate, 0) /
    Math.max(1, aggregatedSeries.length);
  const avgPrevSuccess =
    aggregatedSeries.reduce((acc, p) => acc + p.prevSuccessRate, 0) /
    Math.max(1, aggregatedSeries.length);
  const successDelta = Number((avgSuccess - avgPrevSuccess).toFixed(2));

  const avgP95 = Math.round(
    aggregatedSeries.reduce((acc, p) => acc + p.latencyP95, 0) /
      Math.max(1, aggregatedSeries.length)
  );
  const avgPrevP95 = Math.round(
    aggregatedSeries.reduce((acc, p) => acc + p.prevLatencyP95, 0) /
      Math.max(1, aggregatedSeries.length)
  );
  const latencyDelta = Number((((avgP95 - avgPrevP95) / Math.max(1, avgPrevP95)) * 100).toFixed(1));

  const avgError =
    aggregatedSeries.reduce((acc, p) => acc + p.errorRate, 0) /
    Math.max(1, aggregatedSeries.length);
  const avgPrevError =
    aggregatedSeries.reduce((acc, p) => acc + p.prevErrorRate, 0) /
    Math.max(1, aggregatedSeries.length);
  const errorDelta = Number(
    (((avgError - avgPrevError) / Math.max(0.01, avgPrevError)) * 100).toFixed(1)
  );

  const totalCost = Number(aggregatedSeries.reduce((acc, p) => acc + p.costUsd, 0).toFixed(2));
  const totalPrevCost = Number(
    aggregatedSeries.reduce((acc, p) => acc + p.prevCostUsd, 0).toFixed(2)
  );
  const costDelta = Number(
    (((totalCost - totalPrevCost) / Math.max(1, totalPrevCost)) * 100).toFixed(1)
  );

  const healthyCount = activeList.filter((m) => m.status === 'healthy').length;
  const degradedCount = activeList.filter((m) => m.status === 'degraded').length;
  const criticalCount = activeList.filter((m) => m.status === 'critical').length;

  const kpis: KpiMetricCardData[] = [
    {
      id: 'requests',
      label: 'Total Inference Requests',
      rawValue: totalRequests,
      previousValue: totalPrevRequests,
      deltaPercent: requestsDelta,
      trendSentiment: 'up-good',
      unit: 'count',
      subtitle: `Prev period: ${(totalPrevRequests / 1_000_000).toFixed(2)}M reqs`,
      sparkline: aggregatedSeries.map((p) => p.requests),
      status: 'healthy',
    },
    {
      id: 'successRate',
      label: 'Global Success Rate',
      rawValue: Number(avgSuccess.toFixed(2)),
      previousValue: Number(avgPrevSuccess.toFixed(2)),
      deltaPercent: successDelta,
      trendSentiment: 'up-good',
      unit: 'percent',
      subtitle: 'SLA target: >= 99.50%',
      sparkline: aggregatedSeries.map((p) => p.successRate),
      status: avgSuccess >= 99.2 ? 'healthy' : avgSuccess >= 98.5 ? 'degraded' : 'critical',
    },
    {
      id: 'latencyP95',
      label: 'Tail Latency (p95)',
      rawValue: avgP95,
      previousValue: avgPrevP95,
      deltaPercent: latencyDelta,
      trendSentiment: 'down-good',
      unit: 'ms',
      subtitle: `p50: ${aggregatedSeries[aggregatedSeries.length - 1]?.latencyP50 ?? 180}ms • p99: ${aggregatedSeries[aggregatedSeries.length - 1]?.latencyP99 ?? 510}ms`,
      sparkline: aggregatedSeries.map((p) => p.latencyP95),
      status: avgP95 <= 350 ? 'healthy' : avgP95 <= 550 ? 'degraded' : 'critical',
    },
    {
      id: 'errorRate',
      label: 'Inference Error Rate',
      rawValue: Number(avgError.toFixed(2)),
      previousValue: Number(avgPrevError.toFixed(2)),
      deltaPercent: errorDelta,
      trendSentiment: 'down-good',
      unit: 'percent',
      subtitle: '429s, 504s & guardrail blocks',
      sparkline: aggregatedSeries.map((p) => p.errorRate),
      status: avgError <= 0.5 ? 'healthy' : avgError <= 1.2 ? 'degraded' : 'critical',
    },
    {
      id: 'totalCost',
      label: 'Token & Compute Spend',
      rawValue: totalCost,
      previousValue: totalPrevCost,
      deltaPercent: costDelta,
      trendSentiment: 'down-good',
      unit: 'currency',
      subtitle: '34% prompt cache hit rate',
      sparkline: aggregatedSeries.map((p) => p.costUsd),
      status: 'healthy',
    },
    {
      id: 'activeModels',
      label: 'Active Models Fleet',
      rawValue: activeList.length,
      previousValue: activeList.length,
      deltaPercent: Number(((healthyCount / Math.max(1, activeList.length)) * 100).toFixed(0)),
      trendSentiment: 'neutral',
      unit: 'ratio',
      subtitle: `${healthyCount} healthy • ${degradedCount} degraded • ${criticalCount} critical`,
      sparkline: activeList.map((m) => m.accuracyScore),
      status: criticalCount > 0 ? 'critical' : degradedCount > 0 ? 'degraded' : 'healthy',
    },
  ];

  return {
    kpis,
    aggregatedSeries,
    topModels: activeList,
    activeIncidents: db.incidents.filter((inc) =>
      filters.environment === 'all' ? true : inc.environment === filters.environment
    ),
    errorBreakdown: db.errorBreakdown,
    filterEcho: filters,
    lastUpdatedIso: formatISO(SEED_ANCHOR_DATE),
  };
}
