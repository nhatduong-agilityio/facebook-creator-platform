// Shared
import { ValidationError } from '@/shared/errors/errors';
import { BaseController } from '@/shared/controller';

// Middlewares
import { createAuthContextMiddleware } from '@/middlewares/auth-context';
import { createPlanGuardMiddleware } from '@/middlewares/plan-guard';
import { clerkAuthMiddleware } from '@/middlewares/clerk-auth';

// Types
import type { BillingServicePort } from '../ports';
import type { AuthServicePort } from '@/modules/auth/ports';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { checkoutBodySchema } from '../contracts';

export class BillingController extends BaseController {
  private readonly authContextMiddleware: ReturnType<
    typeof createAuthContextMiddleware
  >;
  private readonly planGuard: ReturnType<typeof createPlanGuardMiddleware>;

  constructor(
    private readonly billingService: BillingServicePort,
    authService: AuthServicePort
  ) {
    super();
    this.authContextMiddleware = createAuthContextMiddleware(authService);
    this.planGuard = createPlanGuardMiddleware(billingService);
  }

  /**
   * Register all routes for this controller on the given Fastify instance.
   *
   * This implementation registers the following endpoints:
   *   - GET /checkout: returns a Stripe Checkout session for the authenticated user
   *   - GET /subscriptions: returns a list of active subscriptions for the authenticated user
   *   - POST /webhook: handles Stripe webhooks (e.g. subscription created/updated events)
   */
  override routes(fastify: FastifyInstance): void {
    const protectedHandlers = [clerkAuthMiddleware, this.authContextMiddleware];

    fastify.get(
      '/checkout',
      { preHandler: protectedHandlers },
      this.checkout.bind(this)
    );

    fastify.get(
      '/subscriptions',
      { preHandler: [...protectedHandlers, this.planGuard] },
      this.subscriptions.bind(this)
    );
    fastify.post(
      '/webhook',
      { preHandler: protectedHandlers },
      this.webhook.bind(this)
    );
  }

  /**
   * Creates a new Stripe checkout session for the authenticated user.
   * The session is associated with the provided user ID and URLs.
   * @param {FastifyRequest} req - the Fastify request object
   * @param {FastifyReply} reply - the Fastify reply object
   * @returns {Promise<void>} - a promise that resolves to a JSON response with the session data
   */
  private async checkout(
    req: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    const body = checkoutBodySchema.parse(req.body);
    const session = await this.billingService.createCheckoutSession({
      userId: req.user.id,
      successUrl: body.successUrl,
      cancelUrl: body.cancelUrl
    });

    return reply.send({
      success: true,
      data: session
    });
  }

  /**
   * GET /subscriptions
   *
   * Retrieves the subscription summary for the authenticated user.
   * The summary includes the billing plan code, name, post limit, scheduled limit, status, and current period end date.
   * @returns {Promise<void>} - a promise that resolves to a JSON response with the subscription summary
   */
  private async subscriptions(
    req: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    const subscription =
      await this.billingService.getSubscriptionSummaryForUser(req.currentUser);

    return reply.send({
      success: true,
      data: subscription
    });
  }

  /**
   * Handles a Stripe webhook event.
   * The request must contain the Stripe webhook signature in the
   * `stripe-signature` header and the raw webhook body.
   * The response will contain the type of the event that was handled.
   * @throws {ValidationError} if the webhook signature is missing or invalid, or if the raw body is missing
   */
  private async webhook(
    req: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    const signature = req.headers['stripe-signature'];

    if (!signature || Array.isArray(signature)) {
      throw new ValidationError('Missing Stripe webhook signature');
    }

    if (!req.rawBody) {
      throw new ValidationError('Raw body is required for Stripe webhook');
    }

    const eventType = await this.billingService.handleWebhook(
      signature,
      Buffer.from(req.rawBody)
    );

    return reply.send({
      success: true,
      data: {
        type: eventType
      }
    });
  }
}
