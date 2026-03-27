import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { clerkAuthMiddleware } from '@/middlewares/clerk-auth';
import { BaseController } from '@/shared/controller';
import type { AuthService } from '../service';

export class AuthController extends BaseController {
  constructor(private readonly authService: AuthService) {
    super();
  }

  override routes(fastify: FastifyInstance): void {
    /**
     * GET /auth/me
     *
     * Returns the authenticated user record.
     * Creates a new user on first call (sync with Clerk identity).
     *
     * Clerk provides email/name via session claims on the JWT.
     * If claims are absent we fall back to empty strings — the user
     * can update their profile later via a separate endpoint.
     */
    fastify.get(
      '/me',
      { preHandler: [clerkAuthMiddleware] },
      this.me.bind(this)
    );
  }

  private async me(req: FastifyRequest, reply: FastifyReply): Promise<void> {
    const user = await this.authService.getOrCreateUser(req.user.id);

    return reply.send({
      success: true,
      data: user
    });
  }
}
