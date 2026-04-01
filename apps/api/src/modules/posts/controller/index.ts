// Shared
import { BaseController } from '@/shared/controller';

// Types
import type { PostServicePort } from '../ports';
import type { AuthServicePort } from '@/modules/auth/ports';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import type { BillingServicePort } from '@/modules/billing/ports';

// Middlewares
import { createAuthContextMiddleware } from '@/middlewares/auth-context';
import { createPlanGuardMiddleware } from '@/middlewares/plan-guard';
import { clerkAuthMiddleware } from '@/middlewares/clerk-auth';

// Contracts
import {
  createPostBodySchema,
  postParamsSchema,
  schedulePostBodySchema,
  toPostDto,
  updatePostBodySchema
} from '../contracts';

export class PostController extends BaseController {
  private readonly authContextMiddleware: ReturnType<
    typeof createAuthContextMiddleware
  >;

  private readonly planGuard: ReturnType<typeof createPlanGuardMiddleware>;

  constructor(
    private readonly postService: PostServicePort,
    billingService: BillingServicePort,
    authService: AuthServicePort
  ) {
    super();
    this.authContextMiddleware = createAuthContextMiddleware(authService);
    this.planGuard = createPlanGuardMiddleware(billingService);
  }

  override routes(fastify: FastifyInstance): void {
    const protectedHandlers = [
      clerkAuthMiddleware,
      this.authContextMiddleware,
      this.planGuard
    ];

    fastify.get('/', { preHandler: protectedHandlers }, this.list.bind(this));
    fastify.post('', { preHandler: protectedHandlers }, this.create.bind(this));
    fastify.put(
      '/:id',
      { preHandler: protectedHandlers },
      this.update.bind(this)
    );
    fastify.delete(
      '/posts/:id',
      { preHandler: protectedHandlers },
      this.remove.bind(this)
    );
    fastify.post(
      '/:id/publish',
      { preHandler: protectedHandlers },
      this.publish.bind(this)
    );
    fastify.post(
      '/:id/schedule',
      { preHandler: protectedHandlers },
      this.schedule.bind(this)
    );
  }

  private async list(req: FastifyRequest, reply: FastifyReply): Promise<void> {
    const posts = await this.postService.listPosts(req.user.id);

    return reply.send({
      success: true,
      data: posts.map(post => toPostDto(post))
    });
  }

  private async create(
    req: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    const body = createPostBodySchema.parse(req.body);
    const post = await this.postService.createPost(req.user.id, body, req.plan);

    return reply.status(201).send({
      success: true,
      data: toPostDto(post)
    });
  }

  private async update(
    req: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    const params = postParamsSchema.parse(req.params);
    const body = updatePostBodySchema.parse(req.body);
    const post = await this.postService.updatePost(
      req.user.id,
      params.id,
      body
    );

    return reply.send({
      success: true,
      data: toPostDto(post)
    });
  }

  private async remove(
    req: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    const params = postParamsSchema.parse(req.params);
    await this.postService.deletePost(req.user.id, params.id);

    return reply.status(204).send();
  }

  private async publish(
    req: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    const params = postParamsSchema.parse(req.params);
    const post = await this.postService.publishPostNow(req.user.id, params.id);

    return reply.send({
      success: true,
      data: toPostDto(post)
    });
  }

  private async schedule(
    req: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    const params = postParamsSchema.parse(req.params);
    const body = schedulePostBodySchema.parse(req.body);
    const post = await this.postService.schedulePost(
      req.user.id,
      params.id,
      body.scheduledAt,
      req.plan
    );

    return reply.send({
      success: true,
      data: toPostDto(post)
    });
  }
}
