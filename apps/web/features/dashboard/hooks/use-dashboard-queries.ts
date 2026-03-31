'use client';

import { useQuery } from '@tanstack/react-query';

import { useApiClient } from '@/hooks/use-api-client';
import { dashboardQueryKeys } from '@/features/dashboard/lib/query-keys';
import type {
  AnalyticsOverview,
  AnalyticsPost,
  BillingSummary,
  FacebookAccount,
  PostRecord,
  SessionRecord
} from '@/features/dashboard/types';

type QueryConfig = {
  enabled?: boolean;
};

function useApiQuery<T>(
  key: readonly string[],
  path: string,
  config?: QueryConfig
) {
  const { request, isReady } = useApiClient();

  return useQuery({
    queryKey: key,
    queryFn: async ({ signal }) =>
      await request<T>(path, {
        signal
      }),
    enabled: (config?.enabled ?? true) && isReady
  });
}

export function useDashboardSessionQuery(config?: QueryConfig) {
  return useApiQuery<SessionRecord>(
    dashboardQueryKeys.session,
    '/auth/session',
    config
  );
}

export function useDashboardBillingQuery(config?: QueryConfig) {
  return useApiQuery<BillingSummary>(
    dashboardQueryKeys.billing,
    '/billing/subscription',
    config
  );
}

export function useDashboardAccountsQuery(config?: QueryConfig) {
  return useApiQuery<FacebookAccount[]>(
    dashboardQueryKeys.accounts,
    '/facebook/accounts',
    config
  );
}

export function useDashboardConnectUrlQuery(config?: QueryConfig) {
  return useApiQuery<{ url: string }>(
    dashboardQueryKeys.connectUrl,
    '/facebook/connect-url',
    config
  );
}

export function useDashboardPostsQuery(config?: QueryConfig) {
  return useApiQuery<PostRecord[]>(dashboardQueryKeys.posts, '/posts', config);
}

export function useDashboardAnalyticsOverviewQuery(config?: QueryConfig) {
  return useApiQuery<AnalyticsOverview>(
    dashboardQueryKeys.analyticsOverview,
    '/analytics/overview',
    config
  );
}

export function useDashboardAnalyticsPostsQuery(config?: QueryConfig) {
  return useApiQuery<AnalyticsPost[]>(
    dashboardQueryKeys.analyticsPosts,
    '/analytics/posts',
    config
  );
}
