import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import fastify, {
  type FastifyInstance,
  type FastifyServerOptions
} from 'fastify';

import { globalErrorHandler } from './shared/error-handler';

/**
 * Builds and configures the Fastify application.
 *
 * Separating app construction from server startup allows E2E tests
 * to call buildApp({ logger: false }) without starting a real server.
 *
 * @param opts - Fastify server options. Defaults to structured JSON logging.
 * @returns A fully configured Fastify instance (not yet listening).
 */
export function buildApp(opts: FastifyServerOptions = {}): FastifyInstance {
  // Destructure logger so the spread below does not override it
  const { logger: loggerOpt, ...restOpts } = opts;

  const app = fastify({
    logger: loggerOpt ?? {
      level: process.env.LOG_LEVEL ?? 'info'
    },
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

  // Raw body parser
  // Stripe webhooks require the raw Buffer to verify the signature.
  // We parse JSON ourselves and attach the raw Buffer as req.rawBody.
  app.addContentTypeParser(
    'application/json',
    { parseAs: 'buffer' },
    (req, body: Buffer, done) => {
      req.rawBody = body;
      try {
        done(null, JSON.parse(body.toString()));
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
  // Uncomment each block as the module is implemented in later phases.
  // app.register(authRoutes,      { prefix: '/auth' });
  // app.register(facebookRoutes,  { prefix: '/facebook' });
  // app.register(postRoutes,      { prefix: '/posts' });
  // app.register(analyticsRoutes, { prefix: '/analytics' });
  // app.register(billingRoutes,   { prefix: '/billing' });

  return app;
}
