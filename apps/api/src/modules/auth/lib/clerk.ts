import { createClerkClient, verifyToken } from '@clerk/fastify';

import { UnauthorizedError } from '@/shared/errors/errors';

const DEFAULT_FRONTEND_ORIGINS = [
  'http://localhost:3001',
  'http://127.0.0.1:3001'
];

let warnedAboutApiVersion = false;

type VerifiedSessionToken = {
  clerkUserId: string;
  sessionId: string | null;
  payload: Awaited<ReturnType<typeof verifyToken>>;
};

function getRequiredSecretKey(): string {
  const secretKey = process.env.CLERK_SECRET_KEY?.trim();

  if (!secretKey) {
    throw new Error('CLERK_SECRET_KEY is required.');
  }

  return secretKey;
}

function normalizeOrigin(origin: string): string {
  return origin.replace(/\/+$/, '');
}

function addLocalHostVariants(origin: string, values: Set<string>): void {
  values.add(origin);

  try {
    const url = new URL(origin);

    if (url.hostname === 'localhost') {
      url.hostname = '127.0.0.1';
      values.add(normalizeOrigin(url.toString()));
    }

    if (url.hostname === '127.0.0.1') {
      url.hostname = 'localhost';
      values.add(normalizeOrigin(url.toString()));
    }
  } catch {
    // Ignore malformed custom origins and keep the original value only.
  }
}

export function getAuthorizedParties(): string[] {
  const values = new Set<string>();

  for (const origin of DEFAULT_FRONTEND_ORIGINS) {
    addLocalHostVariants(origin, values);
  }

  const configuredOrigin = process.env.FRONTEND_URL?.trim();

  if (configuredOrigin) {
    addLocalHostVariants(normalizeOrigin(configuredOrigin), values);
  }

  return [...values];
}

export function createRuntimeClerkClient(): ReturnType<
  typeof createClerkClient
> {
  const jwtKey = process.env.CLERK_JWT_KEY?.trim();
  const apiUrl = process.env.CLERK_API_URL?.trim();
  const apiVersion = getSupportedApiVersion();

  return createClerkClient({
    secretKey: getRequiredSecretKey(),
    ...(apiUrl ? { apiUrl } : {}),
    ...(apiVersion ? { apiVersion } : {}),
    ...(jwtKey ? { jwtKey } : {})
  });
}

export async function verifyClerkSessionToken(
  token: string
): Promise<VerifiedSessionToken> {
  const jwtKey = process.env.CLERK_JWT_KEY?.trim();
  const apiUrl = process.env.CLERK_API_URL?.trim();
  const apiVersion = getSupportedApiVersion();

  const payload = await verifyToken(token, {
    secretKey: getRequiredSecretKey(),
    authorizedParties: getAuthorizedParties(),
    ...(apiUrl ? { apiUrl } : {}),
    ...(apiVersion ? { apiVersion } : {}),
    ...(jwtKey ? { jwtKey } : {})
  });

  if (!payload.sub) {
    throw new UnauthorizedError('Invalid authentication token');
  }

  return {
    clerkUserId: payload.sub,
    sessionId:
      typeof payload.sid === 'string' && payload.sid.length > 0
        ? payload.sid
        : null,
    payload
  };
}

function getSupportedApiVersion(): string | undefined {
  const configuredVersion = process.env.CLERK_API_VERSION?.trim();

  if (!configuredVersion) {
    return undefined;
  }

  if (/^v\d+$/i.test(configuredVersion)) {
    return configuredVersion.toLowerCase();
  }

  if (!warnedAboutApiVersion) {
    warnedAboutApiVersion = true;
    console.warn(
      `[Auth] Ignoring unsupported CLERK_API_VERSION="${configuredVersion}". Clerk backend SDK expects versions like "v1".`
    );
  }

  return undefined;
}
