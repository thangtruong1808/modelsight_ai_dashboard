import { useEffect } from 'react';
import { useSearchParams } from 'react-router';
import {
  Calendar,
  Check,
  ChevronDown,
  Filter,
  GitCompare,
  RotateCcw,
  Share2,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';
import { resetGlobalFilters, updateGlobalFilters } from '@/app/slices/uiSlice';
import { useAppDispatch, useAppSelector } from '@/app/store';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Tooltip } from '@/components/ui/Tooltip';
import { getSeedDatabase } from '@/data/seed';
import type { EngineeringTeam, EnvironmentType, GlobalFilterState, TimeRangeType } from '@/types';

const ENVIRONMENTS: Array<{ label: string; value: EnvironmentType | 'all' }> = [
  { label: 'Production', value: 'production' },
  { label: 'Staging', value: 'staging' },
  { label: 'Shadow Mirror', value: 'shadow' },
  { label: 'All Environments', value: 'all' },
];

const TIME_RANGES: Array<{ label: string; value: TimeRangeType }> = [
  { label: '1 Hour', value: '1h' },
  { label: '24 Hours', value: '24h' },
  { label: '7 Days', value: '7d' },
  { label: '30 Days', value: '30d' },
  { label: '90 Days', value: '90d' },
];

const TEAMS: Array<{ label: string; value: EngineeringTeam | 'all' }> = [
  { label: 'All Teams', value: 'all' },
  { label: 'Core AI', value: 'Core AI' },
  { label: 'Customer Experience', value: 'Customer Experience' },
  { label: 'Risk & Fraud', value: 'Risk & Fraud' },
  { label: 'Search & Growth', value: 'Search & Growth' },
  { label: 'Platform Infra', value: 'Platform Infra' },
];

