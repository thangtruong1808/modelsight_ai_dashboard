import { RouteSectionView } from '@/components/layout/RouteSectionView';

export default function DriftMonitoringPage() {
  return (
    <RouteSectionView
      phaseNumber={4}
      phaseSummary="Feature and embedding distribution shift detection using Population Stability Index (PSI) and Kolmogorov-Smirnov statistics."
      upcomingHighlights={[
        'Interactive ECharts Heatmap (Features × Time buckets) with cell click drill-down',
        'Baseline Training vs Live Production distribution comparison histogram/density chart',
        'Ranked feature drift leaderboard with severity thresholds (PSI > 0.25 critical)',
        'Embedding vector cosine-distance shift tracking for RAG & LLM pipelines',
      ]}
    />
  );
}

