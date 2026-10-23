import { RouteSectionView } from '@/components/layout/RouteSectionView';

export default function ModelsRegistryPage() {
  return (
    <RouteSectionView
      phaseNumber={4}
      phaseSummary="Comprehensive TanStack Table registry of all 14 deployed LLM and classical ML models with multi-column sorting, faceted filters, column visibility, density toggle, and bulk comparison selection."
      upcomingHighlights={[
        'Multi-filter by Health Status (Healthy, Degraded, Critical), Model Type (LLM, Classification, Ranking, Embedding), and Team',
        'Column visibility toggle, row density switcher (Compact / Comfortable / Spacious), and sticky columns',
        'Row selection checkboxes to launch side-by-side Model Comparison for 2–4 models',
        'Direct drill-down into deep-linkable Model Detail tabs (/models/:modelId)',
      ]}
    />
  );
}
