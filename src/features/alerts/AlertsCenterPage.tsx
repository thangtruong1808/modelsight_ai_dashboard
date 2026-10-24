import { useState } from 'react';
import { Link } from 'react-router';
import { Dialog as RadixDialog } from 'radix-ui';
import {
  BellRing,
  CheckCircle2,
  Clock,
  ExternalLink,
  Filter,
  MessageSquare,
  RefreshCw,
  Send,
  ShieldAlert,
  Sliders,
  Terminal,
  UserCheck,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState, ErrorState } from '@/components/ui/FeedbackStates';
import { Skeleton } from '@/components/ui/Skeleton';
import { cn } from '@/lib/cn';
import {
  useAcknowledgeIncidentMutation,
  useAddIncidentNoteMutation,
  useGetIncidentsListQuery,
  useResolveIncidentMutation,
} from '@/services/baseApi';
import type { IncidentEntity } from '@/types';

type StatusFilter = 'all' | 'active' | 'acknowledged' | 'resolved';
type SeverityFilter = 'all' | 'critical' | 'warning' | 'info';

export default function AlertsCenterPage() {
  const {
    data: incidents = [],
    isLoading,
    isFetching,
    error,
    refetch,
  } = useGetIncidentsListQuery();

  const [acknowledgeIncident, { isLoading: isAckLoading }] = useAcknowledgeIncidentMutation();
  const [resolveIncident, { isLoading: isResolveLoading }] = useResolveIncidentMutation();
  const [addIncidentNote] = useAddIncidentNoteMutation();

  const [selectedStatus, setSelectedStatus] = useState<StatusFilter>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<SeverityFilter>('all');

  const [activeDrawerIncident, setActiveDrawerIncident] = useState<IncidentEntity | null>(null);
  const [investigationNote, setInvestigationNote] = useState('');

  const filteredIncidents = incidents.filter((inc) => {
    if (selectedStatus !== 'all' && inc.status !== selectedStatus) return false;
    if (selectedSeverity !== 'all' && inc.severity !== selectedSeverity) return false;
    return true;
  });

  const activeCount = incidents.filter((i) => i.status === 'active').length;
  const ackCount = incidents.filter((i) => i.status === 'acknowledged').length;
  const resolvedCount = incidents.filter((i) => i.status === 'resolved').length;

  const handleAcknowledge = async (id: string) => {
    try {
      await acknowledgeIncident({ incidentId: id }).unwrap();
      toast.success(`Incident acknowledged (${id})`, {
        description: 'Optimistic update applied to timeline and on-call rotation.',
      });
    } catch {
      toast.error(`Failed to acknowledge incident ${id}`, {
        description: 'Optimistic state rolled back (check Chaos Simulator settings).',
      });
    }
  };

  const handleResolve = async (id: string) => {
    try {
      await resolveIncident({ incidentId: id }).unwrap();
      toast.success(`Incident marked as resolved (${id})`, {
        description: 'Telemetry verified back within SLA boundaries.',
      });
    } catch {
      toast.error(`Failed to resolve incident ${id}`, {
        description: 'Optimistic state rolled back.',
      });
    }
  };

  const handleAddNote = async () => {
    if (!activeDrawerIncident || !investigationNote.trim()) return;
    try {
      await addIncidentNote({
        incidentId: activeDrawerIncident.id,
        note: investigationNote.trim(),
      }).unwrap();
      setInvestigationNote('');
      toast.success('Investigation note recorded in timeline');
    } catch {
      toast.error('Failed to post timeline note');
    }
  };

  // Keep active drawer incident updated if query data updates optimistically
  const currentDrawerIncident =
    activeDrawerIncident &&
    (incidents.find((i) => i.id === activeDrawerIncident.id) ?? activeDrawerIncident);

  if (error) {
    return (
      <div className="space-y-6">
        <ErrorState
          title="Failed to Load Operational Incidents"
          message="Unable to communicate with the incident triage bus."
          isRetrying={isFetching}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 border-b border-border-default pb-5 lg:flex-row lg:items-center">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="critical">On-Call SLA Triage Active</Badge>
            <Badge variant="outline">PagerDuty & Slack Sync</Badge>
          </div>
          <h1 className="mt-2 text-xl font-bold tracking-tight text-text-primary sm:text-2xl">
            Alerts & Incidents Center
          </h1>
          <p className="mt-1 text-xs text-text-secondary sm:text-sm">
            Operational triage for SLA tail-latency breaches, feature drift anomalies, and upstream
            token rate limits
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link to="/alerts/rules">
            <Button variant="primary" size="sm" className="gap-1.5">
              <BellRing className="h-3.5 w-3.5" />
              <span>Alert Rules Builder</span>
            </Button>
          </Link>

          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            isLoading={isFetching}
            className="gap-1.5"
            aria-label="Refresh incidents"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* KPI Status Strip */}
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
        <Card
          onClick={() => setSelectedStatus('active')}
          className={cn(
            'p-4 transition-all cursor-pointer hover:border-border-strong',
            selectedStatus === 'active' &&
              'ring-2 ring-status-critical/40 border-status-critical/40'
          )}
        >
          <div className="flex items-center justify-between text-xs text-text-secondary">
            <span>Active Incidents</span>
            <ShieldAlert className="h-4 w-4 text-status-critical" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="font-mono text-2xl font-bold text-status-critical">{activeCount}</span>
            <Badge variant="critical">Requires Triage</Badge>
          </div>
        </Card>

        <Card
          onClick={() => setSelectedStatus('acknowledged')}
          className={cn(
            'p-4 transition-all cursor-pointer hover:border-border-strong',
            selectedStatus === 'acknowledged' &&
              'ring-2 ring-status-warning/40 border-status-warning/40'
          )}
        >
          <div className="flex items-center justify-between text-xs text-text-secondary">
            <span>Under Investigation</span>
            <UserCheck className="h-4 w-4 text-status-warning" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="font-mono text-2xl font-bold text-status-warning">{ackCount}</span>
            <Badge variant="warning">Assigned to On-Call</Badge>
          </div>
        </Card>

        <Card
          onClick={() => setSelectedStatus('resolved')}
          className={cn(
            'p-4 transition-all cursor-pointer hover:border-border-strong',
            selectedStatus === 'resolved' &&
              'ring-2 ring-status-healthy/40 border-status-healthy/40'
          )}
        >
          <div className="flex items-center justify-between text-xs text-text-secondary">
            <span>Resolved (Last 24h)</span>
            <CheckCircle2 className="h-4 w-4 text-status-healthy" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="font-mono text-2xl font-bold text-status-healthy">
              {resolvedCount}
            </span>
            <Badge variant="healthy">Normal Telemetry</Badge>
          </div>
        </Card>
      </div>

      {/* Filter Bar */}
      <Card className="p-3">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="flex items-center gap-1.5 font-medium text-text-muted">
              <Filter className="h-3.5 w-3.5 text-accent-primary" />
              <span>Status:</span>
            </span>

            <div className="inline-flex items-center rounded-lg border border-border-default bg-bg-canvas p-0.5">
              {(
                [
                  { id: 'all', label: 'All Incidents' },
                  { id: 'active', label: `Active (${activeCount})` },
                  { id: 'acknowledged', label: `Investigating (${ackCount})` },
                  { id: 'resolved', label: `Resolved (${resolvedCount})` },
                ] as const
              ).map(({ id, label }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setSelectedStatus(id)}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer ${
                    selectedStatus === id
                      ? 'bg-bg-surface text-text-primary shadow-xs font-semibold'
                      : 'text-text-muted hover:text-text-primary'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <span className="text-text-muted hidden sm:inline">•</span>

            {/* Severity Filter */}
            <select
              aria-label="Filter by Severity"
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value as SeverityFilter)}
              className="h-8 rounded-lg border border-border-default bg-bg-canvas px-2.5 text-xs font-medium text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-primary cursor-pointer"
            >
              <option value="all">All Severities</option>
              <option value="critical">Critical Severity</option>
              <option value="warning">Warning</option>
              <option value="info">Info</option>
            </select>
          </div>

          <div className="text-[11px] text-text-muted">
            Showing <strong className="text-text-primary">{filteredIncidents.length}</strong>{' '}
            incidents
          </div>
        </div>
      </Card>

      {/* Incidents List Cards */}
      <div className="space-y-3.5">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, idx) => (
            <Card key={idx} className="p-5 space-y-3">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-3.5 w-1/2" />
            </Card>
          ))
        ) : filteredIncidents.length === 0 ? (
          <EmptyState
            title="No Incidents Matching Active Filter"
            description="All monitored services are operating within expected SLA thresholds."
            actionLabel="Reset Status Filters"
            onAction={() => {
              setSelectedStatus('all');
              setSelectedSeverity('all');
            }}
          />
        ) : (
          filteredIncidents.map((incident) => (
            <Card
              key={incident.id}
              className={cn(
                'group p-5 transition-all duration-200 hover:border-border-strong hover:shadow-card',
                incident.status === 'active' && 'border-status-critical/30 bg-status-critical-bg/10'
              )}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-text-primary">
                      {incident.id}
                    </span>
                    <Badge variant={incident.severity} dot className="capitalize text-[10px]">
                      {incident.severity}
                    </Badge>
                    <Badge
                      variant={
                        incident.status === 'active'
                          ? 'critical'
                          : incident.status === 'acknowledged'
                            ? 'warning'
                            : 'healthy'
                      }
                      className="capitalize text-[10px]"
                    >
                      {incident.status}
                    </Badge>
                    <span className="text-[11px] text-text-muted font-mono">
                      Triggered {new Date(incident.triggeredAt).toLocaleTimeString()}
                    </span>
                  </div>

                  <h3 className="text-sm font-semibold text-text-primary">{incident.title}</h3>

                  <p className="text-xs text-text-secondary leading-relaxed">{incident.summary}</p>

                  <div className="flex flex-wrap items-center gap-4 text-xs pt-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-text-muted">Target:</span>
                      <Link
                        to={`/models/${incident.modelId}`}
                        className="font-medium text-accent-primary hover:underline inline-flex items-center gap-1"
                      >
                        {incident.modelName}
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="text-text-muted">Breach:</span>
                      <strong className="font-mono text-status-critical tabular-nums">
                        {incident.metricValue}
                      </strong>
                      <span className="text-text-muted text-[11px]">
                        (Threshold: {incident.thresholdValue})
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-text-muted">
                      <Terminal className="h-3 w-3" />
                      <code className="font-mono text-[11px]">{incident.affectedEndpoint}</code>
                    </div>
                  </div>
                </div>

                {/* Right Action Buttons */}
                <div className="flex sm:flex-col items-end gap-2 shrink-0">
                  <Button
                    variant="outline"
                    size="xs"
                    onClick={() => setActiveDrawerIncident(incident)}
                    className="gap-1.5 text-xs"
                  >
                    <Clock className="h-3.5 w-3.5" />
                    <span>Timeline ({incident.timeline.length})</span>
                  </Button>

                  {incident.status === 'active' && (
                    <Button
                      variant="secondary"
                      size="xs"
                      isLoading={isAckLoading}
                      onClick={() => handleAcknowledge(incident.id)}
                      className="text-xs border-status-warning/40 text-status-warning hover:bg-status-warning-bg"
                    >
                      <UserCheck className="h-3.5 w-3.5" />
                      <span>Acknowledge</span>
                    </Button>
                  )}

                  {incident.status !== 'resolved' && (
                    <Button
                      variant="outline"
                      size="xs"
                      isLoading={isResolveLoading}
                      onClick={() => handleResolve(incident.id)}
                      className="text-xs border-status-healthy/40 text-status-healthy hover:bg-status-healthy-bg"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Mark Resolved</span>
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Incident Timeline Side Drawer (Radix Dialog) */}
      <RadixDialog.Root
        open={Boolean(activeDrawerIncident)}
        onOpenChange={(open) => {
          if (!open) setActiveDrawerIncident(null);
        }}
      >
        <RadixDialog.Portal>
          <RadixDialog.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs" />
          <RadixDialog.Content
            aria-describedby="timeline-desc"
            className="fixed inset-y-0 right-0 z-50 flex w-full max-w-lg flex-col border-l border-border-default bg-bg-surface shadow-float focus:outline-none"
          >
            {currentDrawerIncident && (
              <>
                {/* Drawer Header */}
                <div className="flex items-center justify-between border-b border-border-subtle p-5">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-text-primary">
                        {currentDrawerIncident.id}
                      </span>
                      <Badge
                        variant={currentDrawerIncident.severity}
                        dot
                        className="capitalize text-[10px]"
                      >
                        {currentDrawerIncident.severity}
                      </Badge>
                      <Badge variant="outline" className="text-[10px] capitalize">
                        {currentDrawerIncident.status}
                      </Badge>
                    </div>
                    <RadixDialog.Title className="mt-1 text-sm font-bold text-text-primary line-clamp-1">
                      {currentDrawerIncident.title}
                    </RadixDialog.Title>
                    <p id="timeline-desc" className="text-xs text-text-secondary mt-0.5">
                      Diagnostic trace and event sequence
                    </p>
                  </div>
                  <RadixDialog.Close asChild>
                    <Button variant="ghost" size="icon" aria-label="Close timeline drawer">
                      <X className="h-4 w-4" />
                    </Button>
                  </RadixDialog.Close>
                </div>

                {/* Root Cause Hint Banner */}
                <div className="border-b border-border-subtle bg-bg-elevated/40 p-4 text-xs space-y-1">
                  <span className="font-semibold text-text-primary flex items-center gap-1.5">
                    <Sliders className="h-3.5 w-3.5 text-accent-cyan" />
                    Automated Root-Cause Diagnostic Hint:
                  </span>
                  <p className="text-text-secondary leading-relaxed pl-5">
                    {currentDrawerIncident.rootCauseHint}
                  </p>
                </div>

                {/* Timeline Events List */}
                <div className="flex-1 overflow-y-auto p-5 space-y-4">
                  <div className="relative pl-6 space-y-5 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-border-default">
                    {currentDrawerIncident.timeline.map((event) => (
                      <div key={event.id} className="relative space-y-1">
                        {/* Status Icon Marker */}
                        <div className="absolute -left-[27px] top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-bg-surface ring-2 ring-accent-primary">
                          <span className="h-1.5 w-1.5 rounded-full bg-accent-primary" />
                        </div>

                        <div className="flex items-center justify-between text-[11px]">
                          <strong className="font-semibold text-text-primary">{event.actor}</strong>
                          <span className="text-text-muted font-mono">
                            {new Date(event.timestamp).toLocaleTimeString()}
                          </span>
                        </div>

                        <p className="text-xs text-text-secondary bg-bg-canvas rounded-lg p-2.5 border border-border-subtle leading-relaxed">
                          {event.message}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Add Investigation Note Box */}
                <div className="border-t border-border-default p-4 bg-bg-surface space-y-2">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-3.5 w-3.5 text-text-muted" />
                    <span className="text-xs font-medium text-text-primary">
                      Add Investigation Note
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="e.g. Scaling inference replicas from 4 to 8..."
                      value={investigationNote}
                      onChange={(e) => setInvestigationNote(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAddNote();
                      }}
                      className="h-8 flex-1 rounded-lg border border-border-default bg-bg-canvas px-3 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent-primary"
                    />
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleAddNote}
                      disabled={!investigationNote.trim()}
                      className="h-8 px-3"
                    >
                      <Send className="h-3 w-3" />
                      <span>Post</span>
                    </Button>
                  </div>
                </div>
              </>
            )}
          </RadixDialog.Content>
        </RadixDialog.Portal>
      </RadixDialog.Root>
    </div>
  );
}
