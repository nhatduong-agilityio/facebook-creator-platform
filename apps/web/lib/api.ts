import { publicEnv } from '@/lib/env';

export const API_BASE_URL = publicEnv.apiBaseUrl;

type ApiEnvelope<T> = {
  success: boolean;
  data: T;
};

type ApiErrorPayload = {
  message?: string;
  code?: string;
  statusCode?: number;
};

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly code?: string,
    public readonly payload?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function getErrorMessage(
  error: unknown,
  fallback = 'Something went wrong.'
) {
  if (error instanceof ApiError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}

export async function apiRequest<T>(
  path: string,
  options: {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
    token?: string | null;
    profileHint?: {
      clerkUserId: string;
      email: string | null;
      name: string | null;
    };
    body?: unknown;
    signal?: AbortSignal;
  } = {}
): Promise<T> {
  const headers = new Headers();
  const method = options.method ?? 'GET';
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  if (options.token) {
    headers.set('Authorization', `Bearer ${options.token}`);
  }

  if (options.profileHint?.clerkUserId) {
    headers.set('X-Clerk-User-Id', options.profileHint.clerkUserId);
  }

  if (options.profileHint?.email) {
    headers.set('X-Clerk-User-Email', options.profileHint.email);
  }

  if (options.profileHint?.name) {
    headers.set('X-Clerk-User-Name', options.profileHint.name);
  }

  if (options.body !== undefined) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_BASE_URL}${normalizedPath}`, {
    method,
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    signal: options.signal,
    credentials: 'omit'
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const contentType = response.headers.get('content-type') ?? '';
  const payload: unknown = contentType.includes('application/json')
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const apiError = isApiErrorPayload(payload)
      ? payload
      : { message: 'Request failed' };

    throw new ApiError(
      apiError.message ?? 'Request failed',
      response.status,
      apiError.code,
      payload
    );
  }

  if (isApiEnvelope<T>(payload)) {
    return payload.data;
  }

  return payload as T;
}

function isApiEnvelope<T>(value: unknown): value is ApiEnvelope<T> {
  return (
    typeof value === 'object' &&
    value !== null &&
    'success' in value &&
    'data' in value
  );
}

function isApiErrorPayload(value: unknown): value is ApiErrorPayload {
  return typeof value === 'object' && value !== null;
}
