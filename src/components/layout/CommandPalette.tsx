import { useMemo } from 'react';
import { useNavigate } from 'react-router';
import { Command } from 'cmdk';
import {
  BarChart3,
  BellRing,
  Bookmark,
  Check,
  Coins,
  Cpu,
  Download,
  Gauge,
  Layers,
  Moon,
  Radio,
  RotateCcw,
  Scale,
  Search,
  Settings,
  ShieldAlert,
  Sun,
  Terminal,
  WifiOff,
  Zap,
} from 'lucide-react';
import { toast } from 'sonner';
import { setThemeMode } from '@/app/slices/themeSlice';
import {
  resetSimulator,
  setCommandPaletteOpen,
  setForceOfflineError,
  setSimulatorLatency,
} from '@/app/slices/uiSlice';
import { useAppDispatch, useAppSelector } from '@/app/store';
import { getDeterministicLogs } from '@/data/seedLogs';
import { exportLogsToCsv } from '@/lib/exportUtils';
import { getSavedViews } from '@/lib/savedViews';
import { useGetModelsListQuery } from '@/services/baseApi';
import type { ThemeMode } from '@/types';

export function CommandPalette() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const isOpen = useAppSelector((state) => state.ui.commandPaletteOpen);
  const simulator = useAppSelector((state) => state.ui.simulator);
  const themeMode = useAppSelector((state) => state.theme.mode);

  const { data: models = [] } = useGetModelsListQuery();
  const savedViews = useMemo(() => (isOpen ? getSavedViews() : []), [isOpen]);

  const handleClose = () => {
    dispatch(setCommandPaletteOpen(false));
  };

  const handleNavigate = (path: string) => {
    navigate(path);
    handleClose();
  };

  const handleTheme = (mode: ThemeMode) => {
    dispatch(setThemeMode(mode));
    toast.success(`Theme changed to ${mode}`);
    handleClose();
  };

  const handleExportCsv = () => {
    const logs = getDeterministicLogs(10000);
    exportLogsToCsv(logs);
    toast.success('Downloaded 10,000 request logs as CSV');
    handleClose();
  };

  const handleToggleChaos = () => {
    dispatch(setForceOfflineError(!simulator.forceOfflineError));
    toast.info(
      simulator.forceOfflineError
        ? 'Chaos simulator: API Outage Disabled (online)'
        : 'Chaos simulator: Force 503 Outage Enabled'
    );
    handleClose();
  };

  const handleSetLatency = (ms: number) => {
    dispatch(setSimulatorLatency(ms));
    toast.success(`Simulated network latency set to ${ms}ms`);
    handleClose();
  };

  const handleReset = () => {
    dispatch(resetSimulator());
    toast.success('Simulator reset to defaults (220ms, 0% err)');
    handleClose();
  };

  return (
    <Command.Dialog
      open={isOpen}
      onOpenChange={(open) => dispatch(setCommandPaletteOpen(open))}
      label="Command Menu"
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 sm:pt-28 bg-black/60 backdrop-blur-xs p-4"
    >
      <div className="relative w-full max-w-2xl overflow-hidden rounded-xl border border-border-strong bg-bg-surface shadow-float animate-in fade-in zoom-in-95 duration-150">
        {/* Search Input Bar */}
        <div className="flex items-center border-b border-border-default px-3.5 py-3 gap-2.5">
          <Search className="h-4 w-4 text-text-muted shrink-0" />
          <Command.Input
            placeholder="Search pages, models, logs, saved views, actions..."
            className="w-full bg-transparent text-sm text-text-primary placeholder:text-text-muted outline-none"
          />
          <kbd className="hidden sm:inline-block rounded border border-border-default bg-bg-elevated px-1.5 py-0.5 text-[10px] font-mono text-text-muted">
            ESC
          </kbd>
        </div>

        {/* Command Results List */}
        <Command.List className="max-h-[380px] overflow-y-auto p-2 text-xs divide-y divide-border-subtle focus:outline-none">
          <Command.Empty className="py-6 text-center text-xs text-text-muted">
            No matching models, pages, or commands found.
          </Command.Empty>

          {/* Group 1: Navigation & Pages */}
          <Command.Group
            heading="Navigation"
            className="py-1 text-[11px] font-semibold text-text-muted"
          >
            <Command.Item
              onSelect={() => handleNavigate('/')}
              className="flex items-center justify-between rounded-lg px-2.5 py-2 text-xs font-medium text-text-primary hover:bg-bg-elevated transition-colors cursor-pointer data-[selected=true]:bg-accent-primary/10 data-[selected=true]:text-accent-primary"
            >
              <div className="flex items-center gap-2.5">
                <BarChart3 className="h-4 w-4 text-accent-primary" />
                <span>Overview Dashboard</span>
              </div>
              <span className="text-[10px] text-text-muted font-mono">/</span>
            </Command.Item>

            <Command.Item
              onSelect={() => handleNavigate('/models')}
              className="flex items-center justify-between rounded-lg px-2.5 py-2 text-xs font-medium text-text-primary hover:bg-bg-elevated transition-colors cursor-pointer data-[selected=true]:bg-accent-primary/10 data-[selected=true]:text-accent-primary"
            >
              <div className="flex items-center gap-2.5">
                <Layers className="h-4 w-4 text-accent-cyan" />
                <span>Models Registry Table</span>
              </div>
              <span className="text-[10px] text-text-muted font-mono">/models</span>
            </Command.Item>

            <Command.Item
              onSelect={() => handleNavigate('/drift')}
              className="flex items-center justify-between rounded-lg px-2.5 py-2 text-xs font-medium text-text-primary hover:bg-bg-elevated transition-colors cursor-pointer data-[selected=true]:bg-accent-primary/10 data-[selected=true]:text-accent-primary"
            >
              <div className="flex items-center gap-2.5">
                <Zap className="h-4 w-4 text-status-warning" />
                <span>Data Drift Heatmap & Leaderboard</span>
              </div>
              <span className="text-[10px] text-text-muted font-mono">/drift</span>
            </Command.Item>

            <Command.Item
              onSelect={() => handleNavigate('/comparison')}
              className="flex items-center justify-between rounded-lg px-2.5 py-2 text-xs font-medium text-text-primary hover:bg-bg-elevated transition-colors cursor-pointer data-[selected=true]:bg-accent-primary/10 data-[selected=true]:text-accent-primary"
            >
              <div className="flex items-center gap-2.5">
                <Scale className="h-4 w-4 text-accent-primary" />
                <span>Model Comparison Matrix</span>
              </div>
              <span className="text-[10px] text-text-muted font-mono">/comparison</span>
            </Command.Item>

            <Command.Item
              onSelect={() => handleNavigate('/alerts')}
              className="flex items-center justify-between rounded-lg px-2.5 py-2 text-xs font-medium text-text-primary hover:bg-bg-elevated transition-colors cursor-pointer data-[selected=true]:bg-accent-primary/10 data-[selected=true]:text-accent-primary"
            >
              <div className="flex items-center gap-2.5">
                <ShieldAlert className="h-4 w-4 text-status-critical" />
                <span>Alerts & Incidents Center</span>
              </div>
              <span className="text-[10px] text-text-muted font-mono">/alerts</span>
            </Command.Item>

            <Command.Item
              onSelect={() => handleNavigate('/alerts/rules')}
              className="flex items-center justify-between rounded-lg px-2.5 py-2 text-xs font-medium text-text-primary hover:bg-bg-elevated transition-colors cursor-pointer data-[selected=true]:bg-accent-primary/10 data-[selected=true]:text-accent-primary"
            >
              <div className="flex items-center gap-2.5">
                <BellRing className="h-4 w-4 text-accent-cyan" />
                <span>Alert Rules Builder</span>
              </div>
              <span className="text-[10px] text-text-muted font-mono">/alerts/rules</span>
            </Command.Item>

            <Command.Item
              onSelect={() => handleNavigate('/logs')}
              className="flex items-center justify-between rounded-lg px-2.5 py-2 text-xs font-medium text-text-primary hover:bg-bg-elevated transition-colors cursor-pointer data-[selected=true]:bg-accent-primary/10 data-[selected=true]:text-accent-primary"
            >
              <div className="flex items-center gap-2.5">
                <Terminal className="h-4 w-4 text-text-secondary" />
                <span>Request Logs Explorer (10,000 Rows)</span>
              </div>
              <span className="text-[10px] text-text-muted font-mono">/logs</span>
            </Command.Item>

            <Command.Item
              onSelect={() => handleNavigate('/live')}
              className="flex items-center justify-between rounded-lg px-2.5 py-2 text-xs font-medium text-text-primary hover:bg-bg-elevated transition-colors cursor-pointer data-[selected=true]:bg-accent-primary/10 data-[selected=true]:text-accent-primary"
            >
              <div className="flex items-center gap-2.5">
                <Radio className="h-4 w-4 text-status-healthy" />
                <span>Live Streaming Telemetry</span>
              </div>
              <span className="text-[10px] text-text-muted font-mono">/live</span>
            </Command.Item>

            <Command.Item
              onSelect={() => handleNavigate('/cost')}
              className="flex items-center justify-between rounded-lg px-2.5 py-2 text-xs font-medium text-text-primary hover:bg-bg-elevated transition-colors cursor-pointer data-[selected=true]:bg-accent-primary/10 data-[selected=true]:text-accent-primary"
            >
              <div className="flex items-center gap-2.5">
                <Coins className="h-4 w-4 text-status-warning" />
                <span>Cost & Token Usage Analytics</span>
              </div>
              <span className="text-[10px] text-text-muted font-mono">/cost</span>
            </Command.Item>

            <Command.Item
              onSelect={() => handleNavigate('/settings')}
              className="flex items-center justify-between rounded-lg px-2.5 py-2 text-xs font-medium text-text-primary hover:bg-bg-elevated transition-colors cursor-pointer data-[selected=true]:bg-accent-primary/10 data-[selected=true]:text-accent-primary"
            >
              <div className="flex items-center gap-2.5">
                <Settings className="h-4 w-4 text-text-muted" />
                <span>Settings & Chaos Simulator</span>
              </div>
              <span className="text-[10px] text-text-muted font-mono">/settings</span>
            </Command.Item>
          </Command.Group>

          {/* Group 2: Models Fleet Direct Jump */}
          <Command.Group
            heading="Models Fleet"
            className="py-1 text-[11px] font-semibold text-text-muted"
          >
            {models.map((model) => (
              <Command.Item
                key={model.id}
                onSelect={() => handleNavigate(`/models/${model.id}`)}
                className="flex items-center justify-between rounded-lg px-2.5 py-2 text-xs font-medium text-text-primary hover:bg-bg-elevated transition-colors cursor-pointer data-[selected=true]:bg-accent-primary/10 data-[selected=true]:text-accent-primary"
              >
                <div className="flex items-center gap-2">
                  <Cpu className="h-3.5 w-3.5 text-accent-cyan" />
                  <span>{model.displayName}</span>
                </div>
                <div className="flex items-center gap-1.5 font-mono text-[10px] text-text-muted">
                  <span>{model.category}</span>
                  <span>•</span>
                  <span>{model.team}</span>
                </div>
              </Command.Item>
            ))}
          </Command.Group>

          {/* Group 3: Saved Views */}
          {savedViews.length > 0 && (
            <Command.Group
              heading="Saved Views"
              className="py-1 text-[11px] font-semibold text-text-muted"
            >
              {savedViews.map((view) => (
                <Command.Item
                  key={view.id}
                  onSelect={() => handleNavigate(`${view.path}${view.searchParams}`)}
                  className="flex items-center justify-between rounded-lg px-2.5 py-2 text-xs font-medium text-text-primary hover:bg-bg-elevated transition-colors cursor-pointer data-[selected=true]:bg-accent-primary/10 data-[selected=true]:text-accent-primary"
                >
                  <div className="flex items-center gap-2">
                    <Bookmark className="h-3.5 w-3.5 text-accent-primary" />
                    <span>{view.name}</span>
                  </div>
                  <span className="text-[10px] text-text-muted font-mono truncate max-w-[200px]">
                    {view.path}
                    {view.searchParams}
                  </span>
                </Command.Item>
              ))}
            </Command.Group>
          )}

          {/* Group 4: Quick Actions & Presets */}
          <Command.Group
            heading="Quick Actions & Presets"
            className="py-1 text-[11px] font-semibold text-text-muted"
          >
            <Command.Item
              onSelect={handleExportCsv}
              className="flex items-center justify-between rounded-lg px-2.5 py-2 text-xs font-medium text-text-primary hover:bg-bg-elevated transition-colors cursor-pointer data-[selected=true]:bg-accent-primary/10 data-[selected=true]:text-accent-primary"
            >
              <div className="flex items-center gap-2">
                <Download className="h-3.5 w-3.5 text-text-secondary" />
                <span>Export 10,000 Request Logs to CSV</span>
              </div>
              <span className="text-[10px] font-mono text-text-muted">Download</span>
            </Command.Item>

            <Command.Item
              onSelect={handleToggleChaos}
              className="flex items-center justify-between rounded-lg px-2.5 py-2 text-xs font-medium text-text-primary hover:bg-bg-elevated transition-colors cursor-pointer data-[selected=true]:bg-accent-primary/10 data-[selected=true]:text-accent-primary"
            >
              <div className="flex items-center gap-2">
                <WifiOff className="h-3.5 w-3.5 text-status-critical" />
                <span>Toggle Force 503 Outage Simulation</span>
              </div>
              <span className="text-[10px] font-mono text-text-muted">
                {simulator.forceOfflineError ? 'Disable' : 'Enable'}
              </span>
            </Command.Item>

            <Command.Item
              onSelect={() => handleSetLatency(0)}
              className="flex items-center justify-between rounded-lg px-2.5 py-2 text-xs font-medium text-text-primary hover:bg-bg-elevated transition-colors cursor-pointer data-[selected=true]:bg-accent-primary/10 data-[selected=true]:text-accent-primary"
            >
              <div className="flex items-center gap-2">
                <Gauge className="h-3.5 w-3.5 text-status-healthy" />
                <span>Set Network Latency to 0ms (Instant)</span>
              </div>
              <span className="text-[10px] font-mono text-text-muted">0ms</span>
            </Command.Item>

            <Command.Item
              onSelect={() => handleSetLatency(1500)}
              className="flex items-center justify-between rounded-lg px-2.5 py-2 text-xs font-medium text-text-primary hover:bg-bg-elevated transition-colors cursor-pointer data-[selected=true]:bg-accent-primary/10 data-[selected=true]:text-accent-primary"
            >
              <div className="flex items-center gap-2">
                <Gauge className="h-3.5 w-3.5 text-status-warning" />
                <span>Set Network Latency to 1500ms (Slow Network)</span>
              </div>
              <span className="text-[10px] font-mono text-text-muted">1500ms</span>
            </Command.Item>

            <Command.Item
              onSelect={handleReset}
              className="flex items-center justify-between rounded-lg px-2.5 py-2 text-xs font-medium text-text-primary hover:bg-bg-elevated transition-colors cursor-pointer data-[selected=true]:bg-accent-primary/10 data-[selected=true]:text-accent-primary"
            >
              <div className="flex items-center gap-2">
                <RotateCcw className="h-3.5 w-3.5 text-text-muted" />
                <span>Reset Chaos Simulator to Normal</span>
              </div>
              <span className="text-[10px] font-mono text-text-muted">Reset</span>
            </Command.Item>

            {/* Theme Items */}
            <Command.Item
              onSelect={() => handleTheme('dark')}
              className="flex items-center justify-between rounded-lg px-2.5 py-2 text-xs font-medium text-text-primary hover:bg-bg-elevated transition-colors cursor-pointer data-[selected=true]:bg-accent-primary/10 data-[selected=true]:text-accent-primary"
            >
              <div className="flex items-center gap-2">
                <Moon className="h-3.5 w-3.5 text-indigo-400" />
                <span>Switch to Dark Theme</span>
              </div>
              {themeMode === 'dark' && <Check className="h-3.5 w-3.5 text-accent-primary" />}
            </Command.Item>

            <Command.Item
              onSelect={() => handleTheme('light')}
              className="flex items-center justify-between rounded-lg px-2.5 py-2 text-xs font-medium text-text-primary hover:bg-bg-elevated transition-colors cursor-pointer data-[selected=true]:bg-accent-primary/10 data-[selected=true]:text-accent-primary"
            >
              <div className="flex items-center gap-2">
                <Sun className="h-3.5 w-3.5 text-amber-500" />
                <span>Switch to Light Theme</span>
              </div>
              {themeMode === 'light' && <Check className="h-3.5 w-3.5 text-accent-primary" />}
            </Command.Item>
          </Command.Group>
        </Command.List>

        {/* Footer shortcuts helper */}
        <div className="flex items-center justify-between border-t border-border-default bg-bg-elevated/40 px-3.5 py-2 text-[11px] text-text-muted">
          <div className="flex items-center gap-2">
            <span>
              Navigate:{' '}
              <kbd className="px-1 rounded border border-border-default bg-bg-base font-mono">
                ↑
              </kbd>{' '}
              <kbd className="px-1 rounded border border-border-default bg-bg-base font-mono">
                ↓
              </kbd>
            </span>
            <span>
              Select:{' '}
              <kbd className="px-1 rounded border border-border-default bg-bg-base font-mono">
                ↵
              </kbd>
            </span>
          </div>
          <span>ModelSight AI Command Bus</span>
        </div>
      </div>
    </Command.Dialog>
  );
}
