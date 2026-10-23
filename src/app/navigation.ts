import {
  Activity,
  BarChart3,
  BellRing,
  Boxes,
  DollarSign,
  GitCompareArrows,
  LayoutDashboard,
  Radio,
  ScrollText,
  Settings,
  ShieldAlert,
  type LucideIcon,
} from 'lucide-react';

export interface NavItemConfig {
  id: string;
  label: string;
  path: string;
  icon: LucideIcon;
  section: 'Observability' | 'Operations' | 'Governance';
  badge?: {
    text: string;
    variant: 'healthy' | 'warning' | 'critical' | 'info' | 'indigo' | 'default';
  };
  shortcut?: string;
}

export const NAV_ITEMS: NavItemConfig[] = [
  {
    id: 'overview',
    label: 'Overview',
    path: '/',
    icon: LayoutDashboard,
    section: 'Observability',
    shortcut: 'G O',
  },
  {
    id: 'models',
    label: 'Models Registry',
    path: '/models',
    icon: Boxes,
    section: 'Observability',
    badge: { text: '14', variant: 'default' },
    shortcut: 'G M',
  },
  {
    id: 'drift',
    label: 'Data Drift',
    path: '/drift',
    icon: Activity,
    section: 'Observability',
    badge: { text: '2 high', variant: 'warning' },
    shortcut: 'G D',
  },
  {
    id: 'comparison',
    label: 'Model Comparison',
    path: '/comparison',
    icon: GitCompareArrows,
    section: 'Observability',
    shortcut: 'G C',
  },
  {
    id: 'alerts',
    label: 'Alerts & Incidents',
    path: '/alerts',
    icon: ShieldAlert,
    section: 'Operations',
    badge: { text: '3 active', variant: 'critical' },
    shortcut: 'G A',
  },
  {
    id: 'alert-rules',
    label: 'Alert Rules',
    path: '/alerts/rules',
    icon: BellRing,
    section: 'Operations',
    shortcut: 'G R',
  },
  {
    id: 'logs',
    label: 'Logs Explorer',
    path: '/logs',
    icon: ScrollText,
    section: 'Operations',
    badge: { text: '10k+', variant: 'info' },
    shortcut: 'G L',
  },
  {
    id: 'live',
    label: 'Live Monitor',
    path: '/live',
    icon: Radio,
    section: 'Operations',
    badge: { text: 'LIVE', variant: 'healthy' },
    shortcut: 'G V',
  },
  {
    id: 'cost',
    label: 'Cost & Token FinOps',
    path: '/cost',
    icon: DollarSign,
    section: 'Governance',
    shortcut: 'G F',
  },
  {
    id: 'settings',
    label: 'Settings & Simulator',
    path: '/settings',
    icon: Settings,
    section: 'Governance',
    shortcut: 'G S',
  },
];

export const ROUTE_TITLES: Record<string, { title: string; subtitle: string; section: string }> = {
  '/': {
    title: 'Production Intelligence Overview',
    subtitle:
      'Real-time health, latency, throughput, and quality telemetry across 14 deployed models',
    section: 'Observability',
  },
  '/models': {
    title: 'Models Registry',
    subtitle: 'Manage production LLMs, ranking pipelines, embeddings, and classical ML endpoints',
    section: 'Observability',
  },
  '/drift': {
    title: 'Data & Embedding Drift Monitoring',
    subtitle: 'Population Stability Index (PSI) and Kolmogorov-Smirnov feature distribution shifts',
    section: 'Observability',
  },
  '/comparison': {
    title: 'Model & Version Comparison',
    subtitle: 'Side-by-side benchmark matrix and latency/accuracy overlay across 2–4 models',
    section: 'Observability',
  },
  '/alerts': {
    title: 'Alerts & Incidents Center',
    subtitle:
      'Triage SLA breaches, drift anomalies, and guardrail violations with incident timelines',
    section: 'Operations',
  },
  '/alerts/rules': {
    title: 'Alert Rules Builder',
    subtitle: 'Configure threshold detectors with live historical backtesting preview',
    section: 'Operations',
  },
  '/logs': {
    title: 'Request Logs Explorer',
    subtitle:
      'High-speed virtualized inspection of inference traces, prompts, completions, and token payloads',
    section: 'Operations',
  },
  '/live': {
    title: 'Live Streaming Telemetry',
    subtitle: 'Sub-second rolling throughput, tail latency, and real-time anomaly event feed',
    section: 'Operations',
  },
  '/cost': {
    title: 'Cost & Usage Analytics',
    subtitle:
      'Token consumption, team attribution, monthly budget burn-up forecast, and routing optimizations',
    section: 'Governance',
  },
  '/settings': {
    title: 'Workspace Settings & Chaos Simulator',
    subtitle:
      'Configure preferences, saved views, and inject network latency or errors to test UI resilience',
    section: 'Governance',
  },
};

export { BarChart3 };
