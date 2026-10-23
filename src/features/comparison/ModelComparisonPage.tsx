import { RouteSectionView } from '@/components/layout/RouteSectionView';

export default function ModelComparisonPage() {
  return (
    <RouteSectionView
      phaseNumber={7}
      phaseSummary="Side-by-side benchmark comparison of 2 to 4 models or versions with synchronized overlay charts, normalized radar profile, and best/worst cell highlighting."
      upcomingHighlights={[
        'Select any 2–4 models (synced to URL ?models=...) for head-to-head evaluation',
        'Synchronized multi-series overlay charts for p95 Latency, Error Rate, Throughput, and Quality Score',
        'Normalized 5-axis Radar chart (Speed, Accuracy, Cost Efficiency, Stability, Low Drift)',
        'Comparison matrix table with automatic Best (emerald) and Worst (rose) metric highlighting',
      ]}
    />
  );
}

