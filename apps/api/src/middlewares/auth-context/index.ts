// Types
import type { FastifyReply, FastifyRequest } from 'fastify';
import type { AuthServicePort } from '@/modules/auth/ports';

export function createAuthContextMiddleware(authService: AuthServicePort) {
  return async function authContextMiddleware(
    req: FastifyRequest,
    _reply: FastifyReply
  ): Promise<void> {
    req.currentUser = await authService.getOrCreateUser(req.user.id);
  };
}
