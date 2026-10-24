import { createApi, type BaseQueryFn } from '@reduxjs/toolkit/query/react';
import { buildOverviewDashboardPayload, getSeedDatabase } from '@/data/seed';
import { getDeterministicLogs } from '@/data/seedLogs';
import type {
  AlertRuleEntity,
  DriftFeatureMetric,
  GlobalFilterState,
  IncidentEntity,
  LogEntry,
  ModelEntity,
  OverviewDashboardPayload,
} from '@/types';

export interface MockApiError {
  status: number;
  message: string;
  endpoint: string;
}

type MockRequestArgs =
  | { url: 'overview'; params?: GlobalFilterState; method?: 'GET' }
  | { url: 'models'; params?: undefined; method?: 'GET' }
  | { url: 'model-detail'; params: { modelId: string }; method?: 'GET' }
  | { url: 'drift'; params?: undefined; method?: 'GET' }
  | { url: 'incidents'; params?: undefined; method?: 'GET' }
  | { url: 'incident-ack'; method: 'POST'; body: { incidentId: string } }
  | { url: 'incident-resolve'; method: 'POST'; body: { incidentId: string } }
  | { url: 'incident-note'; method: 'POST'; body: { incidentId: string; note: string } }
  | { url: 'alert-rules'; params?: undefined; method?: 'GET' }
  | { url: 'alert-rule-create'; method: 'POST'; body: Omit<AlertRuleEntity, 'id'> }
  | { url: 'alert-rule-toggle'; method: 'POST'; body: { ruleId: string; enabled: boolean } }
  | { url: 'alert-rule-delete'; method: 'POST'; body: { ruleId: string } }
  | { url: 'logs'; params?: undefined; method?: 'GET' };

interface StoreSimulatorRoot {
  ui: {
    simulator: {
      latencyMs: number;
      errorRatePercent: number;
      forceOfflineError: boolean;
    };
  };
}