export function GlobalFilterBar() {
  const dispatch = useAppDispatch();
  const filters = useAppSelector((state) => state.ui.globalFilters);
  const [searchParams, setSearchParams] = useSearchParams();

  // On mount or when URL searchParams change, sync into Redux
  useEffect(() => {
    const envParam = searchParams.get('env');
    const rangeParam = searchParams.get('range');
    const compareParam = searchParams.get('compare');
    const teamParam = searchParams.get('team');
    const modelParam = searchParams.get('model');

    const updates: Partial<GlobalFilterState> = {};

    if (
      envParam === 'production' ||
      envParam === 'staging' ||
      envParam === 'shadow' ||
      envParam === 'all'
    ) {
      updates.environment = envParam;
    }

    if (
      rangeParam === '1h' ||
      rangeParam === '24h' ||
      rangeParam === '7d' ||
      rangeParam === '30d' ||
      rangeParam === '90d'
    ) {
      updates.timeRange = rangeParam;
    }

    if (compareParam !== null) {
      updates.compareToPrevious = compareParam === 'true';
    }

    if (teamParam !== null) {
      updates.team = teamParam;
    }

    if (modelParam !== null) {
      updates.modelId = modelParam;
    }

    if (Object.keys(updates).length > 0) {
      dispatch(updateGlobalFilters(updates));
    }
  }, [searchParams, dispatch]);

  const updateParamAndState = (updates: Partial<GlobalFilterState>) => {
    dispatch(updateGlobalFilters(updates));

    const nextParams = new URLSearchParams(searchParams);
    if (updates.environment !== undefined) {
      nextParams.set('env', updates.environment);
    }
    if (updates.timeRange !== undefined) {
      nextParams.set('range', updates.timeRange);
    }
    if (updates.compareToPrevious !== undefined) {
      nextParams.set('compare', String(updates.compareToPrevious));
    }
    if (updates.team !== undefined) {
      nextParams.set('team', updates.team);
    }
    if (updates.modelId !== undefined) {
      nextParams.set('model', updates.modelId);
    }

    setSearchParams(nextParams, { replace: true });
  };

  const handleResetFilters = () => {
    dispatch(resetGlobalFilters());
    setSearchParams(new URLSearchParams(), { replace: true });
    toast.success('Filters reset to default production view');
  };

  const handleShareLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Shareable view link copied to clipboard', {
      description: 'Includes active environment, time range, compare mode, and team filters.',
    });
  };

  const db = getSeedDatabase();
  const models = db.models;

  const isNonDefault =
    filters.environment !== 'production' ||
    filters.timeRange !== '7d' ||
    !filters.compareToPrevious ||
    filters.team !== 'all' ||
    filters.modelId !== 'all';

  return (
    <div
      role="region"
      aria-label="Global Telemetry Filters"
      className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border-default bg-bg-surface px-3.5 py-2.5 shadow-xs"
    >
      {/* Left side: Filter controls */}
      <div className="flex flex-wrap items-center gap-2.5 text-xs">
        <span className="flex items-center gap-1.5 font-medium text-text-muted">
          <Filter className="h-3.5 w-3.5 text-accent-primary" />
          <span className="hidden sm:inline">Filters:</span>
        </span>

        {/* Environment Selector Pills */}
        <div className="inline-flex items-center rounded-lg border border-border-default bg-bg-elevated/60 p-0.5">
          {ENVIRONMENTS.map((env) => (
            <button
              key={env.value}
              type="button"
              onClick={() => updateParamAndState({ environment: env.value })}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer ${
                filters.environment === env.value
                  ? 'bg-bg-surface text-text-primary shadow-xs font-semibold'
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              {env.label}
            </button>
          ))}
        </div>

        {/* Time Range Selector */}
        <div className="relative inline-flex items-center">
          <Calendar className="pointer-events-none absolute left-2.5 h-3.5 w-3.5 text-text-muted" />
          <select
            aria-label="Time Range Filter"
            value={filters.timeRange}
            onChange={(e) => updateParamAndState({ timeRange: e.target.value as TimeRangeType })}
            className="h-8 rounded-lg border border-border-default bg-bg-elevated/70 pl-8 pr-7 text-xs font-medium text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-primary cursor-pointer appearance-none"
          >
            {TIME_RANGES.map((tr) => (
              <option key={tr.value} value={tr.value}>
                Window: {tr.label}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 h-3.5 w-3.5 text-text-muted" />
        </div>

        {/* Compare to Previous Period Toggle */}
        <button
          type="button"
          onClick={() => updateParamAndState({ compareToPrevious: !filters.compareToPrevious })}
          className={`inline-flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-medium transition-colors cursor-pointer ${
            filters.compareToPrevious
              ? 'border-accent-primary/40 bg-accent-primary/10 text-accent-primary font-semibold'
              : 'border-border-default bg-bg-elevated/60 text-text-secondary hover:text-text-primary'
          }`}
        >
          <GitCompare className="h-3.5 w-3.5 shrink-0" />
          <span>Compare Period</span>
          {filters.compareToPrevious && <Check className="h-3 w-3 text-accent-primary" />}
        </button>

        {/* Team Selector */}
        <div className="relative inline-flex items-center">
          <Users className="pointer-events-none absolute left-2.5 h-3.5 w-3.5 text-text-muted" />
          <select
            aria-label="Filter by Team"
            value={filters.team}
            onChange={(e) => updateParamAndState({ team: e.target.value })}
            className="h-8 rounded-lg border border-border-default bg-bg-elevated/70 pl-8 pr-7 text-xs font-medium text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-primary cursor-pointer appearance-none"
          >
            {TEAMS.map((t) => (
              <option key={t.value} value={t.value}>
                Team: {t.label}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 h-3.5 w-3.5 text-text-muted" />
        </div>

        {/* Model Filter (Optional specific model) */}
        <div className="relative hidden xl:inline-flex items-center">
          <select
            aria-label="Filter by Specific Model"
            value={filters.modelId}
            onChange={(e) => updateParamAndState({ modelId: e.target.value })}
            className="h-8 max-w-[200px] truncate rounded-lg border border-border-default bg-bg-elevated/70 px-2.5 pr-7 text-xs font-medium text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-primary cursor-pointer appearance-none"
          >
            <option value="all">All 14 Models Fleet</option>
            {models.map((m) => (
              <option key={m.id} value={m.id}>
                {m.displayName}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 h-3.5 w-3.5 text-text-muted" />
        </div>
      </div>

      {/* Right side: Share view & Reset buttons */}
      <div className="flex items-center gap-2">
        {isNonDefault && (
          <Tooltip content="Reset filters to standard 7-day production telemetry">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetFilters}
              className="h-8 gap-1.5 text-text-secondary hover:text-text-primary"
            >
              <RotateCcw className="h-3 w-3" />
              <span className="hidden sm:inline">Reset</span>
            </Button>
          </Tooltip>
        )}

        <Tooltip content="Copy shareable link with current active filters">
          <Button
            variant="outline"
            size="sm"
            onClick={handleShareLink}
            className="h-8 gap-1.5 text-text-secondary hover:text-text-primary"
          >
            <Share2 className="h-3 w-3" />
            <span className="hidden sm:inline">Share View</span>
          </Button>
        </Tooltip>

        {filters.compareToPrevious && (
          <Badge variant="indigo" className="hidden lg:inline-flex text-[10px]">
            Comparison Overlay On
          </Badge>
        )}
      </div>
    </div>
  );
}

