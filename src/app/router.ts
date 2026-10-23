import { createElement, lazy } from 'react';
import { createBrowserRouter, Navigate } from 'react-router';
import { AppShell } from '@/app/layouts/AppShell';

const OverviewPage = lazy(() => import('@/features/overview/OverviewPage'));
const ModelsRegistryPage = lazy(() => import('@/features/models/ModelsRegistryPage'));
const ModelDetailPage = lazy(() => import('@/features/model-detail/ModelDetailPage'));
const DriftMonitoringPage = lazy(() => import('@/features/drift/DriftMonitoringPage'));
const ComparisonPage = lazy(() => import('@/features/comparison/ModelComparisonPage'));
const AlertsCenterPage = lazy(() => import('@/features/alerts/AlertsCenterPage'));
const AlertRulesPage = lazy(() => import('@/features/alert-rules/AlertRulesPage'));
const LogsExplorerPage = lazy(() => import('@/features/logs/LogsExplorerPage'));
const LiveMonitorPage = lazy(() => import('@/features/live/LiveMonitorPage'));
const CostAnalyticsPage = lazy(() => import('@/features/cost/CostAnalyticsPage'));
const SettingsPage = lazy(() => import('@/features/settings/SettingsPage'));

export const router = createBrowserRouter([
  {
    path: '/',
    element: createElement(AppShell),
    children: [
      {
        index: true,
        element: createElement(OverviewPage),
      },
      {
        path: 'models',
        element: createElement(ModelsRegistryPage),
      },
      {
        path: 'models/:modelId',
        element: createElement(ModelDetailPage),
      },
      {
        path: 'drift',
        element: createElement(DriftMonitoringPage),
      },
      {
        path: 'comparison',
        element: createElement(ComparisonPage),
      },
      {
        path: 'alerts',
        element: createElement(AlertsCenterPage),
      },
      {
        path: 'alerts/rules',
        element: createElement(AlertRulesPage),
      },
      {
        path: 'logs',
        element: createElement(LogsExplorerPage),
      },
      {
        path: 'live',
        element: createElement(LiveMonitorPage),
      },
      {
        path: 'cost',
        element: createElement(CostAnalyticsPage),
      },
      {
        path: 'settings',
        element: createElement(SettingsPage),
      },
      {
        path: '*',
        element: createElement(Navigate, { to: '/', replace: true }),
      },
    ],
  },
]);
