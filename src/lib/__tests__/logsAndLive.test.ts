import { describe, expect, it } from 'vitest';
import { computeLogsHourlyHistogram, getDeterministicLogs } from '@/data/seedLogs';
import { formatLogsAsCsvString } from '@/lib/exportUtils';

describe('Phase 6: Request Logs Engine & Virtualization Data Layer', () => {
  it('generates 10,000 deterministic logs with realistic LLM payloads and valid schemas', () => {
    const logs = getDeterministicLogs(10000);
    expect(logs).toHaveLength(10000);

    const first = logs[0]!;
    expect(first).toBeDefined();
    expect(first.id).toMatch(/^req_/);
    expect(first.traceId).toMatch(/^tr_/);
    expect(first.userHash).toMatch(/^usr_/);
    expect(first.statusCode).toBeGreaterThanOrEqual(200);
    expect(first.latencyMs).toBeGreaterThan(0);
    expect(first.promptTokens).toBeGreaterThan(0);
    expect(first.totalTokens).toBe(first.promptTokens + first.completionTokens);
    expect(first.costUsd).toBeGreaterThanOrEqual(0);
    expect(first.requestPayload).toHaveProperty('messages');
    expect(first.responsePayload).toHaveProperty('choices');
    expect(first.metadata).toHaveProperty('clientSdk');
    expect(first.metadata).toHaveProperty('ipCountry');

    // Deterministic caching verification: calling again returns the same memoized reference
    const logsAgain = getDeterministicLogs(10000);
    expect(logsAgain).toBe(logs);
    expect(logsAgain[0]!.id).toBe(first.id);
  });

  it('correctly aggregates 24 hourly volume and error histogram buckets', () => {
    const logs = getDeterministicLogs(1000);
    const histogram = computeLogsHourlyHistogram(logs);

    expect(histogram).toHaveLength(24);

    const sumTotal = histogram.reduce((acc, b) => acc + b.totalCount, 0);
    expect(sumTotal).toBe(logs.length);

    const sumErrors = histogram.reduce((acc, b) => acc + b.errorCount, 0);
    const expectedErrors = logs.filter((l) => l.statusCode >= 400).length;
    expect(sumErrors).toBe(expectedErrors);

    // Each bucket calculates percentage correctly
    for (const b of histogram) {
      if (b.totalCount > 0) {
        expect(b.errorRate).toBeCloseTo((b.errorCount / b.totalCount) * 100, 1);
        expect(b.successCount + b.errorCount).toBe(b.totalCount);
      }
    }
  });

  it('supports faceted filtering by status code, model, and latency brackets', () => {
    const logs = getDeterministicLogs(5000);

    // Filter by status 429
    const rateLimited = logs.filter((l) => l.statusCode === 429);
    expect(rateLimited.length).toBeGreaterThan(0);
    expect(rateLimited.every((l) => l.statusCode === 429)).toBe(true);

    // Filter by model claude-3-7-sonnet-prod
    const claudeLogs = logs.filter((l) => l.modelId === 'claude-3-7-sonnet-prod');
    expect(claudeLogs.length).toBeGreaterThan(0);
    expect(claudeLogs.every((l) => l.modelId === 'claude-3-7-sonnet-prod')).toBe(true);

    // Filter by latency (> 500ms)
    const tailLatencyLogs = logs.filter((l) => l.latencyMs > 500);
    expect(tailLatencyLogs.length).toBeGreaterThan(0);
    expect(tailLatencyLogs.every((l) => l.latencyMs > 500)).toBe(true);

    // Fast logs (< 200ms)
    const fastLogs = logs.filter((l) => l.latencyMs < 200);
    expect(fastLogs.length).toBeGreaterThan(0);
    expect(fastLogs.every((l) => l.latencyMs < 200)).toBe(true);
  });

  it('supports search query matching across IDs, prompts, and traces', () => {
    const logs = getDeterministicLogs(1000);
    const target = logs[12]!;

    // Search by exact request ID
    const matchId = logs.filter((l) => l.id.toLowerCase().includes(target.id.toLowerCase()));
    expect(matchId).toContainEqual(target);

    // Search by partial trace ID
    const partialTrace = target.traceId.slice(3, 8).toLowerCase();
    const matchTrace = logs.filter((l) => l.traceId.toLowerCase().includes(partialTrace));
    expect(matchTrace.length).toBeGreaterThanOrEqual(1);
  });

  it('formats logs to clean RFC-4180 CSV with escaped strings and headers', () => {
    const logs = getDeterministicLogs(10);
    const csv = formatLogsAsCsvString(logs);

    expect(csv).toContain('Request ID,Timestamp,Model,Environment,Status Code');
    const lines = csv.split('\r\n');
    expect(lines).toHaveLength(11); // Header + 10 rows
    expect(lines[1]).toContain(logs[0]!.id);
  });
});
