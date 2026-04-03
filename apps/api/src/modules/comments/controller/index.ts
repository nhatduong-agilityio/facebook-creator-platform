import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import type { AuthServicePort } from '@/modules/auth/ports';
import type { CommentsServicePort } from '../ports';
import { createAuthContextMiddleware } from '@/middlewares/auth-context';
import { clerkAuthMiddleware } from '@/middlewares/clerk-auth';
import { BaseController } from '@/shared/controller';
import { replyToPostThreadBodySchema } from '../contracts';

export class CommentsController extends BaseController {
  private readonly authContextMiddleware: ReturnType<
    typeof createAuthContextMiddleware
  >;

  constructor(
    private readonly commentsService: CommentsServicePort,
    authService: AuthServicePort
  ) {
    super();
    this.authContextMiddleware = createAuthContextMiddleware(authService);
  }

  override routes(fastify: FastifyInstance): void {
    const protectedHandlers = [clerkAuthMiddleware, this.authContextMiddleware];

    fastify.post(
      '/reply',
      { preHandler: protectedHandlers },
      this.reply.bind(this)
    );
  }

  private async reply(req: FastifyRequest, reply: FastifyReply): Promise<void> {
    const body = replyToPostThreadBodySchema.parse(req.body);
    const result = await this.commentsService.replyToPostThread(
      req.currentUser.id,
      body
    );

    return reply.send({
      success: true,
      data: result
    });
  }
}