const mockBaseQuery: BaseQueryFn<MockRequestArgs, unknown, MockApiError> = async (args, api) => {
  const state = api.getState() as StoreSimulatorRoot;
  const { latencyMs, errorRatePercent, forceOfflineError } = state.ui.simulator;

  // Simulate realistic network delay configured in the Chaos Simulator
  if (latencyMs > 0) {
    await new Promise((resolve) => setTimeout(resolve, latencyMs));
  }

  // Check forced outage or probabilistic error injection
  if (forceOfflineError) {
    return {
      error: {
        status: 503,
        message:
          'Simulated 503 Service Unavailable: Force API Outage is active in the Chaos Simulator.',
        endpoint: args.url,
      },
    };
  }

  if (errorRatePercent > 0 && Math.random() * 100 < errorRatePercent) {
    return {
      error: {
        status: 500,
        message: `Simulated 500 Telemetry Timeout (${errorRatePercent}% failure injection rate triggered).`,
        endpoint: args.url,
      },
    };
  }

  const db = getSeedDatabase();

  switch (args.url) {
    case 'overview': {
      const defaultFilters: GlobalFilterState = args.params ?? {
        environment: 'production',
        timeRange: '7d',
        compareToPrevious: true,
        team: 'all',
        modelId: 'all',
      };
      return { data: buildOverviewDashboardPayload(defaultFilters) };
    }
    case 'models':
      return { data: db.models };
    case 'model-detail': {
      const modelId = args.params.modelId;
      const model = db.models.find((m) => m.id === modelId) ?? db.models[0]!;
      return { data: model };
    }
    case 'drift':
      return { data: db.driftFeatures };
    case 'incidents':
      return { data: db.incidents };
    case 'incident-ack': {
      const incident = db.incidents.find((i) => i.id === args.body.incidentId);
      if (incident) {
        incident.status = 'acknowledged';
        incident.acknowledgedAt = new Date().toISOString();
        incident.timeline.push({
          id: `ev-${Date.now()}`,
          timestamp: new Date().toISOString(),
          actor: 'Alex Chen (Staff ML Platform Lead)',
          type: 'acknowledged',
          message: 'Incident acknowledged by on-call engineer.',
        });
      }
      return { data: incident };
    }
    case 'incident-resolve': {
      const incident = db.incidents.find((i) => i.id === args.body.incidentId);
      if (incident) {
        incident.status = 'resolved';
        incident.resolvedAt = new Date().toISOString();
        incident.timeline.push({
          id: `ev-${Date.now()}`,
          timestamp: new Date().toISOString(),
          actor: 'Alex Chen (Staff ML Platform Lead)',
          type: 'resolved',
          message: 'Incident marked as resolved after traffic re-route verified.',
        });
      }
      return { data: incident };
    }
    case 'incident-note': {
      const incident = db.incidents.find((i) => i.id === args.body.incidentId);
      if (incident) {
        incident.timeline.push({
          id: `ev-${Date.now()}`,
          timestamp: new Date().toISOString(),
          actor: 'Alex Chen (Staff ML Platform Lead)',
          type: 'note',
          message: args.body.note,
        });
      }
      return { data: incident };
    }
    case 'alert-rules':
      return { data: db.alertRules };
    case 'alert-rule-create': {
      const newRule: AlertRuleEntity = {
        ...args.body,
        id: `rule-${Date.now()}`,
      };
      db.alertRules.unshift(newRule);
      return { data: newRule };
    }
    case 'alert-rule-toggle': {
      const rule = db.alertRules.find((r) => r.id === args.body.ruleId);
      if (rule) {
        rule.enabled = args.body.enabled;
      }
      return { data: rule };
    }
    case 'alert-rule-delete': {
      const idx = db.alertRules.findIndex((r) => r.id === args.body.ruleId);
      if (idx !== -1) {
        db.alertRules.splice(idx, 1);
      }
      return { data: { success: true, ruleId: args.body.ruleId } };
    }
    case 'logs':
      return { data: getDeterministicLogs(10000) };
    default:
      return {
        error: {
          status: 404,
          message: 'Unknown mock endpoint',
          endpoint: (args as { url?: string }).url ?? 'unknown',
        },
      };
  }
};

