import { verifyToken } from '@clerk/fastify';

import { UnauthorizedError } from '@/shared/errors/errors';

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

export async function verifyClerkSessionToken(
  token: string
): Promise<VerifiedSessionToken> {
  const payload = await verifyToken(token, {
    secretKey: getRequiredSecretKey()
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
