'use client';

import { useAuth } from '@clerk/nextjs';
import { useUser } from '@clerk/nextjs';

import { apiRequest } from '@/lib/api';

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  signal?: AbortSignal;
};

export function useApiClient() {
  const { getToken, isLoaded, isSignedIn, sessionId } = useAuth();
  const { user } = useUser();

  async function request<T>(
    path: string,
    options?: RequestOptions
  ): Promise<T> {
    const token = await getToken({ skipCache: true });
    const profileHint =
      user?.id && user.primaryEmailAddress?.emailAddress
        ? {
            clerkUserId: user.id,
            email: user.primaryEmailAddress.emailAddress,
            name: user.fullName ?? null
          }
        : undefined;

    return await apiRequest<T>(path, {
      method: options?.method,
      body: options?.body,
      signal: options?.signal,
      token,
      profileHint
    });
  }

  return {
    request,
    isLoaded,
    isSignedIn,
    sessionId,
    isReady: isLoaded && isSignedIn
  };
}
