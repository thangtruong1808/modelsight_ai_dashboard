import { RouteSectionView } from '@/components/layout/RouteSectionView';

export default function ModelDetailPage() {
  return (
    <RouteSectionView
      phaseNumber={4}
      phaseSummary="Deep-linkable model observability drill-down featuring Overview, Metrics, Versions, Data Drift, and Incidents tabs synced to the URL."
      upcomingHighlights={[
        '5 URL-synced tabs (?tab=overview|metrics|versions|drift|incidents)',
        'Model-specific latency percentiles, token throughput, and LLM evaluation scores (Groundedness, Toxicity, Relevance)',
        'Canary vs Production version deployment history and configuration diff viewer',
        'Model-scoped feature drift heatmap and incident history',
      ]}
    />
  );
}
