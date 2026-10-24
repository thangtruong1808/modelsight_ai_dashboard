import { subMinutes } from 'date-fns';
import { SEED_ANCHOR_DATE } from '@/data/seed';
import type { EnvironmentType, LogEntry } from '@/types';

/**
 * High-performance Linear Congruential Generator (LCG) PRNG for deterministic,
 * sub-30ms generation of 10,000+ realistic inference logs without external library overhead.
 */
class DeterministicPrng {
  private s: number;
  constructor(seed: number) {
    this.s = seed % 2147483647;
    if (this.s <= 0) this.s += 2147483646;
  }
  next(): number {
    this.s = (this.s * 16807) % 2147483647;
    return (this.s - 1) / 2147483646;
  }
  range(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }
  pick<T>(arr: readonly T[]): T {
    return arr[Math.floor(this.next() * arr.length)]!;
  }
}

interface PromptBlueprint {
  domain: string;
  prompt: string;
  completion: string;
  tokens: { prompt: number; completion: number };
}

const REALISTIC_PROMPTS: readonly PromptBlueprint[] = [
  {
    domain: 'Customer Support',
    prompt:
      'Customer #91823: "I was double charged on invoice #INV-4921. Please initiate an immediate reversal or issue a credit note for $189.50."',
    completion:
      'Identified transaction #INV-4921 on account #91823. Located duplicate payment batch ID #BT-8812. Initiated automated merchant refund of $189.50 via Stripe API. Credit note #CN-9182 generated and dispatched to customer billing email.',
    tokens: { prompt: 412, completion: 184 },
  },
  {
    domain: 'SQL Generation',
    prompt:
      'Schema: `orders` (id, user_id, amount, status, created_at), `users` (id, tier, country). Write a PostgreSQL query returning 90-day cohort retention for enterprise tier customers with avg monthly spend > $5,000.',
    completion:
      "WITH monthly_spend AS (\n  SELECT u.id, date_trunc('month', o.created_at) AS order_month,\n         sum(o.amount) AS total_spent\n  FROM users u\n  JOIN orders o ON u.id = o.user_id\n  WHERE u.tier = 'enterprise' AND o.created_at >= NOW() - INTERVAL '90 days'\n  GROUP BY 1, 2\n)\nSELECT id, AVG(total_spent) FROM monthly_spend GROUP BY 1 HAVING AVG(total_spent) > 5000;",
    tokens: { prompt: 620, completion: 290 },
  },
  {
    domain: 'Code Review & Security',
    prompt:
      'Analyze this Express handler for prototype pollution or injection vulnerabilities:\n`app.post("/api/profile", (req, res) => { Object.assign(req.user.settings, req.body.settings); res.json({ ok: true }); });`',
    completion:
      'CRITICAL: Unsanitized `Object.assign` with untrusted JSON payload introduces prototype pollution (CWE-1321). If `req.body.settings` contains `__proto__` or `constructor.prototype`, root prototypes are poisoned. Fix: Use structured clone with an allowlisted schema validator (e.g., Zod).',
    tokens: { prompt: 540, completion: 260 },
  },
  {
    domain: 'RAG Medical Extraction',
    prompt:
      'Context: Patient 58yo presents with dyspnea on exertion, bilateral lower extremity edema +2, elevated BNP 1,420 pg/mL. Extract primary ICD-10 diagnosis and recommended guideline therapy.',
    completion:
      'Clinical Assessment: Acute decompensated congestive heart failure (ICD-10 I50.9). Recommended ACC/AHA Guideline-directed medical therapy (GDMT): IV loop diuretics (furosemide 40mg), initiate SGLT2 inhibitor, uptitrate ARNI/ACEi upon euvolemia.',
    tokens: { prompt: 810, completion: 310 },
  },
  {
    domain: 'Risk & Fraud Scoring',
    prompt:
      'Evaluate incoming session: IP ASN 13335 (Cloudflare WARP VPN), device fingerprinted 4 times across 3 geographic zones in 15 mins. Card velocity: 6 transactions in 10 minutes. Compute risk delta.',
    completion:
      'Risk Score: 0.94 (CRITICAL ANOMALY). Heuristic flags triggered: GEO_VELOCITY_IMPOSSIBLE (speed > 1200 km/h), HIGH_VELOCITY_PAN, DATACENTER_EGRESS_IP. Recommended Action: Force 3D-Secure 2.0 challenge; hold authorization pending biometric challenge.',
    tokens: { prompt: 390, completion: 195 },
  },
  {
    domain: 'Embedding Semantic Search',
    prompt:
      'Query: "How does speculative decoding optimize inference latency in large mixture-of-experts transformer architectures?"',
    completion:
      'Speculative decoding uses a lightweight draft model to generate candidate token sequences in parallel, verified in a single forward pass by the larger target model. For MoE models, this reduces memory bandwidth bottlenecks during autoregressive generation.',
    tokens: { prompt: 310, completion: 240 },
  },
];

