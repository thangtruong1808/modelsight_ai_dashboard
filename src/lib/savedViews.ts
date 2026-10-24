export interface SavedView {
  id: string;
  name: string;
  description: string;
  path: string;
  searchParams: string;
  createdAt: string;
  isPinned: boolean;
}

const STORAGE_KEY = 'modelsight_saved_views';

const DEFAULT_SAVED_VIEWS: SavedView[] = [
  {
    id: 'view-prod-llms',
    name: 'Prod LLMs Tail Latency Watch',
    description: 'Production orchestrators, support agents, and RAG pipelines SLA tracking',
    path: '/models',
    searchParams: '?env=production',
    createdAt: new Date('2026-10-20T10:00:00Z').toISOString(),
    isPinned: true,
  },
  {
    id: 'view-finops-q4',
    name: 'Q4 Enterprise FinOps Audit',
    description: 'Full-month compute spend burn-up and model routing recommendations',
    path: '/cost',
    searchParams: '?range=30d',
    createdAt: new Date('2026-10-21T14:30:00Z').toISOString(),
    isPinned: true,
  },
  {
    id: 'view-critical-incidents',
    name: 'Critical SLA Breaches Triage',
    description: 'Active tail-latency breaches and unacknowledged alerts',
    path: '/alerts',
    searchParams: '?status=active',
    createdAt: new Date('2026-10-22T08:15:00Z').toISOString(),
    isPinned: false,
  },
  {
    id: 'view-rate-limits',
    name: 'HTTP 429 & 504 Gateway Explorer',
    description: 'Virtualized log stream filtered for upstream rate limits and timeouts',
    path: '/logs',
    searchParams: '?status=429',
    createdAt: new Date('2026-10-23T11:45:00Z').toISOString(),
    isPinned: false,
  },
];

export function getSavedViews(): SavedView[] {
  if (typeof window === 'undefined') return DEFAULT_SAVED_VIEWS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_SAVED_VIEWS));
      return DEFAULT_SAVED_VIEWS;
    }
    return JSON.parse(raw) as SavedView[];
  } catch {
    return DEFAULT_SAVED_VIEWS;
  }
}

export function saveView(view: Omit<SavedView, 'id' | 'createdAt'>): SavedView {
  const current = getSavedViews();
  const newView: SavedView = {
    ...view,
    id: `view-${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  const updated = [newView, ...current];
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // Ignore storage quota
  }
  return newView;
}

export function deleteSavedView(id: string): void {
  const current = getSavedViews();
  const updated = current.filter((v) => v.id !== id);
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // Ignore
  }
}

export function togglePinSavedView(id: string): void {
  const current = getSavedViews();
  const updated = current.map((v) => (v.id === id ? { ...v, isPinned: !v.isPinned } : v));
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // Ignore
  }
}
