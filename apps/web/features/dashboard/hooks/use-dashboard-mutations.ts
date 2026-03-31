'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { QueryClient } from '@tanstack/react-query';

import { useToast } from '@/components/providers/toast-provider';
import { useApiClient } from '@/hooks/use-api-client';
import { getErrorMessage } from '@/lib/api';
import { dashboardQueryKeys } from '@/features/dashboard/lib/query-keys';
import type { FacebookAccount, PostRecord } from '@/features/dashboard/types';

async function invalidateDashboardQueries(queryClient: QueryClient) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: dashboardQueryKeys.session }),
    queryClient.invalidateQueries({ queryKey: dashboardQueryKeys.billing }),
    queryClient.invalidateQueries({ queryKey: dashboardQueryKeys.accounts }),
    queryClient.invalidateQueries({ queryKey: dashboardQueryKeys.connectUrl }),
    queryClient.invalidateQueries({ queryKey: dashboardQueryKeys.posts }),
    queryClient.invalidateQueries({
      queryKey: dashboardQueryKeys.analyticsOverview
    }),
    queryClient.invalidateQueries({
      queryKey: dashboardQueryKeys.analyticsPosts
    })
  ]);
}

export function useCheckoutMutation() {
  const { request } = useApiClient();
  const toast = useToast();

  return useMutation({
    mutationFn: async () =>
      await request<{ checkoutUrl: string; sessionId: string }>(
        '/billing/checkout',
        {
          method: 'POST',
          body: {
            successUrl: `${window.location.origin}/dashboard/billing?checkout=success`,
            cancelUrl: `${window.location.origin}/dashboard/billing?checkout=cancel`
          }
        }
      ),
    onSuccess: result => {
      toast.info(
        'Redirecting to checkout',
        'Finish the Stripe flow to upgrade this workspace.'
      );
      window.location.assign(result.checkoutUrl);
    },
    onError: error => {
      toast.error(
        'Unable to start checkout',
        getErrorMessage(error, 'The billing checkout session could not start.')
      );
    }
  });
}

export function useFacebookCallbackMutation() {
  const queryClient = useQueryClient();
  const { request } = useApiClient();
  const toast = useToast();

  return useMutation({
    mutationFn: async (input: { code: string; pageId?: string }) =>
      await request<FacebookAccount>('/facebook/callback', {
        method: 'POST',
        body: input
      }),
    onSuccess: async () => {
      await invalidateDashboardQueries(queryClient);
      toast.success(
        'Facebook page connected',
        'The page is now ready for publishing and scheduling.'
      );
    },
    onError: error => {
      toast.error(
        'Unable to connect page',
        getErrorMessage(error, 'Facebook connection failed.')
      );
    }
  });
}

export function useSavePostMutation(postId?: string | null) {
  const queryClient = useQueryClient();
  const { request } = useApiClient();
  const toast = useToast();

  return useMutation({
    mutationFn: async (values: {
      title?: string;
      content: string;
      mediaUrl?: string;
      facebookAccountId?: string;
    }) => {
      if (postId) {
        return await request<PostRecord>(`/posts/${postId}`, {
          method: 'PUT',
          body: values
        });
      }

      return await request<PostRecord>('/posts', {
        method: 'POST',
        body: values
      });
    },
    onSuccess: async () => {
      await invalidateDashboardQueries(queryClient);
      toast.success(
        postId ? 'Post updated' : 'Draft created',
        postId
          ? 'Your changes are now saved in the content queue.'
          : 'The new draft is ready for scheduling or publishing.'
      );
    },
    onError: error => {
      toast.error(
        'Unable to save post',
        getErrorMessage(error, 'The post could not be saved.')
      );
    }
  });
}

export function usePublishPostMutation() {
  const queryClient = useQueryClient();
  const { request } = useApiClient();
  const toast = useToast();

  return useMutation({
    mutationFn: async (postId: string) =>
      await request<PostRecord>(`/posts/${postId}/publish`, {
        method: 'POST'
      }),
    onSuccess: async () => {
      await invalidateDashboardQueries(queryClient);
      toast.success(
        'Post published',
        'The publish request completed successfully.'
      );
    },
    onError: error => {
      toast.error(
        'Unable to publish post',
        getErrorMessage(error, 'The post could not be published.')
      );
    }
  });
}

export function useDeletePostMutation() {
  const queryClient = useQueryClient();
  const { request } = useApiClient();
  const toast = useToast();

  return useMutation({
    mutationFn: async (postId: string) =>
      await request<void>(`/posts/${postId}`, {
        method: 'DELETE'
      }),
    onSuccess: async () => {
      await invalidateDashboardQueries(queryClient);
      toast.success('Post deleted', 'The post was removed from the workspace.');
    },
    onError: error => {
      toast.error(
        'Unable to delete post',
        getErrorMessage(error, 'The post could not be deleted.')
      );
    }
  });
}

export function useSchedulePostMutation() {
  const queryClient = useQueryClient();
  const { request } = useApiClient();
  const toast = useToast();

  return useMutation({
    mutationFn: async (input: { postId: string; scheduledAt: string }) =>
      await request<PostRecord>(`/posts/${input.postId}/schedule`, {
        method: 'POST',
        body: {
          scheduledAt: new Date(input.scheduledAt).toISOString()
        }
      }),
    onSuccess: async () => {
      await invalidateDashboardQueries(queryClient);
      toast.success(
        'Schedule saved',
        'The post timing is now updated in the publishing queue.'
      );
    },
    onError: error => {
      toast.error(
        'Unable to schedule post',
        getErrorMessage(error, 'The schedule could not be updated.')
      );
    }
  });
}
