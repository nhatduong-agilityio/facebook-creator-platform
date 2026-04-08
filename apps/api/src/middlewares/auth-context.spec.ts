/* eslint-disable @typescript-eslint/unbound-method */
import { createAuthContextMiddleware } from '@/middlewares/auth-context';
import type { AuthServicePort } from '@/modules/auth/ports';
import type { FastifyReply, FastifyRequest } from 'fastify';

describe('authContextMiddleware', () => {
  it('hydrates req.currentUser from the auth service', async () => {
    const authService = {
      getOrCreateUser: jest.fn().mockResolvedValue({ id: 'user-internal-1' })
    } as unknown as AuthServicePort;
    const middleware = createAuthContextMiddleware(authService);
    const req = {
      user: { id: 'clerk-user-1' },
      currentUser: {
        id: 'user-internal-1'
      }
    };

    await middleware(req as FastifyRequest, {} as FastifyReply);

    expect(authService.getOrCreateUser).toHaveBeenCalledWith('clerk-user-1');
    expect(req.currentUser).toEqual({ id: 'user-internal-1' });
  });
});
