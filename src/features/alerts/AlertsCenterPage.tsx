import { RouteSectionView } from '@/components/layout/RouteSectionView';

export default function AlertsCenterPage() {
  return (
    <RouteSectionView
      phaseNumber={5}
      phaseSummary="Operational incident triage center with severity/status filtering, automated root-cause snapshots, incident timelines, and optimistic Acknowledge/Resolve actions."
      upcomingHighlights={[
        'Filter incidents by Severity (Critical, Warning, Info) and Status (Active, Acknowledged, Resolved)',
        'Interactive Incident Timeline drawer showing trigger snapshot, diagnostics, and operator notes',
        'Optimistic Acknowledge and Resolve mutations via RTK Query with rollback on simulated error',
        'Direct link to the Alert Rules Builder to tune thresholds',
      ]}
    />
  );
}