const LOG_MODELS = [
  { id: 'claude-3-7-sonnet-prod', name: 'Claude 3.7 Sonnet', env: 'production', costPer1k: 0.0055 },
  { id: 'gpt-4o-customer-support', name: 'GPT-4o Support', env: 'production', costPer1k: 0.0048 },
  { id: 'llama-3-3-70b-rag', name: 'Llama 3.3 70B RAG', env: 'production', costPer1k: 0.0022 },
  { id: 'fraud-xgboost-v4', name: 'Fraud Sentinel XGBoost', env: 'production', costPer1k: 0.0004 },
  { id: 'mistral-large-2411', name: 'Mistral Large 2', env: 'staging', costPer1k: 0.0035 },
  { id: 'deepseek-v3-coder', name: 'DeepSeek V3 Coder', env: 'shadow', costPer1k: 0.0018 },
  { id: 'reranker-bge-large', name: 'BGE Reranker Large', env: 'production', costPer1k: 0.0006 },
  {
    id: 'gemini-1-5-pro-vision',
    name: 'Gemini 1.5 Pro Vision',
    env: 'production',
    costPer1k: 0.0062,
  },
] as const;

let cachedLogs: LogEntry[] | null = null;

/**
 * Generate 10,000 deterministic, realistic inference logs.
 * Execution time is ~15ms and result is memoized in memory.
 */
