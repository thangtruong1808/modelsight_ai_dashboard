import { RouteSectionView } from '@/components/layout/RouteSectionView';

export default function OverviewPage() {
  return (
    <RouteSectionView
      phaseNumber={2}
      phaseSummary="Executive & engineering command center with animated KPI cards, sparklines, period-over-period deltas, multi-metric performance time-series, and tail-latency/error analytics."
      upcomingHighlights={[
        '6 KPI summary cards with animated tabular counters, sparklines, and previous-period delta badges (Phase 2)',
        'Interactive Performance Time-Series (Throughput, Accuracy, Token Velocity) with brush/zoom & anomaly markers (Phase 3)',
        'Percentile Latency bands (p50 / p95 / p99) and Error Breakdown by failure taxonomy (Phase 3)',
        'URL-synchronized Global Filter Bar (Environment, Time Range, Compare Period, Team, Model) (Phase 3)',
      ]}
    />
  );
}

