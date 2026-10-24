import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import {
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import {
  ArrowUpDown,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
  Eye,
  GitCompare,
  RefreshCw,
  Search,
  X,
} from 'lucide-react';
import { DropdownMenu as RadixDropdown } from 'radix-ui';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState, ErrorState } from '@/components/ui/FeedbackStates';
import { Skeleton } from '@/components/ui/Skeleton';
import { cn } from '@/lib/cn';
import {
  formatCompactNumber,
  formatCurrency,
  formatLatency,
  formatPercent,
} from '@/lib/formatters';
import { useGetModelsListQuery } from '@/services/baseApi';
import type { ModelEntity } from '@/types';

type DensityMode = 'compact' | 'comfortable' | 'spacious';

const DENSITY_CLASSES: Record<DensityMode, string> = {
  compact: 'py-1.5 px-3',
  comfortable: 'py-2.5 px-3.5',
  spacious: 'py-4 px-4',
};

const columnHelper = createColumnHelper<ModelEntity>();

export default function ModelsRegistryPage() {
  const navigate = useNavigate();
  const { data: models = [], isLoading, isFetching, error, refetch } = useGetModelsListQuery();

  const [sorting, setSorting] = useState<SortingState>([{ id: 'requests24h', desc: true }]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});
  const [density, setDensity] = useState<DensityMode>('comfortable');

  // Filters state
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  const filteredData = useMemo(() => {
    return models.filter((model) => {
      if (selectedCategory !== 'all' && model.category !== selectedCategory) {
        return false;
      }
      if (selectedStatus !== 'all' && model.status !== selectedStatus) {
        return false;
      }
      return true;
    });
  }, [models, selectedCategory, selectedStatus]);

  const columns = useMemo(
    () => [
      columnHelper.display({
        id: 'select',
        header: ({ table }) => (
          <input
            type="checkbox"
            aria-label="Select all rows"
            checked={table.getIsAllPageRowsSelected()}
            onChange={table.getToggleAllPageRowsSelectedHandler()}
            className="h-4 w-4 rounded border-border-strong accent-accent-primary cursor-pointer"
          />
        ),
        cell: ({ row }) => (
          <input
            type="checkbox"
            aria-label={`Select row for ${row.original.displayName}`}
            checked={row.getIsSelected()}
            onChange={row.getToggleSelectedHandler()}
            className="h-4 w-4 rounded border-border-strong accent-accent-primary cursor-pointer"
          />
        ),
        enableSorting: false,
        enableHiding: false,
        size: 38,
      }),
      columnHelper.accessor('displayName', {
        header: ({ column }) => (
          <button
            type="button"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="flex items-center gap-1 font-semibold text-text-primary hover:text-accent-primary cursor-pointer"
          >
            <span>Model Name</span>
            <ArrowUpDown className="h-3 w-3 text-text-muted" />
          </button>
        ),
        cell: ({ row }) => {
          const model = row.original;
          return (
            <div className="flex flex-col min-w-[200px]">
              <Link
                to={`/models/${model.id}`}
                className="font-medium text-text-primary hover:text-accent-primary transition-colors flex items-center gap-1.5"
              >
                <span>{model.displayName}</span>
              </Link>
              <div className="flex items-center gap-2 text-[10px] text-text-muted font-mono mt-0.5">
                <span>{model.provider}</span>
                <span>•</span>
                <span>{model.activeVersion}</span>
              </div>
            </div>
          );
        },
      }),
      columnHelper.accessor('category', {
        header: 'Category',
        cell: (info) => {
          const cat = info.getValue();
          return (
            <Badge variant={cat === 'LLM' ? 'indigo' : 'default'} className="text-[10px]">
              {cat}
            </Badge>
          );
        },
      }),
      columnHelper.accessor('status', {
        header: ({ column }) => (
          <button
            type="button"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="flex items-center gap-1 font-semibold text-text-primary hover:text-accent-primary cursor-pointer"
          >
            <span>Status</span>
            <ArrowUpDown className="h-3 w-3 text-text-muted" />
          </button>
        ),
        cell: (info) => {
          const status = info.getValue();
          return (
            <Badge variant={status} dot className="text-[10px] capitalize">
              {status}
            </Badge>
          );
        },
      }),
      columnHelper.accessor('team', {
        header: 'Team',
        cell: (info) => (
          <span className="text-xs text-text-secondary whitespace-nowrap">{info.getValue()}</span>
        ),
      }),
      columnHelper.accessor('requests24h', {
        header: ({ column }) => (
          <button
            type="button"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="flex items-center justify-end w-full gap-1 font-semibold text-text-primary hover:text-accent-primary cursor-pointer"
          >
            <span>24h Invocations</span>
            <ArrowUpDown className="h-3 w-3 text-text-muted" />
          </button>
        ),
        cell: ({ row }) => (
          <div className="text-right font-mono tabular-nums font-semibold text-text-primary">
            {formatCompactNumber(row.original.requests24h)}
            <div className="text-[10px] font-normal text-text-muted">
              {row.original.requestsDeltaPct > 0 ? '+' : ''}
              {row.original.requestsDeltaPct}%
            </div>
          </div>
        ),
      }),
      columnHelper.accessor('latencyP95', {
        header: ({ column }) => (
          <button
            type="button"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="flex items-center justify-end w-full gap-1 font-semibold text-text-primary hover:text-accent-primary cursor-pointer"
          >
            <span>p95 Latency</span>
            <ArrowUpDown className="h-3 w-3 text-text-muted" />
          </button>
        ),
        cell: ({ row }) => (
          <div className="text-right font-mono tabular-nums text-text-primary">
            <span>{formatLatency(row.original.latencyP95)}</span>
            <div className="text-[10px] text-text-muted">SLA: {row.original.slaLatencyMs}ms</div>
          </div>
        ),
      }),
      columnHelper.accessor('successRate', {
        header: ({ column }) => (
          <button
            type="button"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="flex items-center justify-end w-full gap-1 font-semibold text-text-primary hover:text-accent-primary cursor-pointer"
          >
            <span>Success Rate</span>
            <ArrowUpDown className="h-3 w-3 text-text-muted" />
          </button>
        ),
        cell: (info) => (
          <div className="text-right font-mono tabular-nums text-text-primary font-medium">
            {formatPercent(info.getValue())}
          </div>
        ),
      }),
      columnHelper.accessor('driftPsi', {
        header: ({ column }) => (
          <button
            type="button"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="flex items-center justify-end w-full gap-1 font-semibold text-text-primary hover:text-accent-primary cursor-pointer"
          >
            <span>Drift (PSI)</span>
            <ArrowUpDown className="h-3 w-3 text-text-muted" />
          </button>
        ),
        cell: (info) => {
          const psi = info.getValue();
          const isHigh = psi >= 0.25;
          const isModerate = psi >= 0.15;
          return (
            <div className="text-right font-mono tabular-nums">
              <span
                className={
                  isHigh
                    ? 'text-status-critical font-bold'
                    : isModerate
                      ? 'text-status-warning font-semibold'
                      : 'text-text-secondary'
                }
              >
                {psi.toFixed(3)}
              </span>
            </div>
          );
        },
      }),
      columnHelper.accessor('cost24hUsd', {
        header: ({ column }) => (
          <button
            type="button"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="flex items-center justify-end w-full gap-1 font-semibold text-text-primary hover:text-accent-primary cursor-pointer"
          >
            <span>24h Cost</span>
            <ArrowUpDown className="h-3 w-3 text-text-muted" />
          </button>
        ),
        cell: (info) => (
          <div className="text-right font-mono tabular-nums text-text-primary">
            {formatCurrency(info.getValue())}
          </div>
        ),
      }),
      columnHelper.display({
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <div className="text-right pr-2">
            <Link to={`/models/${row.original.id}`}>
              <Button
                variant="ghost"
                size="xs"
                className="gap-1 text-xs text-accent-primary hover:bg-accent-primary/10"
              >
                <span>Drill-down</span>
                <ExternalLink className="h-3 w-3" />
              </Button>
            </Link>
          </div>
        ),
        enableSorting: false,
      }),
    ],
    []
  );

  const table = useReactTable({
    data: filteredData,
    columns,
    state: {
      sorting,
      columnFilters,
      globalFilter,
      columnVisibility,
      rowSelection,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  const selectedRows = table.getSelectedRowModel().rows;
  const selectedCount = selectedRows.length;

  const handleCompareSelected = () => {
    if (selectedCount < 2) {
      toast.error('Select at least 2 models to launch comparison');
      return;
    }
    const modelIds = selectedRows.map((r) => r.original.id).join(',');
    navigate(`/comparison?models=${modelIds}`);
  };

  const handleExportCsv = () => {
    const rowsToExport = selectedCount > 0 ? selectedRows.map((r) => r.original) : filteredData;
    const headers = [
      'ID',
      'Name',
      'Category',
      'Status',
      'Team',
      'Environment',
      '24h Requests',
      'p95 Latency (ms)',
      'Success Rate (%)',
      'Drift PSI',
      '24h Cost ($)',
    ];

    const csvContent = [
      headers.join(','),
      ...rowsToExport.map((m) =>
        [
          m.id,
          `"${m.displayName}"`,
          m.category,
          m.status,
          `"${m.team}"`,
          m.environment,
          m.requests24h,
          m.latencyP95,
          m.successRate,
          m.driftPsi,
          m.cost24hUsd,
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `modelsight-registry-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${rowsToExport.length} models to CSV`);
  };

  if (error) {
    return (
      <div className="space-y-6">
        <ErrorState
          title="Failed to Load Models Registry"
          message="Unable to communicate with the models catalog service. Check the Chaos Simulator settings or retry."
          isRetrying={isFetching}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col justify-between gap-4 border-b border-border-default pb-5 lg:flex-row lg:items-center">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="indigo">TanStack Table 9.3 Active</Badge>
            <Badge variant="outline">{models.length} Total Registered Models</Badge>
          </div>
          <h1 className="mt-2 text-xl font-bold tracking-tight text-text-primary sm:text-2xl">
            Models Registry
          </h1>
          <p className="mt-1 text-xs text-text-secondary sm:text-sm">
            Catalog of all production, staging, and shadow LLMs, ranking models, and classification
            endpoints
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            className="gap-1.5"
            aria-label="Export models to CSV"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export CSV</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            isLoading={isFetching}
            className="gap-1.5"
            aria-label="Refresh models"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* Floating / Sticky Bulk Action Bar when rows are selected */}
      {selectedCount > 0 && (
        <div className="sticky top-16 z-20 flex items-center justify-between gap-3 rounded-xl border border-accent-primary/40 bg-bg-surface px-4 py-2.5 shadow-float animate-in fade-in-0 slide-in-from-top-2 duration-150">
          <div className="flex items-center gap-2">
            <Badge variant="indigo" className="font-semibold">
              {selectedCount} model{selectedCount > 1 ? 's' : ''} selected
            </Badge>
            <span className="text-xs text-text-secondary hidden sm:inline">
              Launch side-by-side benchmark comparison or batch export
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="primary" size="sm" onClick={handleCompareSelected} className="gap-1.5">
              <GitCompare className="h-3.5 w-3.5" />
              <span>Compare Models ({selectedCount})</span>
            </Button>

            <Button variant="outline" size="sm" onClick={handleExportCsv} className="gap-1.5">
              <Download className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Export Selected</span>
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setRowSelection({})}
              aria-label="Clear selection"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Table Toolbar: Search, Filters, Column Visibility, Density Toggle */}
      <Card className="p-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Left: Search input + Faceted Filters */}
          <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-muted" />
              <input
                type="text"
                placeholder="Search models, providers, endpoints..."
                value={globalFilter ?? ''}
                onChange={(e) => setGlobalFilter(e.target.value)}
                className="h-8 w-full rounded-lg border border-border-default bg-bg-canvas pl-8 pr-3 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent-primary"
              />
            </div>

            {/* Category Filter */}
            <select
              aria-label="Filter by Category"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="h-8 rounded-lg border border-border-default bg-bg-canvas px-2.5 text-xs font-medium text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-primary cursor-pointer"
            >
              <option value="all">All Categories</option>
              <option value="LLM">LLM (Reasoning & Chat)</option>
              <option value="Classification">Classification</option>
              <option value="Ranking">Ranking & Retrieval</option>
              <option value="Embedding">Embeddings</option>
              <option value="Vision">Multimodal Vision</option>
            </select>

            {/* Status Filter */}
            <select
              aria-label="Filter by Health Status"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="h-8 rounded-lg border border-border-default bg-bg-canvas px-2.5 text-xs font-medium text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-primary cursor-pointer"
            >
              <option value="all">All Health States</option>
              <option value="healthy">Healthy</option>
              <option value="degraded">Degraded</option>
              <option value="critical">Critical</option>
            </select>
          </div>

          {/* Right: Column Visibility Dropdown & Density Switcher */}
          <div className="flex items-center gap-2">
            {/* Density Selector */}
            <div className="inline-flex items-center rounded-lg border border-border-default bg-bg-canvas p-0.5 text-xs">
              {(
                [
                  { mode: 'compact', label: 'Compact' },
                  { mode: 'comfortable', label: 'Comfortable' },
                  { mode: 'spacious', label: 'Spacious' },
                ] as const
              ).map(({ mode, label }) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setDensity(mode)}
                  className={`rounded-md px-2 py-1 text-[11px] font-medium transition-colors cursor-pointer ${
                    density === mode
                      ? 'bg-bg-surface text-text-primary shadow-xs font-semibold'
                      : 'text-text-muted hover:text-text-primary'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Column Visibility Dropdown */}
            <RadixDropdown.Root>
              <RadixDropdown.Trigger asChild>
                <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
                  <Eye className="h-3.5 w-3.5 text-text-muted" />
                  <span>Columns</span>
                  <ChevronDown className="h-3 w-3 text-text-muted" />
                </Button>
              </RadixDropdown.Trigger>

              <RadixDropdown.Portal>
                <RadixDropdown.Content
                  align="end"
                  sideOffset={6}
                  className="z-50 w-48 rounded-xl border border-border-strong bg-bg-surface p-1.5 shadow-float"
                >
                  <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                    Toggle Column Visibility
                  </div>
                  {table
                    .getAllLeafColumns()
                    .filter((column) => column.id !== 'select' && column.id !== 'actions')
                    .map((column) => (
                      <RadixDropdown.CheckboxItem
                        key={column.id}
                        checked={column.getIsVisible()}
                        onCheckedChange={(val) => column.toggleVisibility(val)}
                        className="flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs text-text-primary outline-none hover:bg-bg-elevated cursor-pointer"
                      >
                        <span className="capitalize">{column.id.replace(/([A-Z])/g, ' $1')}</span>
                        {column.getIsVisible() && (
                          <Check className="h-3.5 w-3.5 text-accent-primary" />
                        )}
                      </RadixDropdown.CheckboxItem>
                    ))}
                </RadixDropdown.Content>
              </RadixDropdown.Portal>
            </RadixDropdown.Root>
          </div>
        </div>
      </Card>

      {/* Main TanStack Table Container */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="border-b border-border-default bg-bg-elevated/70 text-[11px] font-semibold uppercase tracking-wider text-text-muted select-none">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      scope="col"
                      className={cn(
                        'py-3 px-3.5 whitespace-nowrap',
                        header.id === 'select' && 'w-10 pl-4',
                        header.id === 'displayName' && 'min-w-[220px]'
                      )}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>

            <tbody className="divide-y divide-border-subtle bg-bg-surface">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, idx) => (
                  <tr key={idx}>
                    <td colSpan={columns.length} className="py-4 px-4">
                      <div className="flex items-center gap-4">
                        <Skeleton className="h-4 w-4 rounded" />
                        <Skeleton className="h-4 w-48 rounded" />
                        <Skeleton className="h-4 w-20 rounded-full" />
                        <Skeleton className="h-4 w-24 rounded" />
                        <Skeleton className="h-4 w-28 rounded ml-auto" />
                      </div>
                    </td>
                  </tr>
                ))
              ) : table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="p-8">
                    <EmptyState
                      title="No models matching search or filter criteria"
                      description="Try clearing your search keyword or switching category and health status filters."
                      actionLabel="Reset Search & Filters"
                      onAction={() => {
                        setGlobalFilter('');
                        setSelectedCategory('all');
                        setSelectedStatus('all');
                      }}
                    />
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className={cn(
                      'hover:bg-bg-elevated/50 transition-colors',
                      row.getIsSelected() && 'bg-accent-primary/8 hover:bg-accent-primary/12'
                    )}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        className={cn(
                          DENSITY_CLASSES[density],
                          cell.column.id === 'select' && 'pl-4'
                        )}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-border-default px-4 py-3 text-xs text-text-secondary bg-bg-surface">
          <div className="flex items-center gap-2">
            <span>
              Showing{' '}
              <strong className="text-text-primary font-mono tabular-nums">
                {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}
              </strong>{' '}
              to{' '}
              <strong className="text-text-primary font-mono tabular-nums">
                {Math.min(
                  (table.getState().pagination.pageIndex + 1) *
                    table.getState().pagination.pageSize,
                  table.getFilteredRowModel().rows.length
                )}
              </strong>{' '}
              of{' '}
              <strong className="text-text-primary font-mono tabular-nums">
                {table.getFilteredRowModel().rows.length}
              </strong>{' '}
              models
            </span>

            <select
              aria-label="Rows per page"
              value={table.getState().pagination.pageSize}
              onChange={(e) => table.setPageSize(Number(e.target.value))}
              className="ml-2 h-7 rounded border border-border-default bg-bg-canvas px-2 text-xs font-medium text-text-primary cursor-pointer"
            >
              {[10, 20, 50].map((size) => (
                <option key={size} value={size}>
                  {size} / page
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 self-end sm:self-auto">
            <Button
              variant="outline"
              size="xs"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              aria-label="Previous page"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              <span>Previous</span>
            </Button>

            <span className="px-2 font-mono tabular-nums">
              Page {table.getState().pagination.pageIndex + 1} of{' '}
              {Math.max(1, table.getPageCount())}
            </span>

            <Button
              variant="outline"
              size="xs"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              aria-label="Next page"
            >
              <span>Next</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
