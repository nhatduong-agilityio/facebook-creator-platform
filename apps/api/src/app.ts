import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import fastify, {
  type FastifyServerOptions,
  type FastifyInstance
} from 'fastify';
import type { DataSource } from 'typeorm';

import { globalErrorHandler } from './shared/errors/error-handler';
import { createAuthModule } from './modules/auth/module';
import { UserRepository } from './modules/users/repository';
import { AuthService } from './modules/auth/service';
import { ClerkProvider } from './modules/auth/providers/clerk-provider';
import { FacebookAccountRepository } from './modules/facebook/repository';
import { FacebookGraphProvider } from './modules/facebook/providers/facebook-graph-provider';
import { FacebookService } from './modules/facebook/service';
import { createFacebookModule } from './modules/facebook/module';
import { PostRepository } from './modules/posts/repository';
import { PostSchedulerProvider } from './modules/posts/providers/post-scheduler-provider';
import { PostService } from './modules/posts/service';
import { createPostModule } from './modules/posts/module';
import { AuditLogRepository } from './modules/audit-logs/repository';
import { PostMetricRepository } from './modules/analytics/repository';
import { AnalyticsService } from './modules/analytics/service';
import { createAnalyticsModule } from './modules/analytics/module';
import { CommentsService } from './modules/comments/service';
import { createCommentsModule } from './modules/comments/module';
import { SubscriptionRepository } from './modules/subscriptions/repository';
import { StripeProvider } from './modules/billing/providers/stripe-provider';
import { BillingService } from './modules/billing/service';
import { PlanRepository } from './modules/plans/repository';
import { createBillingModule } from './modules/billing/module';
import { getAuthorizedParties } from './modules/auth/lib/clerk';

/**
 * Builds and configures the Fastify application.
 *
 * Separating app construction from server startup allows E2E tests
 * to call buildApp({ logger: false }) without starting a real server.
 *
 * @param opts - Fastify server options. Defaults to structured JSON logging.
 * @returns A fully configured Fastify instance (not yet listening).
 */
export function buildApp(
  dataSource?: DataSource,
  opts: FastifyServerOptions = {}
): FastifyInstance {
  const { logger: loggerOpt, ...restOpts } = opts;

  const app = fastify({
    logger: loggerOpt ?? { level: process.env.LOG_LEVEL ?? 'info' },
    bodyLimit: Number(process.env.API_BODY_LIMIT_BYTES ?? 25 * 1024 * 1024),
    // Allows Fastify to use Error.cause for better error context
    routerOptions: {
      ignoreDuplicateSlashes: true
    },
    ...restOpts
  });

  // Global error handler
  // Must be registered before any routes so every thrown error is caught.
  app.setErrorHandler(globalErrorHandler);

  // Security plugins
  app.register(helmet, {
    // API-only server — no HTML responses, CSP not needed
    contentSecurityPolicy: false
  });

  app.register(cors, {
    origin: getAuthorizedParties(),
    credentials: false,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Authorization', 'Content-Type']
  });

  // Raw body parser
  // Stripe webhooks require the raw Buffer to verify the signature.
  // We parse JSON ourselves and attach the raw Buffer as req.rawBody.
  app.addContentTypeParser(
    'application/json',
    { parseAs: 'buffer' },
    (req, body: Buffer, done) => {
      req.rawBody = body;
      try {
        const parsed: unknown = JSON.parse(body.toString());
        done(null, parsed);
      } catch {
        const error = new Error('Invalid JSON body');
        done(error, undefined);
      }
    }
  );

  // Health check
  // Lightweight liveness probe — does NOT check DB to avoid false negatives
  // on DB-unrelated restarts. Add a /health/ready route for readiness checks.
  app.get('/health', async (_req, reply) => {
    return reply.send({
      status: dataSource?.isInitialized ? 'ok' : 'unhealthy'
    });
  });

  // Route modules
  if (dataSource) {
    // Repositories
    const userRepo = new UserRepository(dataSource);
    const facebookAccountRepo = new FacebookAccountRepository(dataSource);
    const postRepo = new PostRepository(dataSource);
    const auditLogRepo = new AuditLogRepository(dataSource);
    const postMetricRepo = new PostMetricRepository(dataSource);
    const subscriptionRepo = new SubscriptionRepository(dataSource);
    const planRepo = new PlanRepository(dataSource);

    // Providers
    const clerkProvider = new ClerkProvider();
    const facebookProvider = new FacebookGraphProvider();
    const postScheduler = new PostSchedulerProvider();
    const stripeProvider = new StripeProvider();

    // Services
    const authService = new AuthService(userRepo, clerkProvider);
    const facebookService = new FacebookService(
      userRepo,
      facebookAccountRepo,
      auditLogRepo,
      facebookProvider
    );
    const postService = new PostService(
      userRepo,
      postRepo,
      facebookService,
      auditLogRepo,
      postScheduler
    );
    const analyticsService = new AnalyticsService(
      userRepo,
      postRepo,
      postMetricRepo,
      facebookAccountRepo,
      facebookService,
      auditLogRepo
    );
    const commentsService = new CommentsService(
      postRepo,
      facebookService,
      auditLogRepo
    );
    const billingService = new BillingService(
      userRepo,
      planRepo,
      subscriptionRepo,
      auditLogRepo,
      stripeProvider
    );

    // Modules
    const authModule = createAuthModule(authService, clerkProvider);
    const facebookModule = createFacebookModule(facebookService, authService);
    const postModule = createPostModule(
      postService,
      billingService,
      authService
    );
    const analyticsModule = createAnalyticsModule(
      analyticsService,
      billingService,
      authService
    );
    const commentsModule = createCommentsModule(commentsService, authService);
    const billingModule = createBillingModule(billingService, authService);

    app.register(authModule.routes.bind(authModule), {
      prefix: '/api/v1/auth'
    });
    app.register(facebookModule.routes.bind(facebookModule), {
      prefix: '/api/v1/facebook'
    });
    app.register(postModule.routes.bind(postModule), {
      prefix: '/api/v1/posts'
    });
    app.register(analyticsModule.routes.bind(analyticsModule), {
      prefix: '/api/v1/analytics'
    });
    app.register(commentsModule.routes.bind(commentsModule), {
      prefix: '/api/v1/comments'
    });
    app.register(billingModule.routes.bind(billingModule), {
      prefix: '/api/v1/billing'
    });
  }

  return app;
}
