import type { FastifyReply, FastifyRequest } from 'fastify';
import { getAuth } from '@clerk/fastify';

import { UnauthorizedError } from '@/shared/errors/errors';

/**
 * Fastify preHandler hook that verifies a Clerk JWT via clerkPlugin.
 *
 * clerkPlugin (registered in app.ts) validates the token and attaches
 * auth state to the request. getAuth() reads that state — no manual
 * token parsing needed.
 *
 * On success:  sets req.user.id = userId (trusted)
 * On failure:  throws UnauthorizedError → global error handler → 401
 *
 * Usage:
 *   fastify.get('/me', { preHandler: [clerkAuthMiddleware] }, handler);
 *
 * Do NOT attach to webhook routes — those verify via Stripe/Facebook signatures.
 */
export function clerkAuthMiddleware(
  req: FastifyRequest,
  _reply: FastifyReply
): void {
  try {
    const { isAuthenticated, userId } = getAuth(req);

    if (!isAuthenticated || !userId) {
      throw new UnauthorizedError('Authentication required');
    }

    req.user = { id: userId };
  } catch (err) {
    if (err instanceof UnauthorizedError) throw err;
    throw new UnauthorizedError('Invalid authentication');
  }
}
