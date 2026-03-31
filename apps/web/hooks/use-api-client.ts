'use client';

import { useAuth } from '@clerk/nextjs';

import { apiRequest } from '@/lib/api';

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  signal?: AbortSignal;
};

export function useApiClient() {
  const { getToken, isLoaded, isSignedIn, sessionId } = useAuth();

  async function request<T>(
    path: string,
    options?: RequestOptions
  ): Promise<T> {
    const token = await getToken();

    return await apiRequest<T>(path, {
      method: options?.method,
      body: options?.body,
      signal: options?.signal,
      token
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
