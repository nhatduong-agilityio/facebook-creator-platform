import type { FastifyReply, FastifyRequest } from 'fastify';

import { verifyClerkSessionToken } from '@/modules/auth/lib/clerk';
import { UnauthorizedError } from '@/shared/errors/errors';

/**
 * Fastify preHandler hook that verifies a Clerk bearer session token.
 *
 * On success:  sets req.user.id = userId (trusted)
 * On failure:  throws UnauthorizedError → global error handler → 401
 *
 * Usage:
 *   fastify.get('/me', { preHandler: [clerkAuthMiddleware] }, handler);
 *
 * Do NOT attach to webhook routes — those verify via Stripe/Facebook signatures.
 */
export async function clerkAuthMiddleware(
  req: FastifyRequest,
  _reply: FastifyReply
): Promise<void> {
  const authorizationHeader = req.headers.authorization;

  if (!authorizationHeader) {
    throw new UnauthorizedError('Authentication required');
  }

  const [scheme, token] = authorizationHeader.split(' ');

  if (!scheme || scheme.toLowerCase() !== 'bearer' || !token) {
    throw new UnauthorizedError('Authentication required');
  }

  try {
    const { clerkUserId } = await verifyClerkSessionToken(token);

    req.user = { id: clerkUserId };
  } catch (error) {
    req.log.warn(
      {
        message: error instanceof Error ? error.message : String(error),
        path: req.url
      },
      '[Auth] Bearer token verification failed'
    );

    throw new UnauthorizedError('Authentication required');
  }
}
