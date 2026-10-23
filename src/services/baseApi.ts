import { createApi, type BaseQueryFn } from '@reduxjs/toolkit/query/react';
import { buildOverviewDashboardPayload, getSeedDatabase } from '@/data/seed';
import type {
  GlobalFilterState,
  IncidentEntity,
  ModelEntity,
  OverviewDashboardPayload,
} from '@/types';

export interface MockApiError {
  status: number;
  message: string;
  endpoint: string;
}

interface MockRequestArgs {
  url: 'overview' | 'models' | 'incidents';
  params?: GlobalFilterState;
}

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
    case 'incidents':
      return { data: db.incidents };
    default:
      return {
        error: {
          status: 404,
          message: 'Unknown mock endpoint',
          endpoint: args.url,
        },
      };
  }
};

export const baseApi = createApi({
  reducerPath: 'modelsightApi',
  baseQuery: mockBaseQuery,
  tagTypes: ['Overview', 'Models', 'Incidents'],
  endpoints: (builder) => ({
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
    getIncidentsList: builder.query<IncidentEntity[], void>({
      query: () => ({ url: 'incidents' }),
      providesTags: ['Incidents'],
    }),
  }),
});

export const { useGetOverviewDashboardQuery, useGetModelsListQuery, useGetIncidentsListQuery } =
  baseApi;
