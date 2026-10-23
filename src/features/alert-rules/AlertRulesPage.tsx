import { RouteSectionView } from '@/components/layout/RouteSectionView';

export default function AlertRulesPage() {
  return (
    <RouteSectionView
      phaseNumber={5}
      phaseSummary="Schema-validated Alert Rules Builder (react-hook-form + zod) paired with a live historical backtesting chart showing exact firing windows."
      upcomingHighlights={[
        'Validated form for Metric, Condition, Threshold, Evaluation Window, Severity, and Notification Channel',
        'Live ECharts preview chart with threshold markLine and shaded firing zones over the past 7 days',
        'Instant calculation of how many times the candidate rule would have triggered historically',
        'Enable, mute, duplicate, or delete existing alert rules',
      ]}
    />
  );
}
