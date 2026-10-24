# ModelSight AI — Enterprise AI Model Observability & SLA Monitoring Platform

[![TypeScript](https://img.shields.io/badge/TypeScript-Strict_Mode-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.2-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8.3-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4.3-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Redux Toolkit](https://img.shields.io/badge/Redux_Toolkit-RTK_Query-764ABC?logo=redux&logoColor=white)](https://redux-toolkit.js.org/)
[![Apache ECharts](https://img.shields.io/badge/Apache_ECharts-6.1-AA344D?logo=apacheecharts&logoColor=white)](https://echarts.apache.org/)
[![TanStack Table & Virtual](https://img.shields.io/badge/TanStack-Table_&_Virtual-FF4154?logo=tanstack&logoColor=white)](https://tanstack.com/)
[![Vitest](https://img.shields.io/badge/Vitest-40_Tests_Passing-6E9F18?logo=vitest&logoColor=white)](https://vitest.dev/)

> **A high-density frontend-only SaaS observability platform for monitoring the health, latency SLAs, feature drift, incidents, and unit economics of LLMs and ML models in production.**

---

## Executive Overview

Modern production LLMs and classic ML models fail silently: token generation latencies breach SLAs, embedding distributions drift over time, rate limits cause cascade failures, and compute costs escalate without visibility.

**ModelSight AI** is a technical frontend showcase engineered to demonstrate advanced UI/UX, complex data visualization, virtualized datasets, optimistic state management, accessibility (a11y), and responsive design.

### Key Showcase Highlights
- **100% Frontend-Only & Deterministic**: High-performance seeded data generation (14 realistic LLM/ML models, 30 days of hourly telemetry, 10,000+ virtualized request logs) with zero backend, database, or external service dependencies.
- **Top-Bar Chaos & Network Simulator**: An interactive control popover allowing evaluators to inject artificial latency (0ms to 2,500ms), adjust error failure rates (0% to 100%), or force 503 outages on demand to inspect skeletons, error boundaries, and optimistic rollbacks.
- **Sub-Second Live Telemetry Stream**: Simulated real-time stream ticking at 1.5s or 750ms with a rolling 60-tick ECharts window, Pause/Resume buffer controls, and an anomaly ticker with auto-scroll lock on hover.
- **Interactive Live Alert Rule Backtester**: Rule builder validated with Zod and React Hook Form featuring a live historical ECharts preview with dynamic threshold lines (`markLine`) and shaded firing zones (`markArea`).
- **High-Density 10,000-Row Virtualized Logs Explorer**: TanStack Virtual table rendering smooth 60fps scrolling with a ~20-node active DOM footprint, syntax-highlighted JSON viewer, and keyboard stepping (<kbd>↑</kbd>/<kbd>↓</kbd>).
- **Side-by-Side Model Benchmarking Matrix**: Head-to-head comparison of 2–4 models with synchronized multi-series overlay curves, a normalized 5-axis Radar profile, and automatic **Best (★ Emerald)** and **Worst (▼ Rose)** cell highlighting.

---

## Architectural Decisions & Tech Stack

| Domain | Technology | Justification |
| :--- | :--- | :--- |
| **Framework & Build** | **React 19 + TypeScript + Vite** | Strict mode TypeScript with zero `any` shortcuts, ES modules, fast HMR, and tree-shaking. |
| **Styling & Design System** | **Tailwind CSS v4** | Custom CSS semantic tokens (surfaces, borders, brand indigo/cyan, status emerald/amber/rose), tabular monospace numerals for financial/latency metrics, elevation scales. |
| **State & Mock API Layer** | **Redux Toolkit + RTK Query** | Built with a custom deterministic `mockBaseQuery` middleware intercepting all queries and mutations. Avoids Mock Service Worker (MSW) service-worker registration flakiness and provides instant runtime control via the Chaos Simulator. |
| **Data Visualizations** | **Apache ECharts 6.1.0** | Built via a custom strongly typed `<BaseEChart />` wrapper. Synchronizes palettes with light/dark theme shifts, handles `ResizeObserver`, provides PNG export, and includes an accessible underlying Data Table modal for screen readers. |
| **Large Data Virtualization** | **@tanstack/react-virtual 3.14** | Enables silky-smooth 60fps scrolling across 10,000+ request logs in a fixed-height container with instant debounced search and faceted filtering. |
| **Data Tables** | **@tanstack/react-table 8.21** | Pinned to stable v8 for multi-column sorting, faceted filters, column visibility toggles, row selection, density switching, and CSV exports. |
| **Form Validation** | **React Hook Form + Zod** | Strongly typed schema validation (`zod@4.6` + `react-hook-form@7.91`) for the Alert Rules Builder and Settings forms. |
| **UI Primitives & Modals** | **Radix UI + cmdk + Sonner** | Accessible dialogs, drawers, popovers, tooltips, and command palette (<kbd>⌘K</kbd>) with full focus trapping and keyboard navigation. |
| **Unit Testing** | **Vitest 5.0 + JSDOM** | 40 unit tests verifying calculations, aggregations, filter logic, radar normalization, and formatters. |

---

## Platform Features & Pages

```text
src/
├── app/
│   ├── layouts/                  # AppShell, Collapsible Sidebar, Topbar, GlobalFilterBar
│   ├── slices/                   # Redux slices: themeSlice (dark/light), uiSlice (chaos simulator, drawers)
│   ├── router.ts                 # React Router v8 data router with route-level code splitting
│   └── store.ts                  # Typed Redux store and hooks
├── components/
│   ├── charts/                   # BaseEChart wrapper, Sparkline, accessible table modal
│   ├── layout/                   # CommandPalette, NotificationsDrawer, ProductOnboardingTour, ShortcutsModal
│   └── ui/                       # Button, Badge, Card, Skeleton, Tooltip, FeedbackStates, AnimatedCounter
├── features/
│   ├── overview/                 # KPI Summary cards, Performance Time-Series, Latency & Error Analytics
│   ├── models/                   # TanStack Models Registry table with density toggle & multi-filter
│   ├── model-detail/             # Model deep-dive: Overview, Metrics, Versions, Drift, Incidents
│   ├── drift/                    # Features × Time Heatmap, Distribution Histogram, PSI Leaderboard
│   ├── alerts/                   # Alerts & Incidents Center, timeline drawer, optimistic acknowledge/resolve
│   ├── alert-rules/              # Alert Rules Builder with live historical firing preview chart
│   ├── logs/                     # Virtualized 10,000-row Logs Explorer, mini histogram, payload drawer
│   ├── live/                     # Real-time telemetry stream (1.5s tick), rolling ECharts, anomaly ticker
│   ├── cost/                     # FinOps spend breakdown, budget burn-up forecast, routing insights
│   ├── comparison/               # 2-4 model comparison, synchronized overlays, 5-axis radar, best/worst matrix
│   └── settings/                 # API & Chaos Simulator panel, Saved Views manager, workspace profile
├── lib/                          # comparisonEngine, alertEvaluator, exportUtils, savedViews, formatters, cn
├── data/                         # seed.ts (14 models, 30d telemetry), seedLogs.ts (10,000 inference logs)
└── types/                        # Strict domain TypeScript interfaces
```

### 1. Executive Overview & KPI Fleet (`/`)
- 6 primary metric cards: Total Inferences, Success Rate, p95 Tail Latency, Inference Error Rate, Token & Compute Spend, and Active Model Fleet.
- Tabular number animation powered by `motion/react` with period-over-period delta badges and themed sparklines.
- Performance time-series with Throughput (RPS), Accuracy, and Token Velocity switchers, previous-period overlay, and `dataZoom` brush slider.
- Latency percentile bands (`p50`, `p95`, `p99`) plotted against a 650ms SLA line alongside an error taxonomy donut chart.

### 2. Models Registry (`/models`)
- TanStack Table v8 implementation with multi-column sorting, debounced search, status/category faceted filters, column visibility selector, density switcher (`Compact`, `Comfortable`, `Spacious`), and row selection with bulk actions.
- CSV export and direct jump to Model Comparison for selected models.

### 3. Model Detail Drill-Down (`/models/:modelId`)
- Deep-linkable via URL (`?tab=overview|metrics|versions|drift|incidents`).
- Quality scorecards (Groundedness, Relevance, Coherence, Safety), dual-axis telemetry chart, and canary traffic split configuration (`10% Canary / 90% Prod`).

### 4. Data Drift Monitoring (`/drift`)
- **Features × Time Heatmap**: ECharts matrix visualizing PSI and KS drift scores across 12 features over 14 time buckets.
- **Interactive Drill-Down**: Clicking any feature row in the heatmap updates the adjacent Baseline vs. Production Distribution comparison chart in real time.
- Ranked drift score leaderboard with healthy/degraded/critical status thresholds.

### 5. Alerts & Incidents Center (`/alerts`)
- Incident cards with root-cause diagnostic metrics, severity badges, and status filtering (`Active`, `Acknowledged`, `Resolved`).
- Optimistic updates on `Acknowledge` and `Resolve` mutations with toast feedback and automatic rollback on simulated errors.
- Slide-over investigation drawer displaying an interactive lifecycle timeline and investigator notes log.

### 6. Alert Rules Builder (`/alerts/rules`)
- Schema-validated form (`react-hook-form` + `zod`) for SLA breach thresholds, drift detectors, and notification triggers.
- **Live Historical Backtest Preview**: Form inputs dynamically update an ECharts preview showing exact firing zones (`markArea`), horizontal threshold marker (`markLine`), and firing frequency over the past 14 days.
- Active rules management table with toggle (enable/mute) and delete actions.

### 7. Request Logs Explorer (`/logs`)
- Virtualized `@tanstack/react-virtual` table rendering 10,000+ inference logs with fixed row heights and sticky headers.
- 24-hour mini request volume and error spike histogram with hover tooltips.
- Faceted filtering: Status Code (`200`, `429`, `500`, `504`, `400`), Latency brackets (`<200ms`, `200-500ms`, `>1s`), and Target Model.
- Slide-over inspector drawer with prompt/response chat view, formatted raw JSON payloads, client SDK/country telemetry, and cURL command generator.
- One-click RFC-4180 CSV and JSON export.

### 8. Live Real-Time Telemetry Stream (`/live`)
- Sub-second simulated stream ticking at 1.5s (`1x`) or 750ms (`2x`) with Pause/Resume controls and buffer reset.
- Rolling 60-tick ECharts time series: Throughput RPS vs. Error bursts, Tail Latency Percentiles (p50/p95), and Token Generation Velocity.
- Live anomaly ticker feed with hover-to-pause auto-scroll lock.

### 9. Cost & Usage Analytics (`/cost`)
- Spend vs. Monthly Budget progress bar with projected month-end forecast and warning thresholds.
- Stacked bar charts breaking down daily spend by Engineering Team or Model.
- Automated FinOps routing recommendations (e.g., routing low-complexity FAQ queries from GPT-4o to Claude 3.5 Haiku saving \$4,280/mo).
- Unit economics leaderboard table ranking models by cost per 1k requests and prompt cache hit rate.

### 10. Side-by-Side Model Comparison (`/comparison`)
- URL-synced model picker (`?models=claude-3-7-sonnet-prod,gpt-4o-customer-support,llama-3-3-70b-rag`) comparing 2 to 4 models.
- Multi-series synchronized overlay charts and normalized 5-axis Radar chart profile (Speed, Accuracy, Cost Efficiency, Stability, Low Drift).
- Deep comparison matrix table with automatic **Best (★ Emerald)** and **Worst (▼ Rose)** cell highlighting across all performance and FinOps metrics.

### 11. Command Palette & Power-User Tools
- **Command Palette (<kbd>⌘K</kbd>)**: Fast fuzzy search powered by `cmdk` to jump to any page, inspect models, trigger CSV export, toggle network simulation, or switch themes.
- **Saved Views Manager**: Save custom filter configurations to `localStorage`, pin favorite views, and copy shareable deep links.
- **Notifications Center Drawer**: Slide-over panel accessible from the Topbar bell icon with categorized alert feeds and direct resource links.
- **Reviewer Onboarding Tour**: 5-step guided interactive walkthrough highlighting key engineering features for portfolio evaluators.
- **Keyboard Shortcuts (<kbd>?</kbd>)**: Cheatsheet modal listing global hotkeys (<kbd>⌘K</kbd>, <kbd>[</kbd>, <kbd>?</kbd>, <kbd>↑</kbd>/<kbd>↓</kbd>).

---

## Testing & Quality Verification

ModelSight AI includes an automated Vitest test suite with **40 unit tests** across 8 test suites:

```bash
# Run all automated tests
npm test

# Run ESLint check
npm run lint

# Run TypeScript build check & Vite production bundle
npm run build

# Format codebase with Prettier
npm run format
```

### Verified Test Suites
- `foundation.test.ts`: Number, latency, currency, and percentage formatters; theme and sidebar Redux state.
- `overview.test.ts`: Deterministic seeded database generation and overview dashboard aggregation.
- `chartsAndFilters.test.ts`: Global filter state transformations, URL parameter serialization, and date window math.
- `modelsAndDrift.test.ts`: Models registry multi-filtering, sorting, and drift feature matrix bounds.
- `alertsAndRules.test.ts`: Alert rule condition evaluation (`gt`, `lt`), metric extraction, and historical threshold crossings.
- `logsAndLive.test.ts`: 10,000 deterministic log generation schema, 24h histogram aggregation, and RFC-4180 CSV formatting.
- `costAndComparison.test.ts`: FinOps budget burn-rate projections, 5-axis radar normalization, and best/worst row evaluation.
- `settingsAndViews.test.ts`: Saved views localStorage persistence, pin toggling, and Chaos Simulator boundary clamping.

---

## Local Setup & Development

### Prerequisites
- Node.js `18.0.0` or higher
- npm `9.0.0` or higher

### Installation & Run

```bash
# 1. Clone the repository
git clone https://github.com/your-username/modelsight_ai_dashboard.git
cd modelsight_ai_dashboard

# 2. Install dependencies (verified stable versions)
npm install

# 3. Start local development server
npm run dev
```

Open `http://localhost:5173/` in your browser.

---

## Evaluator Cheatsheet & Interactive Tour

When reviewing this project as a technical evaluator or hiring manager:
1. **Take the 60-Second Guided Tour**: Click **"Start Reviewer Tour (60s)"** on the `/settings` page or via the Command Palette (<kbd>⌘K</kbd>).
2. **Test the Chaos Simulator**: Click the status pill in the Topbar (e.g., `220ms • 0% err`) or visit `/settings` to slide network latency to `1500ms` or error rate to `50%`. Notice how loading skeletons and retry error cards handle degraded network conditions gracefully.
3. **Inspect the Live Rule Backtester**: Visit `/alerts/rules` and adjust the Threshold slider to watch the historical chart highlight red firing zones in real time.
4. **Test High-Density Virtualization**: Visit `/logs` and scroll through 10,000 log records at 60fps; click any row to open the side inspector and use <kbd>↑</kbd> and <kbd>↓</kbd> to step through records.
5. **Evaluate Model Comparison**: Visit `/comparison`, select the *"Top 3 Enterprise LLMs"* preset, and observe the normalized 5-axis Radar chart and automatic Best/Worst matrix highlighting.

---

## License

MIT License. Engineered by Senior Frontend Engineer showcase. Original copy, fictional branding, and deterministic simulation data.

### Verified Test Suites
- `foundation.test.ts`: Number, latency, currency, and percentage formatters; theme and sidebar Redux state.
- `overview.test.ts`: Deterministic seeded database generation and overview dashboard aggregation.
- `chartsAndFilters.test.ts`: Global filter state transformations, URL parameter serialization, and date window math.
- `modelsAndDrift.test.ts`: Models registry multi-filtering, sorting, and drift feature matrix bounds.
- `alertsAndRules.test.ts`: Alert rule condition evaluation (`gt`, `lt`), metric extraction, and historical threshold crossings.
- `logsAndLive.test.ts`: 10,000 deterministic log generation schema, 24h histogram aggregation, and RFC-4180 CSV formatting.
- `costAndComparison.test.ts`: FinOps budget burn-rate projections, 5-axis radar normalization, and best/worst row evaluation.
- `settingsAndViews.test.ts`: Saved views localStorage persistence, pin toggling, and Chaos Simulator boundary clamping.

---

## Local Setup & Development

### Prerequisites
- Node.js `18.0.0` or higher
- npm `9.0.0` or higher

### Installation & Run

```bash
# 1. Clone the repository
git clone https://github.com/your-username/modelsight_ai_dashboard.git
cd modelsight_ai_dashboard

# 2. Install dependencies (verified stable versions)
npm install

# 3. Start local development server
npm run dev
```

Open `http://localhost:5173/` in your browser.

---

## Evaluator Cheatsheet & Interactive Tour

When reviewing this project as a technical evaluator or hiring manager:
1. **Take the 60-Second Guided Tour**: Click **"Start Reviewer Tour (60s)"** on the `/settings` page or via the Command Palette (<kbd>⌘K</kbd>).
2. **Test the Chaos Simulator**: Click the status pill in the Topbar (e.g., `220ms • 0% err`) or visit `/settings` to slide network latency to `1500ms` or error rate to `50%`. Notice how loading skeletons and retry error cards handle degraded network conditions gracefully.
3. **Inspect the Live Rule Backtester**: Visit `/alerts/rules` and adjust the Threshold slider to watch the historical chart highlight red firing zones in real time.
4. **Test High-Density Virtualization**: Visit `/logs` and scroll through 10,000 log records at 60fps; click any row to open the side inspector and use <kbd>↑</kbd> and <kbd>↓</kbd> to step through records.
5. **Evaluate Model Comparison**: Visit `/comparison`, select the *"Top 3 Enterprise LLMs"* preset, and observe the normalized 5-axis Radar chart and automatic Best/Worst matrix highlighting.

---

## License

MIT License. Engineered by Senior Frontend Engineer showcase. Original copy, fictional branding, and deterministic simulation data.

