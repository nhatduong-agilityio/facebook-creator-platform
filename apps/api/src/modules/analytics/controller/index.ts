// Shared
import { BaseController } from '@/shared/controller';

// Middlewares
import { createAuthContextMiddleware } from '@/middlewares/auth-context';
import { createPlanGuardMiddleware } from '@/middlewares/plan-guard';
import { clerkAuthMiddleware } from '@/middlewares/clerk-auth';

// Types
import type { AnalyticsServicePort } from '../ports';
import type { AuthServicePort } from '@/modules/auth/ports';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import type { BillingServicePort } from '@/modules/billing/ports';

export class AnalyticsController extends BaseController {
  private readonly authContextMiddleware: ReturnType<
    typeof createAuthContextMiddleware
  >;
  private readonly planGuard: ReturnType<typeof createPlanGuardMiddleware>;

  constructor(
    private readonly analyticsService: AnalyticsServicePort,
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

    fastify.get(
      '/overview',
      { preHandler: protectedHandlers },
      this.overview.bind(this)
    );

    fastify.get(
      '/posts',
      { preHandler: protectedHandlers },
      this.posts.bind(this)
    );

    fastify.post(
      '/refresh',
      { preHandler: protectedHandlers },
      this.refresh.bind(this)
    );
  }

  /**
   * Retrieves an overview of the user's analytics.
   *
   * The overview includes the user's total posts, scheduled posts, published posts, total likes, total comments, total reach, and total engagement.
   * @param {FastifyRequest} req - the request object
   * @param {FastifyReply} reply - the reply object
   * @returns {Promise<void>} - a promise that resolves to nothing
   */
  private async overview(
    req: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    const overview = await this.analyticsService.getOverview(req.user.id);

    return reply.send({
      success: true,
      data: overview
    });
  }

  /**
   * Retrieves an array of analytics for the user's posts.
   * The analytics include the post's title, status, scheduled date, published date, and Facebook post ID.
   * The metrics include the post's likes, comments, reach, engagement, and the date the metrics were last fetched.
   * @param {FastifyRequest} req - the request object
   * @param {FastifyReply} reply - the reply object
   * @returns {Promise<void>} - a promise that resolves to nothing
   */
  private async posts(req: FastifyRequest, reply: FastifyReply): Promise<void> {
    const posts = await this.analyticsService.getPostAnalytics(req.user.id);

    return reply.send({
      success: true,
      data: posts
    });
  }

  private async refresh(
    req: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    const refreshedPosts = await this.analyticsService.refreshUserMetrics(
      req.user.id
    );

    return reply.send({
      success: true,
      data: {
        refreshedPosts
      }
    });
  }
}