export function getDeterministicLogs(count = 10000): LogEntry[] {
  if (cachedLogs && cachedLogs.length === count) {
    return cachedLogs;
  }

  const prng = new DeterministicPrng(1337);
  const logs: LogEntry[] = new Array(count);

  const countries = ['US', 'DE', 'GB', 'FR', 'JP', 'CA', 'AU', 'SG', 'BR', 'IN'] as const;
  const sdks = [
    'modelsight-python-sdk/v2.4.1',
    'modelsight-node-client/v1.9.0',
    'langchain-py/v0.3.1',
    'llamaindex-core/v0.11.2',
    'curl/8.4.0',
  ] as const;

  // Distribute over past 24 hours (1440 minutes)
  for (let i = 0; i < count; i++) {
    const ageMinutes = (i / count) * 1440 + prng.range(-3, 3);
    const logTime = subMinutes(SEED_ANCHOR_DATE, Math.max(0, ageMinutes));
    const model = prng.pick(LOG_MODELS);
    const blueprint = prng.pick(REALISTIC_PROMPTS);

    // Roll status code: 94.2% 200, 2.8% 429, 1.4% 504, 1.0% 500, 0.6% 400
    const roll = prng.next() * 100;
    let statusCode: number;
    let latencyMs = prng.range(120, 580);
    let finishReason: 'stop' | 'length' | 'tool_call' | 'guardrail_block' = 'stop';
    const promptTokens = blueprint.tokens.prompt + prng.range(-40, 60);
    let completionTokens = blueprint.tokens.completion + prng.range(-30, 45);

    if (roll > 99.4) {
      statusCode = 400;
      latencyMs = prng.range(18, 55);
      completionTokens = 0;
      finishReason = 'guardrail_block';
    } else if (roll > 98.4) {
      statusCode = 500;
      latencyMs = prng.range(280, 1150);
      completionTokens = prng.range(0, 15);
    } else if (roll > 97.0) {
      statusCode = 504;
      latencyMs = prng.range(1200, 2450);
      completionTokens = 0;
    } else if (roll > 94.2) {
      statusCode = 429;
      latencyMs = prng.range(12, 42);
      completionTokens = 0;
    } else {
      statusCode = 200;
      if (prng.next() > 0.85) finishReason = 'tool_call';
    }

    const totalTokens = promptTokens + completionTokens;
    const costUsd = Number(((totalTokens / 1000) * model.costPer1k).toFixed(5));

    const hexId = prng.range(100000, 999999).toString(16);
    const hexTrace = prng.range(10000000, 99999999).toString(16);
    const userHex = prng.range(1000, 9999).toString(16);

    const fullPrompt = blueprint.prompt;
    const fullCompletion =
      statusCode === 200
        ? blueprint.completion
        : statusCode === 429
          ? '{"error": {"code": 429, "message": "Rate limit quota exceeded: 1200 TPM limit breached for tier enterprise."}}'
          : statusCode === 504
            ? '{"error": {"code": 504, "message": "Upstream inference gateway timed out waiting for backend worker after 2500ms."}}'
            : statusCode === 500
              ? '{"error": {"code": 500, "message": "CUDA out of memory exception during tensor parallel all-reduce."}}'
              : '{"error": {"code": 400, "message": "Malformed request schema: invalid JSON input."}}';

    logs[i] = {
      id: `req_${hexId}${i}`,
      traceId: `tr_${hexTrace}${i.toString(16)}`,
      timestamp: logTime.toISOString(),
      modelId: model.id,
      modelName: model.name,
      environment: model.env as EnvironmentType,
      statusCode,
      latencyMs,
      promptTokens,
      completionTokens,
      totalTokens,
      costUsd,
      userHash: `usr_${userHex}`,
      promptSnippet: fullPrompt.length > 90 ? `${fullPrompt.slice(0, 87)}...` : fullPrompt,
      completionSnippet:
        fullCompletion.length > 90 ? `${fullCompletion.slice(0, 87)}...` : fullCompletion,
      fullPrompt,
      fullCompletion,
      requestPayload: {
        model: model.id,
        messages: [
          { role: 'system', content: 'You are ModelSight production reasoning assistant.' },
          { role: 'user', content: fullPrompt },
        ],
        temperature: 0.2,
        max_tokens: 1024,
        stream: false,
      },
      responsePayload: {
        id: `chatcmpl_${hexId}${i}`,
        object: 'chat.completion',
        created: Math.floor(logTime.getTime() / 1000),
        model: model.id,
        choices: [
          {
            index: 0,
            message: { role: 'assistant', content: fullCompletion },
            finish_reason: finishReason,
          },
        ],
        usage: {
          prompt_tokens: promptTokens,
          completion_tokens: completionTokens,
          total_tokens: totalTokens,
        },
      },
      metadata: {
        clientSdk: prng.pick(sdks),
        ipCountry: prng.pick(countries),
        cached: prng.next() > 0.72,
        vectorDistance: Number((prng.range(12, 85) / 100).toFixed(3)),
        guardrailScore: Number((prng.range(92, 99) / 100).toFixed(2)),
        finishReason,
      },
    };
  }

  cachedLogs = logs;
  return logs;
}

export interface HourlyLogHistogramBucket {
  hourLabel: string;
  totalCount: number;
  errorCount: number;
  successCount: number;
  errorRate: number;
}

/**
 * Compute 24 hourly buckets from the logs for the mini volume & error spike chart
 */
export function computeLogsHourlyHistogram(logs: readonly LogEntry[]): HourlyLogHistogramBucket[] {
  const buckets: Record<string, { total: number; errors: number }> = {};

  // Initialize 24 hourly buckets
  for (let h = 23; h >= 0; h--) {
    const bucketTime = subMinutes(SEED_ANCHOR_DATE, h * 60);
    const label = `${String(bucketTime.getUTCHours()).padStart(2, '0')}:00`;
    buckets[label] = { total: 0, errors: 0 };
  }

  for (const log of logs) {
    const date = new Date(log.timestamp);
    const label = `${String(date.getUTCHours()).padStart(2, '0')}:00`;
    if (buckets[label]) {
      buckets[label].total++;
      if (log.statusCode >= 400) {
        buckets[label].errors++;
      }
    }
  }

  return Object.entries(buckets).map(([hourLabel, stats]) => ({
    hourLabel,
    totalCount: stats.total,
    errorCount: stats.errors,
    successCount: stats.total - stats.errors,
    errorRate: stats.total > 0 ? Number(((stats.errors / stats.total) * 100).toFixed(1)) : 0,
  }));
}
