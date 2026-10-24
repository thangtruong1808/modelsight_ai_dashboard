import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Code2,
  Copy,
  Download,
  FileJson,
  Layers,
  MessageSquare,
  Search,
  SlidersHorizontal,
  Terminal,
  User,
  X,
  Zap,
} from 'lucide-react';
import { Dialog as RadixDialog } from 'radix-ui';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { computeLogsHourlyHistogram, getDeterministicLogs } from '@/data/seedLogs';
import { cn } from '@/lib/cn';
import { exportLogsToCsv, exportLogsToJson } from '@/lib/exportUtils';
import { formatCurrency, formatLatency, formatNumber } from '@/lib/formatters';
import { useGetLogsQuery } from '@/services/baseApi';
import type { LogEntry } from '@/types';

export default function LogsExplorerPage() {
  const { data: initialLogs = [] } = useGetLogsQuery();

  // If RTK query is still loading, fall back to deterministic cache
  const allLogs = useMemo(() => {
    return initialLogs.length > 0 ? initialLogs : getDeterministicLogs(10000);
  }, [initialLogs]);

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<
    'all' | '200' | '429' | '500' | '504' | '400'
  >('all');
  const [selectedModel, setSelectedModel] = useState<string>('all');
  const [latencyFilter, setLatencyFilter] = useState<
    'all' | 'fast' | 'medium' | 'slow' | 'very_slow'
  >('all');

  // Drawer & Selection state
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null);
  const [drawerTab, setDrawerTab] = useState<'chat' | 'request' | 'response' | 'metadata'>('chat');

  // Unique model names for filter dropdown
  const modelOptions = useMemo(() => {
    const set = new Set<string>();
    for (const log of allLogs) set.add(log.modelId);
    return Array.from(set);
  }, [allLogs]);

  // Filtered logs
  const filteredLogs = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return allLogs.filter((log) => {
      // Status filter
      if (selectedStatus !== 'all' && log.statusCode !== Number(selectedStatus)) {
        return false;
      }

      // Model filter
      if (selectedModel !== 'all' && log.modelId !== selectedModel) {
        return false;
      }

      // Latency filter
      if (latencyFilter === 'fast' && log.latencyMs >= 200) return false;
      if (latencyFilter === 'medium' && (log.latencyMs < 200 || log.latencyMs > 500)) return false;
      if (latencyFilter === 'slow' && (log.latencyMs <= 500 || log.latencyMs > 1000)) return false;
      if (latencyFilter === 'very_slow' && log.latencyMs <= 1000) return false;

      // Text query search
      if (query) {
        return (
          log.id.toLowerCase().includes(query) ||
          log.traceId.toLowerCase().includes(query) ||
          log.userHash.toLowerCase().includes(query) ||
          log.promptSnippet.toLowerCase().includes(query) ||
          log.modelName.toLowerCase().includes(query)
        );
      }

      return true;
    });
  }, [allLogs, searchQuery, selectedStatus, selectedModel, latencyFilter]);

  // Selected Log object
  const selectedLog = useMemo(() => {
    if (!selectedLogId) return null;
    return allLogs.find((l) => l.id === selectedLogId) ?? null;
  }, [allLogs, selectedLogId]);

  // Current selected log index inside filtered list for arrow-key navigation
  const selectedIndex = useMemo(() => {
    if (!selectedLogId) return -1;
    return filteredLogs.findIndex((l) => l.id === selectedLogId);
  }, [filteredLogs, selectedLogId]);

  const selectPreviousLog = useCallback(() => {
    if (selectedIndex > 0) {
      setSelectedLogId(filteredLogs[selectedIndex - 1]!.id);
    }
  }, [selectedIndex, filteredLogs]);

  const selectNextLog = useCallback(() => {
    if (selectedIndex >= 0 && selectedIndex < filteredLogs.length - 1) {
      setSelectedLogId(filteredLogs[selectedIndex + 1]!.id);
    }
  }, [selectedIndex, filteredLogs]);

  // Keyboard navigation when drawer is open
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedLogId) return;
      if (e.key === 'ArrowUp' || e.key === 'k') {
        e.preventDefault();
        selectPreviousLog();
      } else if (e.key === 'ArrowDown' || e.key === 'j') {
        e.preventDefault();
        selectNextLog();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedLogId, selectPreviousLog, selectNextLog]);

  // Virtualizer setup
  const parentRef = useRef<HTMLDivElement>(null);
  const rowVirtualizer = useVirtualizer({
    count: filteredLogs.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 44,
    overscan: 15,
  });

  // 24h mini volume histogram calculation
  const hourlyHistogram = useMemo(() => {
    return computeLogsHourlyHistogram(filteredLogs);
  }, [filteredLogs]);

  const maxHourlyVolume = useMemo(() => {
    return Math.max(...hourlyHistogram.map((h) => h.totalCount), 1);
  }, [hourlyHistogram]);

  // Aggregate stats across current filtered view
  const stats = useMemo(() => {
    const total = filteredLogs.length;
    if (total === 0) return { avgLatency: 0, errorRate: 0, totalCost: 0 };
    const sumLatency = filteredLogs.reduce((acc, l) => acc + l.latencyMs, 0);
    const errorCount = filteredLogs.filter((l) => l.statusCode >= 400).length;
    const sumCost = filteredLogs.reduce((acc, l) => acc + l.costUsd, 0);
    return {
      avgLatency: Math.round(sumLatency / total),
      errorRate: Number(((errorCount / total) * 100).toFixed(1)),
      totalCost: sumCost,
    };
  }, [filteredLogs]);

  // Copy helpers
  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`Copied ${label} to clipboard`);
  };

  const handleCopyCurl = (log: LogEntry) => {
    const curlCommand = `curl -X POST https://api.modelsight.ai/v1/chat/completions \\
  -H "Authorization: Bearer ms_live_prod_key_***" \\
  -H "Content-Type: application/json" \\
  -H "X-Trace-Id: ${log.traceId}" \\
  -d '${JSON.stringify(log.requestPayload, null, 2)}'`;
    navigator.clipboard.writeText(curlCommand);
    toast.success('cURL command copied to clipboard');
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col justify-between gap-4 border-b border-border-default pb-5 lg:flex-row lg:items-center">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="indigo">High-Throughput Virtualized Data Layer</Badge>
            <Badge variant="outline">@tanstack/react-virtual</Badge>
          </div>
          <h1 className="mt-2 text-xl font-bold tracking-tight text-text-primary sm:text-2xl">
            Request Logs Explorer
          </h1>
          <p className="mt-1 text-xs text-text-secondary sm:text-sm">
            Inspect 10,000+ real-time inference transactions with sub-millisecond filtering, token
            metrics, and payload inspector
          </p>
        </div>

        {/* Export Actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              exportLogsToCsv(filteredLogs);
              toast.success(`Exported ${filteredLogs.length} logs to CSV`);
            }}
            className="gap-1.5 text-xs"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export CSV</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              exportLogsToJson(filteredLogs);
              toast.success(`Exported ${filteredLogs.length} logs to JSON`);
            }}
            className="gap-1.5 text-xs"
          >
            <FileJson className="h-3.5 w-3.5" />
            <span>Export JSON</span>
          </Button>
        </div>
      </div>

      {/* Mini Volume & Error Histogram Strip */}
      <Card className="p-4 bg-bg-surface border-border-default">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-2">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-accent-primary" />
            <span className="text-xs font-semibold text-text-primary">
              24-Hour Request Volume & Anomaly Histogram
            </span>
            <span className="text-[11px] text-text-muted">
              ({formatNumber(filteredLogs.length)} events analyzed)
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono">
            <div>
              <span className="text-text-muted">Avg Latency: </span>
              <strong className="text-text-primary">{formatLatency(stats.avgLatency)}</strong>
            </div>
            <div>
              <span className="text-text-muted">Error Rate: </span>
              <strong
                className={cn(
                  stats.errorRate > 2 ? 'text-status-critical font-bold' : 'text-status-healthy'
                )}
              >
                {stats.errorRate}%
              </strong>
            </div>
            <div>
              <span className="text-text-muted">Spend: </span>
              <strong className="text-text-primary">{formatCurrency(stats.totalCost)}</strong>
            </div>
          </div>
        </div>

        {/* 24-column histogram visualizer */}
        <div className="flex items-end gap-1 h-14 pt-2">
          {hourlyHistogram.map((bucket) => {
            const heightPct = Math.max(8, Math.round((bucket.totalCount / maxHourlyVolume) * 100));
            const errorHeightPct =
              bucket.totalCount > 0 ? (bucket.errorCount / bucket.totalCount) * heightPct : 0;

            return (
              <div
                key={bucket.hourLabel}
                className="group relative flex-1 flex flex-col justify-end h-full cursor-pointer"
              >
                {/* Tooltip on bar hover */}
                <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex flex-col items-center z-30 rounded-md bg-bg-elevated px-2 py-1 text-[10px] text-text-primary shadow-float border border-border-default whitespace-nowrap">
                  <span className="font-bold">{bucket.hourLabel} UTC</span>
                  <span>Total: {formatNumber(bucket.totalCount)} reqs</span>
                  {bucket.errorCount > 0 && (
                    <span className="text-status-critical font-medium">
                      Errors: {bucket.errorCount} ({bucket.errorRate}%)
                    </span>
                  )}
                </div>

                {/* Stacked bar: normal vs error */}
                <div
                  style={{ height: `${heightPct}%` }}
                  className="w-full rounded-xs bg-accent-primary/40 group-hover:bg-accent-primary transition-colors relative overflow-hidden"
                >
                  {errorHeightPct > 0 && (
                    <div
                      style={{ height: `${Math.max(4, errorHeightPct)}%` }}
                      className="w-full bg-status-critical"
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex justify-between text-[10px] font-mono text-text-muted mt-1">
          <span>-24h</span>
          <span>-18h</span>
          <span>-12h</span>
          <span>-6h</span>
          <span>Now</span>
        </div>
      </Card>

      {/* Filter and Query Control Bar */}
      <Card className="p-4 border-border-default bg-bg-surface space-y-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          {/* Search Box */}
          <div className="relative flex-1 max-w-lg">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by request ID, trace ID, user hash, prompt keywords..."
              className="w-full rounded-md border border-border-default bg-bg-base pl-9 pr-8 py-1.5 text-xs text-text-primary placeholder:text-text-muted focus:border-accent-primary focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Model Selector */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-text-muted">Model:</span>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="rounded-md border border-border-default bg-bg-base px-2.5 py-1.5 text-xs text-text-primary focus:border-accent-primary focus:outline-none"
              >
                <option value="all">All Models ({modelOptions.length})</option>
                {modelOptions.map((mid) => (
                  <option key={mid} value={mid}>
                    {mid}
                  </option>
                ))}
              </select>
            </div>

            {/* Latency Range Selector */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-text-muted">Latency:</span>
              <select
                value={latencyFilter}
                onChange={(e) => setLatencyFilter(e.target.value as typeof latencyFilter)}
                className="rounded-md border border-border-default bg-bg-base px-2.5 py-1.5 text-xs text-text-primary focus:border-accent-primary focus:outline-none"
              >
                <option value="all">All Latencies</option>
                <option value="fast">&lt; 200ms (Fast)</option>
                <option value="medium">200ms - 500ms</option>
                <option value="slow">500ms - 1000ms (SLA Risk)</option>
                <option value="very_slow">&gt; 1000ms (Breach)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Status Code Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 border-t border-border-subtle pt-2.5">
          <span className="text-[11px] font-medium text-text-muted mr-1 flex items-center gap-1">
            <SlidersHorizontal className="h-3 w-3" /> Status:
          </span>
          {(
            [
              { id: 'all', label: 'All Statuses' },
              { id: '200', label: '200 OK' },
              { id: '429', label: '429 Rate Limit' },
              { id: '500', label: '500 Server Error' },
              { id: '504', label: '504 Timeout' },
              { id: '400', label: '400 Bad Request' },
            ] as const
          ).map((item) => {
            const isSelected = selectedStatus === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedStatus(item.id)}
                className={cn(
                  'rounded-md px-2.5 py-1 text-xs font-mono transition-colors cursor-pointer',
                  isSelected
                    ? 'bg-accent-primary text-white font-medium shadow-xs'
                    : 'bg-bg-elevated text-text-secondary hover:text-text-primary hover:bg-bg-subtle'
                )}
              >
                {item.label}
              </button>
            );
          })}

          <div className="ml-auto text-[11px] font-mono text-text-muted">
            Showing{' '}
            <strong className="text-text-primary">{formatNumber(filteredLogs.length)}</strong> of{' '}
            {formatNumber(allLogs.length)} records
          </div>
        </div>
      </Card>

      {/* Virtualized Table Container */}
      <Card className="border-border-default overflow-hidden bg-bg-surface">
        {/* Sticky Table Header */}
        <div className="grid grid-cols-12 gap-2 border-b border-border-default bg-bg-elevated px-4 py-2.5 text-[11px] font-semibold text-text-secondary select-none">
          <div className="col-span-2">Timestamp (UTC)</div>
          <div className="col-span-1 text-center">Status</div>
          <div className="col-span-2">Target Model</div>
          <div className="col-span-1 text-right">Latency</div>
          <div className="col-span-1 text-right">Tokens</div>
          <div className="col-span-1 text-right">Cost</div>
          <div className="col-span-1 font-mono">Trace ID</div>
          <div className="col-span-3">Prompt / Payload Preview</div>
        </div>

        {/* Scrollable Virtual Viewport */}
        <div
          ref={parentRef}
          role="table"
          aria-label="Request logs table"
          className="h-[520px] overflow-auto focus:outline-none divide-y divide-border-subtle"
        >
          {filteredLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-8 space-y-2">
              <AlertTriangle className="h-8 w-8 text-status-warning" />
              <p className="text-sm font-semibold text-text-primary">No matching logs found</p>
              <p className="text-xs text-text-muted">
                Try relaxing the latency filter or clearing the search query.
              </p>
              <Button
                variant="outline"
                size="xs"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedStatus('all');
                  setSelectedModel('all');
                  setLatencyFilter('all');
                }}
              >
                Reset All Filters
              </Button>
            </div>
          ) : (
            <div
              style={{
                height: `${rowVirtualizer.getTotalSize()}px`,
                width: '100%',
                position: 'relative',
              }}
            >
              {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                const log = filteredLogs[virtualRow.index]!;
                const isSelected = selectedLogId === log.id;
                const date = new Date(log.timestamp);
                const timeStr = `${String(date.getUTCHours()).padStart(2, '0')}:${String(
                  date.getUTCMinutes()
                ).padStart(2, '0')}:${String(date.getUTCSeconds()).padStart(2, '0')}.${String(
                  date.getUTCMilliseconds()
                ).padStart(3, '0')}`;

                return (
                  <div
                    key={log.id}
                    role="row"
                    tabIndex={0}
                    onClick={() => setSelectedLogId(log.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') setSelectedLogId(log.id);
                    }}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: `${virtualRow.size}px`,
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                    className={cn(
                      'grid grid-cols-12 gap-2 items-center px-4 text-xs font-mono transition-colors cursor-pointer border-b border-border-subtle',
                      isSelected
                        ? 'bg-accent-primary/10 border-accent-primary/40'
                        : 'hover:bg-bg-elevated/60'
                    )}
                  >
                    {/* Timestamp */}
                    <div className="col-span-2 text-text-muted truncate">
                      {date.toISOString().slice(5, 10)} {timeStr}
                    </div>

                    {/* Status Code */}
                    <div className="col-span-1 text-center">
                      <span
                        className={cn(
                          'inline-block px-1.5 py-0.5 rounded text-[10px] font-bold',
                          log.statusCode === 200 && 'bg-status-healthy/15 text-status-healthy',
                          log.statusCode === 429 && 'bg-status-warning/15 text-status-warning',
                          (log.statusCode === 500 || log.statusCode === 504) &&
                            'bg-status-critical/15 text-status-critical',
                          log.statusCode === 400 && 'bg-bg-subtle text-text-secondary'
                        )}
                      >
                        {log.statusCode}
                      </span>
                    </div>

                    {/* Model */}
                    <div className="col-span-2 text-text-primary font-sans font-medium truncate">
                      {log.modelName}
                    </div>

                    {/* Latency */}
                    <div
                      className={cn(
                        'col-span-1 text-right tabular-nums',
                        log.latencyMs > 1000
                          ? 'text-status-critical font-bold'
                          : log.latencyMs > 500
                            ? 'text-status-warning'
                            : 'text-text-primary'
                      )}
                    >
                      {log.latencyMs}ms
                    </div>

                    {/* Tokens */}
                    <div className="col-span-1 text-right text-text-muted tabular-nums">
                      {log.totalTokens}
                    </div>

                    {/* Cost */}
                    <div className="col-span-1 text-right text-text-muted tabular-nums">
                      ${log.costUsd.toFixed(4)}
                    </div>

                    {/* Trace ID */}
                    <div className="col-span-1 text-text-muted truncate font-mono text-[11px]">
                      {log.traceId.slice(0, 8)}...
                    </div>

                    {/* Prompt Preview */}
                    <div className="col-span-3 text-text-secondary truncate font-sans text-xs">
                      {log.promptSnippet}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer info bar */}
        <div className="flex items-center justify-between border-t border-border-default bg-bg-elevated/40 px-4 py-2 text-[11px] text-text-muted">
          <div className="flex items-center gap-3">
            <span>
              Use{' '}
              <kbd className="px-1.5 py-0.5 rounded border border-border-default bg-bg-base">↑</kbd>{' '}
              <kbd className="px-1.5 py-0.5 rounded border border-border-default bg-bg-base">↓</kbd>{' '}
              or{' '}
              <kbd className="px-1.5 py-0.5 rounded border border-border-default bg-bg-base">j</kbd>{' '}
              <kbd className="px-1.5 py-0.5 rounded border border-border-default bg-bg-base">k</kbd>{' '}
              to step through logs
            </span>
          </div>
          <div>Virtualization active: 60fps fixed buffer</div>
        </div>
      </Card>

      {/* Slide-Over Log Detail Side Drawer */}
      <RadixDialog.Root
        open={Boolean(selectedLog)}
        onOpenChange={(open) => {
          if (!open) setSelectedLogId(null);
        }}
      >
        <RadixDialog.Portal>
          <RadixDialog.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs" />
          <RadixDialog.Content
            aria-describedby="log-detail-desc"
            className="fixed inset-y-0 right-0 z-50 flex w-full max-w-xl flex-col border-l border-border-default bg-bg-surface shadow-float focus:outline-none"
          >
            {selectedLog && (
              <>
                {/* Drawer Header */}
                <div className="flex items-center justify-between border-b border-border-default p-4">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        'px-2 py-0.5 rounded text-xs font-mono font-bold',
                        selectedLog.statusCode === 200 &&
                          'bg-status-healthy/15 text-status-healthy',
                        selectedLog.statusCode === 429 &&
                          'bg-status-warning/15 text-status-warning',
                        (selectedLog.statusCode === 500 || selectedLog.statusCode === 504) &&
                          'bg-status-critical/15 text-status-critical',
                        selectedLog.statusCode === 400 && 'bg-bg-subtle text-text-secondary'
                      )}
                    >
                      {selectedLog.statusCode}
                    </span>
                    <RadixDialog.Title className="font-mono text-xs font-bold text-text-primary">
                      {selectedLog.id}
                    </RadixDialog.Title>
                    <Badge variant="outline" className="text-[10px] capitalize">
                      {selectedLog.environment}
                    </Badge>
                  </div>

                  {/* Navigation & Close */}
                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={selectedIndex <= 0}
                      onClick={selectPreviousLog}
                      aria-label="Previous log"
                      className="h-7 w-7"
                    >
                      <ArrowUp className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={selectedIndex >= filteredLogs.length - 1}
                      onClick={selectNextLog}
                      aria-label="Next log"
                      className="h-7 w-7"
                    >
                      <ArrowDown className="h-3.5 w-3.5" />
                    </Button>
                    <RadixDialog.Close asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Close drawer"
                        className="h-7 w-7"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </RadixDialog.Close>
                  </div>
                </div>

                <p id="log-detail-desc" className="sr-only">
                  Inference request detail and JSON inspector
                </p>

                {/* Key Metrics Strip */}
                <div className="grid grid-cols-4 gap-2 border-b border-border-subtle bg-bg-elevated/40 p-4 text-center">
                  <div>
                    <span className="text-[10px] text-text-muted">Latency</span>
                    <p
                      className={cn(
                        'text-sm font-bold font-mono',
                        selectedLog.latencyMs > 1000
                          ? 'text-status-critical'
                          : selectedLog.latencyMs > 500
                            ? 'text-status-warning'
                            : 'text-text-primary'
                      )}
                    >
                      {selectedLog.latencyMs}ms
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] text-text-muted">Total Tokens</span>
                    <p className="text-sm font-bold font-mono text-text-primary">
                      {selectedLog.totalTokens}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] text-text-muted">Estimated Cost</span>
                    <p className="text-sm font-bold font-mono text-text-primary">
                      ${selectedLog.costUsd.toFixed(4)}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] text-text-muted">User Hash</span>
                    <p className="text-sm font-bold font-mono text-text-secondary">
                      {selectedLog.userHash}
                    </p>
                  </div>
                </div>

                {/* Quick Actions Bar */}
                <div className="flex items-center justify-between border-b border-border-subtle px-4 py-2 bg-bg-base text-xs">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="xs"
                      onClick={() => handleCopyCurl(selectedLog)}
                      className="gap-1 text-[11px]"
                    >
                      <Terminal className="h-3 w-3" />
                      <span>Copy cURL</span>
                    </Button>

                    <Button
                      variant="outline"
                      size="xs"
                      onClick={() =>
                        handleCopy(
                          JSON.stringify(
                            {
                              request: selectedLog.requestPayload,
                              response: selectedLog.responsePayload,
                            },
                            null,
                            2
                          ),
                          'Full Transaction JSON'
                        )
                      }
                      className="gap-1 text-[11px]"
                    >
                      <Copy className="h-3 w-3" />
                      <span>Copy JSON</span>
                    </Button>
                  </div>

                  <span className="font-mono text-[11px] text-text-muted">
                    Trace: {selectedLog.traceId}
                  </span>
                </div>

                {/* Drawer Tab Switcher */}
                <div className="flex border-b border-border-default bg-bg-surface px-4">
                  {(
                    [
                      { id: 'chat', label: 'Prompt & Output', icon: MessageSquare },
                      { id: 'request', label: 'Request JSON', icon: Code2 },
                      { id: 'response', label: 'Response JSON', icon: FileJson },
                      { id: 'metadata', label: 'Telemetry & Guardrails', icon: Zap },
                    ] as const
                  ).map((tab) => {
                    const Icon = tab.icon;
                    const isActive = drawerTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setDrawerTab(tab.id)}
                        className={cn(
                          'flex items-center gap-1.5 border-b-2 py-2.5 px-3 text-xs font-medium transition-colors cursor-pointer',
                          isActive
                            ? 'border-accent-primary text-accent-primary font-semibold'
                            : 'border-transparent text-text-secondary hover:text-text-primary'
                        )}
                      >
                        <Icon className="h-3.5 w-3.5" />
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Drawer Tab Body */}
                <div className="flex-1 overflow-y-auto p-4 text-xs font-sans space-y-4">
                  {drawerTab === 'chat' && (
                    <div className="space-y-4">
                      {/* User Prompt Bubble */}
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-text-secondary font-semibold text-[11px]">
                          <User className="h-3.5 w-3.5 text-accent-primary" />
                          <span>User Prompt ({selectedLog.promptTokens} tokens)</span>
                        </div>
                        <div className="rounded-lg border border-border-default bg-bg-elevated p-3 text-text-primary leading-relaxed whitespace-pre-wrap font-mono text-xs">
                          {selectedLog.fullPrompt}
                        </div>
                      </div>

                      {/* Model Completion Bubble */}
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-text-secondary font-semibold text-[11px]">
                          <MessageSquare className="h-3.5 w-3.5 text-accent-cyan" />
                          <span>
                            {selectedLog.modelName} ({selectedLog.completionTokens} tokens •{' '}
                            {selectedLog.latencyMs}ms)
                          </span>
                        </div>
                        <div
                          className={cn(
                            'rounded-lg border p-3 leading-relaxed whitespace-pre-wrap font-mono text-xs',
                            selectedLog.statusCode >= 400
                              ? 'border-status-critical/30 bg-status-critical/5 text-status-critical'
                              : 'border-border-default bg-bg-base text-text-primary'
                          )}
                        >
                          {selectedLog.fullCompletion}
                        </div>
                      </div>
                    </div>
                  )}

                  {drawerTab === 'request' && (
                    <div className="relative">
                      <pre className="rounded-lg border border-border-default bg-bg-base p-3 font-mono text-[11px] text-text-primary overflow-x-auto leading-relaxed">
                        {JSON.stringify(selectedLog.requestPayload, null, 2)}
                      </pre>
                    </div>
                  )}

                  {drawerTab === 'response' && (
                    <div className="relative">
                      <pre className="rounded-lg border border-border-default bg-bg-base p-3 font-mono text-[11px] text-text-primary overflow-x-auto leading-relaxed">
                        {JSON.stringify(selectedLog.responsePayload, null, 2)}
                      </pre>
                    </div>
                  )}

                  {drawerTab === 'metadata' && (
                    <div className="space-y-3">
                      <Card className="p-3 border-border-default bg-bg-base space-y-2">
                        <h4 className="font-semibold text-xs text-text-primary">
                          Inference Infrastructure
                        </h4>
                        <div className="grid grid-cols-2 gap-2 text-[11px]">
                          <div>
                            <span className="text-text-muted">Client SDK:</span>
                            <p className="font-mono text-text-primary">
                              {selectedLog.metadata.clientSdk}
                            </p>
                          </div>
                          <div>
                            <span className="text-text-muted">Origin Country:</span>
                            <p className="font-mono text-text-primary">
                              {selectedLog.metadata.ipCountry}
                            </p>
                          </div>
                          <div>
                            <span className="text-text-muted">Cache Hit Status:</span>
                            <p className="font-mono text-text-primary">
                              {selectedLog.metadata.cached ? (
                                <span className="text-status-healthy font-semibold">
                                  HIT (Prompt Cache)
                                </span>
                              ) : (
                                <span className="text-text-muted">MISS</span>
                              )}
                            </p>
                          </div>
                          <div>
                            <span className="text-text-muted">Finish Reason:</span>
                            <p className="font-mono text-text-primary">
                              {selectedLog.metadata.finishReason ?? 'stop'}
                            </p>
                          </div>
                        </div>
                      </Card>

                      <Card className="p-3 border-border-default bg-bg-base space-y-2">
                        <h4 className="font-semibold text-xs text-text-primary">
                          Safety & Guardrail Checks
                        </h4>
                        <div className="grid grid-cols-2 gap-2 text-[11px]">
                          <div>
                            <span className="text-text-muted">Guardrail Safety Score:</span>
                            <p className="font-mono text-status-healthy font-bold">
                              {selectedLog.metadata.guardrailScore
                                ? `${(selectedLog.metadata.guardrailScore * 100).toFixed(0)}% Pass`
                                : '98% Pass'}
                            </p>
                          </div>
                          <div>
                            <span className="text-text-muted">RAG Vector Distance:</span>
                            <p className="font-mono text-text-primary">
                              {selectedLog.metadata.vectorDistance ?? 0.24} (Cosine)
                            </p>
                          </div>
                        </div>
                      </Card>
                    </div>
                  )}
                </div>
              </>
            )}
          </RadixDialog.Content>
        </RadixDialog.Portal>
      </RadixDialog.Root>
    </div>
  );
}