export const baseApi = createApi({
  reducerPath: 'modelsightApi',
  baseQuery: mockBaseQuery,
  tagTypes: ['Overview', 'Models', 'Drift', 'Incidents', 'AlertRules', 'Logs'],
  endpoints: (builder) => ({
    getLogs: builder.query<LogEntry[], void>({
      query: () => ({ url: 'logs' }),
      providesTags: ['Logs'],
    }),
    getOverviewDashboard: builder.query<OverviewDashboardPayload, GlobalFilterState>({
      query: (filters) => ({
        url: 'overview',
        params: filters,
      }),
      providesTags: ['Overview'],
    }),
    getModelsList: builder.query<ModelEntity[], void>({
      query: () => ({ url: 'models' }),
      providesTags: ['Models'],
    }),
    getModelDetail: builder.query<ModelEntity, string>({
      query: (modelId) => ({
        url: 'model-detail',
        params: { modelId },
      }),
      providesTags: (_result, _error, id) => [{ type: 'Models', id }],
    }),
    getDriftFeatures: builder.query<DriftFeatureMetric[], void>({
      query: () => ({ url: 'drift' }),
      providesTags: ['Drift'],
    }),
    getIncidentsList: builder.query<IncidentEntity[], void>({
      query: () => ({ url: 'incidents' }),
      providesTags: ['Incidents'],
    }),
    acknowledgeIncident: builder.mutation<IncidentEntity, { incidentId: string }>({
      query: ({ incidentId }) => ({
        url: 'incident-ack',
        method: 'POST',
        body: { incidentId },
      }),
      async onQueryStarted({ incidentId }, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          baseApi.util.updateQueryData('getIncidentsList', undefined, (draft) => {
            const inc = draft.find((i) => i.id === incidentId);
            if (inc) {
              inc.status = 'acknowledged';
              inc.acknowledgedAt = new Date().toISOString();
              inc.timeline.push({
                id: `ev-${Date.now()}`,
                timestamp: new Date().toISOString(),
                actor: 'Alex Chen (Staff ML Platform Lead)',
                type: 'acknowledged',
                message: 'Incident acknowledged by on-call engineer.',
              });
            }
          })
        );
        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
      invalidatesTags: ['Incidents', 'Overview'],
    }),
    resolveIncident: builder.mutation<IncidentEntity, { incidentId: string }>({
      query: ({ incidentId }) => ({
        url: 'incident-resolve',
        method: 'POST',
        body: { incidentId },
      }),
      async onQueryStarted({ incidentId }, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          baseApi.util.updateQueryData('getIncidentsList', undefined, (draft) => {
            const inc = draft.find((i) => i.id === incidentId);
            if (inc) {
              inc.status = 'resolved';
              inc.resolvedAt = new Date().toISOString();
              inc.timeline.push({
                id: `ev-${Date.now()}`,
                timestamp: new Date().toISOString(),
                actor: 'Alex Chen (Staff ML Platform Lead)',
                type: 'resolved',
                message: 'Incident marked as resolved after traffic re-route verified.',
              });
            }
          })
        );
        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
      invalidatesTags: ['Incidents', 'Overview'],
    }),
    addIncidentNote: builder.mutation<IncidentEntity, { incidentId: string; note: string }>({
      query: ({ incidentId, note }) => ({
        url: 'incident-note',
        method: 'POST',
        body: { incidentId, note },
      }),
      async onQueryStarted({ incidentId, note }, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          baseApi.util.updateQueryData('getIncidentsList', undefined, (draft) => {
            const inc = draft.find((i) => i.id === incidentId);
            if (inc) {
              inc.timeline.push({
                id: `ev-${Date.now()}`,
                timestamp: new Date().toISOString(),
                actor: 'Alex Chen (Staff ML Platform Lead)',
                type: 'note',
                message: note,
              });
            }
          })
        );
        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
      invalidatesTags: ['Incidents'],
    }),
    getAlertRules: builder.query<AlertRuleEntity[], void>({
      query: () => ({ url: 'alert-rules' }),
      providesTags: ['AlertRules'],
    }),
    createAlertRule: builder.mutation<AlertRuleEntity, Omit<AlertRuleEntity, 'id'>>({
      query: (rule) => ({
        url: 'alert-rule-create',
        method: 'POST',
        body: rule,
      }),
      invalidatesTags: ['AlertRules'],
    }),
    toggleAlertRule: builder.mutation<AlertRuleEntity, { ruleId: string; enabled: boolean }>({
      query: ({ ruleId, enabled }) => ({
        url: 'alert-rule-toggle',
        method: 'POST',
        body: { ruleId, enabled },
      }),
      async onQueryStarted({ ruleId, enabled }, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          baseApi.util.updateQueryData('getAlertRules', undefined, (draft) => {
            const rule = draft.find((r) => r.id === ruleId);
            if (rule) {
              rule.enabled = enabled;
            }
          })
        );
        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
      invalidatesTags: ['AlertRules'],
    }),
    deleteAlertRule: builder.mutation<{ success: boolean; ruleId: string }, { ruleId: string }>({
      query: ({ ruleId }) => ({
        url: 'alert-rule-delete',
        method: 'POST',
        body: { ruleId },
      }),
      invalidatesTags: ['AlertRules'],
    }),
  }),
});

export const {
  useGetOverviewDashboardQuery,
  useGetModelsListQuery,
  useGetModelDetailQuery,
  useGetDriftFeaturesQuery,
  useGetIncidentsListQuery,
  useAcknowledgeIncidentMutation,
  useResolveIncidentMutation,
  useAddIncidentNoteMutation,
  useGetAlertRulesQuery,
  useCreateAlertRuleMutation,
  useToggleAlertRuleMutation,
  useDeleteAlertRuleMutation,
  useGetLogsQuery,
} = baseApi;
