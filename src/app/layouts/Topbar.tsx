import { Link, useLocation, useNavigate } from 'react-router';
import { DropdownMenu as RadixDropdown, Popover as RadixPopover } from 'radix-ui';
import {
  Bell,
  Check,
  ChevronRight,
  Gauge,
  Laptop,
  Menu,
  Moon,
  RotateCcw,
  Search,
  Settings,
  SlidersHorizontal,
  Sparkles,
  Sun,
  UserCheck,
  WifiOff,
  Zap,
} from 'lucide-react';
import { toast } from 'sonner';
import { ROUTE_TITLES } from '@/app/navigation';
import { setThemeMode } from '@/app/slices/themeSlice';
import {
  resetSimulator,
  setCommandPaletteOpen,
  setForceOfflineError,
  setMobileNavOpen,
  setNotificationsOpen,
  setSimulatorErrorRate,
  setSimulatorLatency,
} from '@/app/slices/uiSlice';
import { useAppDispatch, useAppSelector } from '@/app/store';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Tooltip } from '@/components/ui/Tooltip';
import { cn } from '@/lib/cn';
import type { ThemeMode } from '@/types';

export function Topbar() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const themeMode = useAppSelector((state) => state.theme.mode);
  const resolvedTheme = useAppSelector((state) => state.theme.resolved);
  const simulator = useAppSelector((state) => state.ui.simulator);
  const globalFilters = useAppSelector((state) => state.ui.globalFilters);

  const routeMeta =
    ROUTE_TITLES[pathname] ??
    (pathname.startsWith('/models/')
      ? {
          title: `Model: ${pathname.replace('/models/', '')}`,
          subtitle: 'Deep-dive model metrics, versions, feature drift, and incidents',
          section: 'Observability',
        }
      : {
          title: 'ModelSight AI',
          subtitle: 'Production AI Observability Platform',
          section: 'Observability',
        });

  const isChaosActive =
    simulator.forceOfflineError || simulator.errorRatePercent > 0 || simulator.latencyMs >= 1000;

  const handleThemeSelect = (mode: ThemeMode) => {
    dispatch(setThemeMode(mode));
    toast.success(`Theme set to ${mode}`, {
      description: `Active appearance: ${mode === 'system' ? 'System preference' : mode}`,
    });
  };

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between gap-3 border-b border-border-default bg-bg-glass px-4 backdrop-blur-md lg:px-6">
      {/* Left: Mobile Menu Button + Breadcrumbs */}
      <div className="flex items-center gap-2.5 min-w-0">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden shrink-0"
          aria-label="Open navigation menu"
          onClick={() => dispatch(setMobileNavOpen(true))}
        >
          <Menu className="h-4 w-4" />
        </Button>

        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs min-w-0">
          <Link
            to="/"
            className="hidden sm:inline-block font-medium text-text-muted hover:text-text-primary transition-colors"
          >
            {routeMeta.section}
          </Link>
          <ChevronRight
            className="hidden sm:inline-block h-3.5 w-3.5 shrink-0 text-text-muted"
            aria-hidden="true"
          />
          <span className="truncate font-semibold text-text-primary">{routeMeta.title}</span>
        </nav>

        <Badge
          variant={
            globalFilters.environment === 'production'
              ? 'healthy'
              : globalFilters.environment === 'staging'
                ? 'warning'
                : 'info'
          }
          dot
          className="hidden xl:inline-flex uppercase tracking-wider text-[10px]"
        >
          {globalFilters.environment}
        </Badge>
      </div>

      {/* Right: Search / Command Palette Trigger, Chaos Simulator Pill, Notifications, Theme, User */}
      <div className="flex items-center gap-2">
        {/* Command Palette Search Trigger */}
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            dispatch(setCommandPaletteOpen(true));
            toast.info('Command Palette', {
              description:
                'Full fuzzy search & command palette (Cmd/Ctrl+K) unlocks in Phase 8. Try navigating via the sidebar or testing the Chaos Simulator!',
            });
          }}
          className="h-8 gap-3 px-2.5 text-text-secondary hover:text-text-primary"
          aria-label="Open command palette (Cmd+K)"
        >
          <Search className="h-3.5 w-3.5 text-text-muted" />
          <span className="hidden sm:inline text-xs">Search models, logs, actions...</span>
          <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded border border-border-strong bg-bg-canvas px-1.5 py-0.5 font-mono text-[10px] font-medium text-text-muted">
            ⌘K
          </kbd>
        </Button>

        {/* Network & Chaos Simulator Quick Popover */}
        <RadixPopover.Root>
          <Tooltip content="Simulate slow network latency & API errors">
            <RadixPopover.Trigger asChild>
              <button
                type="button"
                className={cn(
                  'hidden sm:inline-flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-medium tabular-nums transition-colors cursor-pointer',
                  isChaosActive
                    ? 'border-status-warning/40 bg-status-warning-bg text-status-warning'
                    : 'border-border-default bg-bg-elevated text-text-secondary hover:text-text-primary'
                )}
              >
                {simulator.forceOfflineError ? (
                  <WifiOff className="h-3.5 w-3.5 text-status-critical" />
                ) : (
                  <Gauge className="h-3.5 w-3.5 text-accent-cyan" />
                )}
                <span className="font-mono text-[11px]">
                  {simulator.forceOfflineError
                    ? 'OFFLINE'
                    : `${simulator.latencyMs}ms • ${simulator.errorRatePercent}% err`}
                </span>
              </button>
            </RadixPopover.Trigger>
          </Tooltip>

          <RadixPopover.Portal>
            <RadixPopover.Content
              align="end"
              sideOffset={8}
              className="z-50 w-80 rounded-xl border border-border-strong bg-bg-surface p-4 shadow-float focus:outline-none"
            >
              <div className="flex items-center justify-between border-b border-border-subtle pb-3">
                <div>
                  <h4 className="text-xs font-semibold text-text-primary flex items-center gap-1.5">
                    <SlidersHorizontal className="h-3.5 w-3.5 text-accent-primary" />
                    API & Chaos Simulator
                  </h4>
                  <p className="text-[11px] text-text-muted mt-0.5">
                    Test loading skeletons, error boundaries & retries
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={() => {
                    dispatch(resetSimulator());
                    toast.success('Network simulator reset to normal (220ms, 0% errors)');
                  }}
                >
                  <RotateCcw className="h-3 w-3" />
                  Reset
                </Button>
              </div>

              <div className="mt-3 space-y-3.5">
                {/* Latency Slider */}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <label htmlFor="sim-latency" className="text-text-secondary font-medium">
                      Simulated Latency
                    </label>
                    <span className="font-mono font-semibold text-text-primary tabular-nums">
                      {simulator.latencyMs} ms
                    </span>
                  </div>
                  <input
                    id="sim-latency"
                    type="range"
                    min={0}
                    max={2500}
                    step={50}
                    value={simulator.latencyMs}
                    onChange={(e) => dispatch(setSimulatorLatency(Number(e.target.value)))}
                    className="w-full accent-indigo-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-text-muted font-mono">
                    <span>0ms (Instant)</span>
                    <span>800ms</span>
                    <span>2500ms (Slow)</span>
                  </div>
                </div>

                {/* Error Rate Slider */}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <label htmlFor="sim-error" className="text-text-secondary font-medium">
                      Failure Injection Rate
                    </label>
                    <span className="font-mono font-semibold text-status-warning tabular-nums">
                      {simulator.errorRatePercent}%
                    </span>
                  </div>
                  <input
                    id="sim-error"
                    type="range"
                    min={0}
                    max={100}
                    step={10}
                    value={simulator.errorRatePercent}
                    onChange={(e) => dispatch(setSimulatorErrorRate(Number(e.target.value)))}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                </div>

                {/* Force 100% Error Toggle */}
                <div className="flex items-center justify-between rounded-lg border border-border-default bg-bg-elevated/60 px-3 py-2">
                  <div>
                    <div className="text-xs font-medium text-text-primary">Force API Outage</div>
                    <div className="text-[10px] text-text-muted">
                      Triggers error & retry UI across active queries
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    aria-label="Force API Outage"
                    checked={simulator.forceOfflineError}
                    onChange={(e) => dispatch(setForceOfflineError(e.target.checked))}
                    className="h-4 w-4 rounded accent-rose-500 cursor-pointer"
                  />
                </div>
              </div>
              <RadixPopover.Arrow className="fill-border-strong" />
            </RadixPopover.Content>
          </RadixPopover.Portal>
        </RadixPopover.Root>

        {/* Notifications Trigger */}
        <Tooltip content="Notifications (3 unread incidents)">
          <Button
            variant="ghost"
            size="icon"
            className="relative"
            aria-label="Open notifications"
            onClick={() => {
              dispatch(setNotificationsOpen(true));
              navigate('/alerts');
              toast.info('Navigated to Alerts & Incidents Center');
            }}
          >
            <Bell className="h-4 w-4" />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-status-critical ring-2 ring-bg-surface" />
          </Button>
        </Tooltip>

        {/* Theme Switcher Dropdown */}
        <RadixDropdown.Root>
          <Tooltip content={`Theme: ${themeMode} (${resolvedTheme})`}>
            <RadixDropdown.Trigger asChild>
              <Button variant="ghost" size="icon" aria-label="Toggle color theme">
                {resolvedTheme === 'dark' ? (
                  <Moon className="h-4 w-4 text-indigo-400" />
                ) : (
                  <Sun className="h-4 w-4 text-amber-500" />
                )}
              </Button>
            </RadixDropdown.Trigger>
          </Tooltip>

          <RadixDropdown.Portal>
            <RadixDropdown.Content
              align="end"
              sideOffset={8}
              className="z-50 min-w-40 rounded-xl border border-border-strong bg-bg-surface p-1.5 shadow-float"
            >
              <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                Appearance
              </div>
              {(
                [
                  { mode: 'light', label: 'Light', icon: Sun },
                  { mode: 'dark', label: 'Dark', icon: Moon },
                  { mode: 'system', label: 'System', icon: Laptop },
                ] as const
              ).map(({ mode, label, icon: Icon }) => (
                <RadixDropdown.Item
                  key={mode}
                  onSelect={() => handleThemeSelect(mode)}
                  className="flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-medium text-text-primary outline-none hover:bg-bg-elevated focus:bg-bg-elevated cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <Icon className="h-3.5 w-3.5 text-text-secondary" />
                    {label}
                  </span>
                  {themeMode === mode && <Check className="h-3.5 w-3.5 text-accent-primary" />}
                </RadixDropdown.Item>
              ))}
            </RadixDropdown.Content>
          </RadixDropdown.Portal>
        </RadixDropdown.Root>

        {/* User Profile Dropdown */}
        <RadixDropdown.Root>
          <RadixDropdown.Trigger asChild>
            <button
              type="button"
              aria-label="Open user menu"
              className="flex items-center gap-2 rounded-lg border border-border-default bg-bg-elevated/60 p-1 pr-2.5 text-left hover:bg-bg-elevated transition-colors cursor-pointer"
            >
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-tr from-indigo-500 to-cyan-500 text-[11px] font-bold text-white">
                AC
              </div>
              <div className="hidden lg:flex flex-col leading-none">
                <span className="text-xs font-semibold text-text-primary">Alex Chen</span>
                <span className="text-[10px] text-text-muted">Staff ML Engineer</span>
              </div>
            </button>
          </RadixDropdown.Trigger>

          <RadixDropdown.Portal>
            <RadixDropdown.Content
              align="end"
              sideOffset={8}
              className="z-50 w-56 rounded-xl border border-border-strong bg-bg-surface p-1.5 shadow-float"
            >
              <div className="border-b border-border-subtle px-2.5 py-2">
                <p className="text-xs font-semibold text-text-primary">Alex Chen</p>
                <p className="text-[11px] text-text-muted font-mono">alex.chen@modelsight.ai</p>
                <Badge variant="indigo" className="mt-1.5 text-[10px]">
                  Enterprise Tier • Org Admin
                </Badge>
              </div>

              <div className="py-1">
                <RadixDropdown.Item
                  onSelect={() => navigate('/settings')}
                  className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-text-primary outline-none hover:bg-bg-elevated cursor-pointer"
                >
                  <Settings className="h-3.5 w-3.5 text-text-secondary" />
                  Workspace & API Simulator
                </RadixDropdown.Item>
                <RadixDropdown.Item
                  onSelect={() => navigate('/live')}
                  className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-text-primary outline-none hover:bg-bg-elevated cursor-pointer"
                >
                  <Zap className="h-3.5 w-3.5 text-accent-cyan" />
                  Live Telemetry Stream
                </RadixDropdown.Item>
                <RadixDropdown.Item
                  onSelect={() =>
                    toast.success('Reviewer Showcase Mode Active', {
                      description:
                        'All 14 ML/LLM models are running deterministic seeded telemetry.',
                    })
                  }
                  className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-text-primary outline-none hover:bg-bg-elevated cursor-pointer"
                >
                  <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                  About Showcase Build
                </RadixDropdown.Item>
              </div>

              <div className="border-t border-border-subtle pt-1">
                <RadixDropdown.Item
                  onSelect={() => toast.info('Role: Staff ML Platform Lead (Demo Session)')}
                  className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-text-secondary outline-none hover:bg-bg-elevated cursor-pointer"
                >
                  <UserCheck className="h-3.5 w-3.5" />
                  Active Session: Demo Admin
                </RadixDropdown.Item>
              </div>
            </RadixDropdown.Content>
          </RadixDropdown.Portal>
        </RadixDropdown.Root>
      </div>
    </header>
  );
}
