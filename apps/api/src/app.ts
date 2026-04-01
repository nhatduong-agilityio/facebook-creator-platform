import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import { clerkPlugin } from '@clerk/fastify';
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
    origin: process.env.FRONTEND_URL ?? 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
  });

  app.register(clerkPlugin, {
    publishableKey: process.env.CLERK_PUBLISHABLE_KEY,
    secretKey: process.env.CLERK_SECRET_KEY
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
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime())
    });
  });

  // Route modules
  if (dataSource) {
    // Repositories
    const userRepo = new UserRepository(dataSource);
    const facebookAccountRepo = new FacebookAccountRepository(dataSource);
    const postRepo = new PostRepository(dataSource);
    const auditLogRepo = new AuditLogRepository(dataSource);

    // Providers
    const clerkProvider = new ClerkProvider();
    const facebookProvider = new FacebookGraphProvider();
    const postScheduler = new PostSchedulerProvider();

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

    // Modules
    const authModule = createAuthModule(authService, clerkProvider);
    const facebookModule = createFacebookModule(facebookService, authService);
    const postModule = createPostModule(postService, authService);

    app.register(authModule.routes.bind(authModule), {
      prefix: '/api/v1/auth'
    });
    app.register(facebookModule.routes.bind(facebookModule), {
      prefix: '/api/v1/facebook'
    });
    app.register(postModule.routes.bind(postModule), {
      prefix: '/api/v1/posts'
    });
  }

  return app;
}
