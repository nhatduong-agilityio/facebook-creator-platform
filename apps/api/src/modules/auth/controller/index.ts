// Types
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import type {
  AuthServicePort,
  ClerkWebhookEventPayload,
  ClerkWebhookVerifierPort
} from '@/modules/auth/ports';
import type { UserEntity } from '@/modules/users/entity';

// Middlewares
import { clerkAuthMiddleware } from '@/middlewares/clerk-auth';
import { createAuthContextMiddleware } from '@/middlewares/auth-context';

// Shared
import { ValidationError } from '@/shared/errors';
import { BaseController } from '@/shared/controller';

// Contracts
import { toAuthSessionDto } from '../contracts';

export class AuthController extends BaseController {
  private readonly authContextMiddleware: ReturnType<
    typeof createAuthContextMiddleware
  >;

  // TODO: Implement plan guard when billing module is implemented and inject a plan guard service here in the future

  constructor(
    private readonly authService: AuthServicePort,
    private readonly clerkWebhookVerifier: ClerkWebhookVerifierPort
  ) {
    super();
    this.authContextMiddleware = createAuthContextMiddleware(authService);
  }

  /**
   * Register all routes for this controller on the given Fastify instance.
   *
   * This implementation registers the following endpoints:
   *   - GET /auth/me: returns the authenticated user record
   *   - GET /auth/session: returns the authenticated user record (alias for /auth/me)
   *   - POST /auth/webhook/clerk: handles Clerk webhooks (e.g. user created/updated events)
   */
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
    const protectedHandlers = [clerkAuthMiddleware, this.authContextMiddleware];

    fastify.get('/me', { preHandler: protectedHandlers }, this.me.bind(this));
    fastify.get(
      '/session',
      { preHandler: protectedHandlers },
      this.me.bind(this)
    );
    fastify.post('/webhook/clerk', this.clerkWebhook.bind(this));
  }

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
  private async me(req: FastifyRequest, reply: FastifyReply): Promise<void> {
    return reply.send({
      success: true,
      data: toAuthSessionDto(req.currentUser as UserEntity)
    });
  }

  /**
   * POST /auth/webhook/clerk
   *
   * Handles Clerk webhooks, which notify our server of changes to user records.
   * Clerk provides user data via the webhook event payload.
   *
   * @throws {ValidationError} if the webhook signature is invalid
   */
  private async clerkWebhook(
    req: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    let event: ClerkWebhookEventPayload;

    try {
      event = await this.clerkWebhookVerifier.verifyWebhook(req);
    } catch {
      throw new ValidationError('Invalid Clerk webhook signature');
    }

    await this.authService.syncClerkWebhook(event);

    return reply.send({ success: true, data: { type: event.type } });
  }
}
