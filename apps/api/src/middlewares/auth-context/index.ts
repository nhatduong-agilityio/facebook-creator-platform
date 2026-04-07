// Types
import type { FastifyReply, FastifyRequest } from 'fastify';
import type { AuthProfileHint, AuthServicePort } from '@/modules/auth/ports';

function parseAuthProfileHint(
  req: FastifyRequest
): AuthProfileHint | undefined {
  const clerkUserIdHeader = req.headers['x-clerk-user-id'];
  const emailHeader = req.headers['x-clerk-user-email'];
  const nameHeader = req.headers['x-clerk-user-name'];

  const clerkUserId =
    typeof clerkUserIdHeader === 'string' ? clerkUserIdHeader.trim() : '';
  const email = typeof emailHeader === 'string' ? emailHeader.trim() : '';
  const name = typeof nameHeader === 'string' ? nameHeader.trim() : '';

  if (!clerkUserId) {
    return undefined;
  }

  return {
    clerkUserId,
    email: email || null,
    name: name || null
  };
}

export function createAuthContextMiddleware(authService: AuthServicePort) {
  return async function authContextMiddleware(
    req: FastifyRequest,
    _reply: FastifyReply
  ): Promise<void> {
    req.currentUser = await authService.getOrCreateUser(
      req.user.id,
      parseAuthProfileHint(req)
    );
  };
}
