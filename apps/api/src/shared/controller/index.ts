import type { FastifyInstance } from 'fastify';

/**
 * Abstract base for all Fastify route controllers.
 *
 * Enforces a single convention: every controller must implement routes(),
 * which registers its endpoints on the Fastify instance.
 *
 * Usage in app.ts:
 *   const ctrl = createAuthModule(dataSource);
 *   app.register(ctrl.routes.bind(ctrl), { prefix: '/auth' });
 *
 * Usage in subclass:
 *   export class AuthController extends BaseController {
 *     constructor(private readonly authService: AuthService) { super(); }
 *
 *     async routes(fastify: FastifyInstance): void {
 *       fastify.get('/me', { onRequest: [clerkAuthMiddleware] }, this.me.bind(this));
 *     }
 *   }
 */
export abstract class BaseController {
  /**
   * Register all routes for this controller on the given Fastify instance.
   * Called by app.ts via fastify.register(ctrl.routes.bind(ctrl), { prefix }).
   */
  abstract routes(fastify: FastifyInstance): void;
}
