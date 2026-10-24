import type { LogEntry } from '@/types';

/**
 * Trigger an accessible browser file download via temporary blob link
 */
export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Format an array of LogEntry objects into clean RFC-4180 CSV string
 */
export function formatLogsAsCsvString(logs: readonly LogEntry[]): string {
  const headers = [
    'Request ID',
    'Timestamp',
    'Model',
    'Environment',
    'Status Code',
    'Latency (ms)',
    'Prompt Tokens',
    'Completion Tokens',
    'Total Tokens',
    'Cost (USD)',
    'User Hash',
    'Trace ID',
    'Prompt Snippet',
  ];

  const escapeCsv = (val: unknown): string => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows = logs.map((log) => [
    escapeCsv(log.id),
    escapeCsv(log.timestamp),
    escapeCsv(log.modelName),
    escapeCsv(log.environment),
    escapeCsv(log.statusCode),
    escapeCsv(log.latencyMs),
    escapeCsv(log.promptTokens),
    escapeCsv(log.completionTokens),
    escapeCsv(log.totalTokens),
    escapeCsv(log.costUsd),
    escapeCsv(log.userHash),
    escapeCsv(log.traceId),
    escapeCsv(log.promptSnippet),
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
}

/**
 * Format an array of LogEntry objects into clean RFC-4180 CSV and trigger browser download
 */
export function exportLogsToCsv(logs: readonly LogEntry[]): void {
  const csvContent = formatLogsAsCsvString(logs);
  const filename = `modelsight-request-logs-${new Date().toISOString().slice(0, 10)}.csv`;
  downloadFile(csvContent, filename, 'text/csv;charset=utf-8;');
}

/**
 * Format an array of LogEntry objects into formatted JSON
 */
export function exportLogsToJson(logs: readonly LogEntry[]): void {
  const jsonContent = JSON.stringify(logs, null, 2);
  const filename = `modelsight-request-logs-${new Date().toISOString().slice(0, 10)}.json`;
  downloadFile(jsonContent, filename, 'application/json;charset=utf-8;');
}
