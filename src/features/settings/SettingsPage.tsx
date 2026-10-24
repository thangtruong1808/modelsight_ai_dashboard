import { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  AlertTriangle,
  Bookmark,
  Cpu,
  ExternalLink,
  Gauge,
  Info,
  Keyboard,
  Pin,
  PinOff,
  RotateCcw,
  Save,
  Server,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  User,
  WifiOff,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  resetSimulator,
  setForceOfflineError,
  setSimulatorErrorRate,
  setSimulatorLatency,
} from '@/app/slices/uiSlice';
import { useAppDispatch, useAppSelector } from '@/app/store';
import { KeyboardShortcutsModal } from '@/components/layout/KeyboardShortcutsModal';
import { ProductOnboardingTour } from '@/components/layout/ProductOnboardingTour';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { cn } from '@/lib/cn';
import {
  deleteSavedView,
  getSavedViews,
  saveView,
  togglePinSavedView,
  type SavedView,
} from '@/lib/savedViews';

export default function SettingsPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const simulator = useAppSelector((state) => state.ui.simulator);

  const [activeTab, setActiveTab] = useState<'simulator' | 'savedViews' | 'profile'>('simulator');
  const [savedViewsList, setSavedViewsList] = useState<SavedView[]>(() => getSavedViews());

  // Modal states
  const [isTourOpen, setIsTourOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);

  // New saved view form inputs
  const [newViewName, setNewViewName] = useState('');
  const [newViewPath, setNewViewPath] = useState('/models');
  const [newViewParams, setNewViewParams] = useState('?env=production');

  const refreshSavedViews = () => {
    setSavedViewsList(getSavedViews());
  };

  const handleCreateSavedView = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newViewName.trim()) {
      toast.error('Please enter a name for the saved view');
      return;
    }
    saveView({
      name: newViewName.trim(),
      description: 'Custom operator saved view',
      path: newViewPath,
      searchParams: newViewParams,
      isPinned: false,
    });
    setNewViewName('');
    refreshSavedViews();
    toast.success('Saved view created');
  };

  const handleDeleteSavedView = (id: string) => {
    deleteSavedView(id);
    refreshSavedViews();
    toast.info('Saved view deleted');
  };

  const handleTogglePin = (id: string) => {
    togglePinSavedView(id);
    refreshSavedViews();
  };

  const handleCopyLink = (view: SavedView) => {
    const fullUrl = `${window.location.origin}${view.path}${view.searchParams}`;
    navigator.clipboard.writeText(fullUrl);
    toast.success('Copied shareable view URL to clipboard');
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col justify-between gap-4 border-b border-border-default pb-5 lg:flex-row lg:items-center">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="indigo">Platform Governance & Resilience</Badge>
            <Badge variant="outline">Enterprise Org: Acme AI Lab</Badge>
          </div>
          <h1 className="mt-2 text-xl font-bold tracking-tight text-text-primary sm:text-2xl">
            Settings & Chaos Simulator
          </h1>
          <p className="mt-1 text-xs text-text-secondary sm:text-sm">
            Configure mock network latency, simulate API failure injection, manage saved views, and
            launch the reviewer tour
          </p>
        </div>

        {/* Global Action Triggers */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsTourOpen(true)}
            className="gap-1.5 text-xs shadow-xs"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Start Reviewer Tour (60s)</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsShortcutsOpen(true)}
            className="gap-1.5 text-xs"
          >
            <Keyboard className="h-3.5 w-3.5 text-text-muted" />
            <span>
              Shortcuts (<kbd className="font-mono text-[10px]">?</kbd>)
            </span>
          </Button>
        </div>
      </div>

      {/* Settings Navigation Tabs */}
      <div className="flex border-b border-border-default bg-bg-surface px-4 rounded-xl shadow-xs">
        {(
          [
            { id: 'simulator', label: 'API & Chaos Simulator', icon: Gauge },
            { id: 'savedViews', label: `Saved Views (${savedViewsList.length})`, icon: Bookmark },
            { id: 'profile', label: 'Workspace & Profile', icon: User },
          ] as const
        ).map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-2 border-b-2 py-3 px-4 text-xs font-medium transition-colors cursor-pointer',
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

      {/* Tab 1: API & Chaos Simulator Controls */}
      {activeTab === 'simulator' && (
        <div className="space-y-6">
          <Card className="border-border-default bg-bg-surface">
            <CardHeader className="pb-3 border-b border-border-subtle flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <SlidersHorizontal className="h-4 w-4 text-accent-primary" />
                  <span>Network Latency & Error Injection Controls</span>
                </CardTitle>
                <CardDescription className="text-xs">
                  Inject latency and simulate probabilistic upstream outages to verify loading
                  skeletons, error states, and retry buttons
                </CardDescription>
              </div>

              <Button
                variant="outline"
                size="xs"
                onClick={() => {
                  dispatch(resetSimulator());
                  toast.success('Simulator reset to defaults (220ms, 0% err, online)');
                }}
                className="gap-1.5 text-xs text-text-secondary hover:text-text-primary"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Reset to Defaults</span>
              </Button>
            </CardHeader>

            <CardContent className="p-6 space-y-6">
              {/* Latency Slider */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <label
                    htmlFor="latency-slider"
                    className="font-semibold text-text-primary flex items-center gap-1.5"
                  >
                    <Gauge className="h-4 w-4 text-accent-cyan" />
                    Simulated Network Latency (Round-Trip Delay)
                  </label>
                  <span className="font-mono text-xs font-bold text-accent-primary bg-accent-primary/10 px-2 py-0.5 rounded">
                    {simulator.latencyMs}ms delay
                  </span>
                </div>
                <input
                  id="latency-slider"
                  type="range"
                  min="0"
                  max="2500"
                  step="50"
                  value={simulator.latencyMs}
                  onChange={(e) => dispatch(setSimulatorLatency(Number(e.target.value)))}
                  className="w-full accent-accent-primary cursor-pointer"
                />
                <div className="flex justify-between text-[11px] font-mono text-text-muted">
                  <span>0ms (Instant Local)</span>
                  <span>500ms (Broadband)</span>
                  <span>1200ms (High Latency 3G)</span>
                  <span>2500ms (Timeout Edge)</span>
                </div>
              </div>

              {/* Error Injection Rate Slider */}
              <div className="space-y-2 border-t border-border-subtle pt-5">
                <div className="flex items-center justify-between text-xs">
                  <label
                    htmlFor="error-slider"
                    className="font-semibold text-text-primary flex items-center gap-1.5"
                  >
                    <AlertTriangle className="h-4 w-4 text-status-warning" />
                    Probabilistic API Error Injection Rate
                  </label>
                  <span
                    className={cn(
                      'font-mono text-xs font-bold px-2 py-0.5 rounded',
                      simulator.errorRatePercent > 0
                        ? 'bg-status-critical/15 text-status-critical'
                        : 'bg-status-healthy/15 text-status-healthy'
                    )}
                  >
                    {simulator.errorRatePercent}% failure rate
                  </span>
                </div>
                <input
                  id="error-slider"
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={simulator.errorRatePercent}
                  onChange={(e) => dispatch(setSimulatorErrorRate(Number(e.target.value)))}
                  className="w-full accent-status-critical cursor-pointer"
                />
                <div className="flex justify-between text-[11px] font-mono text-text-muted">
                  <span>0% (100% Reliability)</span>
                  <span>25% (Flaky Edge)</span>
                  <span>50% (Major Degradation)</span>
                  <span>100% (Full Outage)</span>
                </div>
              </div>

              {/* Complete Outage Toggle */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-border-subtle pt-5">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <WifiOff className="h-4 w-4 text-status-critical" />
                    <span className="text-xs font-semibold text-text-primary">
                      Force Complete 503 API Outage
                    </span>
                    {simulator.forceOfflineError && (
                      <Badge variant="critical" className="text-[10px]">
                        ACTIVE OUTAGE
                      </Badge>
                    )}
                  </div>
                  <p className="text-[11px] text-text-muted">
                    Forces all RTK Query endpoints to immediately reject with 503 Service
                    Unavailable
                  </p>
                </div>

                <Button
                  variant={simulator.forceOfflineError ? 'danger' : 'outline'}
                  size="sm"
                  onClick={() => dispatch(setForceOfflineError(!simulator.forceOfflineError))}
                  className="text-xs shrink-0"
                >
                  {simulator.forceOfflineError ? 'Disable 503 Outage' : 'Enable 503 Outage'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Quick Info Box */}
          <div className="rounded-xl border border-accent-primary/20 bg-accent-primary/5 p-4 text-xs text-text-primary flex items-start gap-3">
            <Info className="h-5 w-5 text-accent-primary shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-semibold text-text-primary">How the Chaos Simulator Works</h4>
              <p className="text-text-secondary leading-relaxed">
                The simulator is backed directly by the Redux store and intercepts every RTK Query
                call via our custom <code className="font-mono text-[11px]">mockBaseQuery</code>{' '}
                middleware. Adjusting latency or error rates affects Overview KPI cards, TanStack
                data tables, and mutation rollbacks across the entire application in real time.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Saved Views Manager */}
      {activeTab === 'savedViews' && (
        <div className="space-y-6">
          {/* Create New Saved View Form */}
          <Card className="border-border-default bg-bg-surface p-4">
            <form onSubmit={handleCreateSavedView} className="space-y-3">
              <h4 className="text-xs font-semibold text-text-primary flex items-center gap-2">
                <Save className="h-4 w-4 text-accent-primary" />
                <span>Save Current Dashboard Filter Configuration</span>
              </h4>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <label
                    htmlFor="view-name"
                    className="text-[11px] font-medium text-text-muted block mb-1"
                  >
                    View Name
                  </label>
                  <input
                    id="view-name"
                    type="text"
                    required
                    value={newViewName}
                    onChange={(e) => setNewViewName(e.target.value)}
                    placeholder="e.g. Prod Canary Audit"
                    className="w-full rounded-md border border-border-default bg-bg-base px-2.5 py-1.5 text-xs text-text-primary focus:border-accent-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label
                    htmlFor="view-path"
                    className="text-[11px] font-medium text-text-muted block mb-1"
                  >
                    Route Path
                  </label>
                  <select
                    id="view-path"
                    value={newViewPath}
                    onChange={(e) => setNewViewPath(e.target.value)}
                    className="w-full rounded-md border border-border-default bg-bg-base px-2.5 py-1.5 text-xs text-text-primary focus:border-accent-primary focus:outline-none"
                  >
                    <option value="/">/ (Overview Dashboard)</option>
                    <option value="/models">/models (Models Registry)</option>
                    <option value="/drift">/drift (Data Drift)</option>
                    <option value="/comparison">/comparison (Model Comparison)</option>
                    <option value="/alerts">/alerts (Incidents Center)</option>
                    <option value="/logs">/logs (Request Logs)</option>
                    <option value="/live">/live (Live Stream)</option>
                    <option value="/cost">/cost (Cost Analytics)</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="view-params"
                    className="text-[11px] font-medium text-text-muted block mb-1"
                  >
                    Query Parameters
                  </label>
                  <input
                    id="view-params"
                    type="text"
                    value={newViewParams}
                    onChange={(e) => setNewViewParams(e.target.value)}
                    placeholder="?env=production&range=7d"
                    className="w-full rounded-md border border-border-default bg-bg-base px-2.5 py-1.5 text-xs font-mono text-text-primary focus:border-accent-primary focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <Button type="submit" variant="primary" size="xs" className="gap-1.5">
                  <Bookmark className="h-3.5 w-3.5" />
                  <span>Save View to LocalStorage</span>
                </Button>
              </div>
            </form>
          </Card>

          {/* Saved Views List Table */}
          <Card className="border-border-default bg-bg-surface overflow-hidden">
            <CardHeader className="pb-3 border-b border-border-subtle">
              <CardTitle className="text-base font-bold flex items-center justify-between">
                <span>Active Saved Views</span>
                <span className="text-xs font-mono font-normal text-text-muted">
                  {savedViewsList.length} Views Configured
                </span>
              </CardTitle>
            </CardHeader>

            <div className="divide-y divide-border-subtle">
              {savedViewsList.map((view) => (
                <div
                  key={view.id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 hover:bg-bg-elevated/40 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleTogglePin(view.id)}
                        className="text-text-muted hover:text-accent-primary transition-colors cursor-pointer"
                        title={view.isPinned ? 'Unpin view' : 'Pin view to top'}
                      >
                        {view.isPinned ? (
                          <Pin className="h-3.5 w-3.5 text-accent-primary fill-accent-primary" />
                        ) : (
                          <PinOff className="h-3.5 w-3.5" />
                        )}
                      </button>

                      <strong className="text-xs font-bold text-text-primary">{view.name}</strong>

                      <Badge variant="outline" className="text-[10px] font-mono">
                        {view.path}
                      </Badge>
                    </div>

                    <p className="text-[11px] text-text-secondary">{view.description}</p>
                    <code className="text-[10px] text-accent-cyan font-mono block">
                      {view.path}
                      {view.searchParams}
                    </code>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="outline"
                      size="xs"
                      onClick={() => handleCopyLink(view)}
                      className="gap-1 text-[11px]"
                    >
                      <span>Share URL</span>
                    </Button>

                    <Button
                      variant="secondary"
                      size="xs"
                      onClick={() => navigate(`${view.path}${view.searchParams}`)}
                      className="gap-1 text-[11px]"
                    >
                      <span>Open View</span>
                      <ExternalLink className="h-3 w-3" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteSavedView(view.id)}
                      className="h-7 w-7 text-text-muted hover:text-status-critical"
                      aria-label={`Delete ${view.name}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Tab 3: Workspace & Profile */}
      {activeTab === 'profile' && (
        <div className="space-y-6">
          <Card className="border-border-default bg-bg-surface p-6 space-y-4">
            <h4 className="text-base font-bold text-text-primary flex items-center gap-2">
              <Server className="h-4 w-4 text-accent-primary" />
              <span>Enterprise Workspace Metadata</span>
            </h4>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 text-xs">
              <div>
                <span className="text-text-muted">Organization Name</span>
                <p className="font-semibold text-text-primary mt-0.5">Acme AI Lab Corporation</p>
              </div>
              <div>
                <span className="text-text-muted">Active Tier</span>
                <p className="font-semibold text-accent-cyan mt-0.5">
                  Enterprise Orchestrator (Multi-Cluster)
                </p>
              </div>
              <div>
                <span className="text-text-muted">Lead Evaluator & Engineer</span>
                <p className="font-semibold text-text-primary mt-0.5">
                  Alex Chen (Staff ML Platform)
                </p>
              </div>
              <div>
                <span className="text-text-muted">Telemetry Retention Policy</span>
                <p className="font-semibold text-text-primary mt-0.5">
                  30 Days High-Frequency • 1 Year Aggregate
                </p>
              </div>
              <div>
                <span className="text-text-muted">Default Timezone</span>
                <p className="font-mono text-text-primary mt-0.5">
                  UTC (Coordinated Universal Time)
                </p>
              </div>
              <div>
                <span className="text-text-muted">Currency Formatting</span>
                <p className="font-mono text-text-primary mt-0.5">USD ($) Standard RFC-4180</p>
              </div>
            </div>
          </Card>

          {/* Tech Stack Showcase Bill of Materials */}
          <Card className="border-border-default bg-bg-surface p-6 space-y-3">
            <h4 className="text-base font-bold text-text-primary flex items-center gap-2">
              <Cpu className="h-4 w-4 text-accent-cyan" />
              <span>Showcase Architecture & Core Dependencies</span>
            </h4>
            <p className="text-xs text-text-secondary leading-relaxed">
              ModelSight AI is engineered as a zero-dependency frontend SaaS showcase verifying
              strict production React patterns:
            </p>

            <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-2 sm:grid-cols-4">
              <div className="rounded-lg border border-border-subtle bg-bg-elevated/40 p-2.5">
                <span className="text-text-muted text-[10px] block">UI Framework</span>
                <span className="font-bold text-text-primary">React 19 + Vite</span>
              </div>
              <div className="rounded-lg border border-border-subtle bg-bg-elevated/40 p-2.5">
                <span className="text-text-muted text-[10px] block">State & Caching</span>
                <span className="font-bold text-text-primary">RTK Query</span>
              </div>
              <div className="rounded-lg border border-border-subtle bg-bg-elevated/40 p-2.5">
                <span className="text-text-muted text-[10px] block">Charts & DataViz</span>
                <span className="font-bold text-text-primary">Apache ECharts 6</span>
              </div>
              <div className="rounded-lg border border-border-subtle bg-bg-elevated/40 p-2.5">
                <span className="text-text-muted text-[10px] block">Tables & Virtual</span>
                <span className="font-bold text-text-primary">TanStack Table & Virtual</span>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Product Onboarding Tour Modal */}
      <ProductOnboardingTour isOpen={isTourOpen} onClose={() => setIsTourOpen(false)} />

      {/* Keyboard Shortcuts Cheat Sheet Modal */}
      <KeyboardShortcutsModal isOpen={isShortcutsOpen} onClose={() => setIsShortcutsOpen(false)} />
    </div>
  );
}
