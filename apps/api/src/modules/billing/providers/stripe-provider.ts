import type Stripe from 'stripe';
import type {
  StripeBillingProviderPort,
  StripeSubscriptionSnapshot,
  StripeWebhookEventPayload
} from '../ports';
import { getStripeClient } from '@/config/stripe';

export class StripeProvider implements StripeBillingProviderPort {
  constructor(private readonly stripeClient: Stripe = getStripeClient()) {}

  /**
   * Creates a new Stripe customer with the provided email and name.
   * The created customer is associated with the provided userId.
   *
   * @param {Object} input - the input object with email, name, and userId
   * @param {string} input.email - the email address of the customer
   * @param {string | null | undefined} input.name - the name of the customer (optional)
   * @param {string} input.userId - the user ID to associate the customer with
   * @returns {Promise<{ customerId: string }>} - a promise that resolves to an object with the customer ID
   */
  async createCustomer(input: {
    email: string;
    name?: string | null;
    userId: string;
    idempotencyKey: string;
  }): Promise<{ customerId: string }> {
    const customer = await this.stripeClient.customers.create(
      {
        email: input.email,
        name: input.name ?? undefined,
        metadata: {
          userId: input.userId
        }
      },
      {
        idempotencyKey: input.idempotencyKey
      }
    );

    return { customerId: customer.id };
  }

  /**
   * Creates a new Stripe checkout session with the provided customer ID, price ID, and URLs.
   * The created session is associated with the provided userId.
   *
   * @param {Object} input - the input object with customerId, priceId, successUrl, cancelUrl, and userId
   * @param {string} input.customerId - the customer ID to associate the session with
   * @param {string} input.priceId - the price ID to use for the session
   * @param {string} input.successUrl - the URL to redirect the user to after a successful checkout
   * @param {string} input.cancelUrl - the URL to redirect the user to after a cancelled checkout
   * @param {string} input.userId - the user ID to associate the session with
   * @returns {Promise<{ sessionId: string; checkoutUrl: string | null; subscriptionId: string | null; }>} - a promise that resolves to an object with the session ID, checkout URL, and subscription ID (if applicable)
   */
  async createCheckoutSession(input: {
    customerId: string;
    priceId: string;
    successUrl: string;
    cancelUrl: string;
    userId: string;
    idempotencyKey: string;
  }): Promise<{
    sessionId: string;
    checkoutUrl: string | null;
    subscriptionId: string | null;
  }> {
    const session = await this.stripeClient.checkout.sessions.create(
      {
        mode: 'subscription',
        customer: input.customerId,
        line_items: [{ price: input.priceId, quantity: 1 }],
        success_url: input.successUrl,
        cancel_url: input.cancelUrl,
        allow_promotion_codes: true,
        metadata: {
          userId: input.userId
        }
      },
      {
        idempotencyKey: input.idempotencyKey
      }
    );

    return {
      sessionId: session.id,
      checkoutUrl: session.url,
      subscriptionId:
        typeof session.subscription === 'string'
          ? session.subscription
          : (session.subscription?.id ?? null)
    };
  }

  /**
   * Constructs a Stripe webhook event payload from the provided signature, raw body, and webhook secret.
   *
   * @param {string} signature - the signature of the webhook event
   * @param {Buffer} rawBody - the raw body of the webhook event
   * @param {string} webhookSecret - the webhook secret used to verify the event
   * @returns {StripeWebhookEventPayload} - the constructed webhook event payload
   */
  constructWebhookEvent(
    signature: string,
    rawBody: Buffer,
    webhookSecret: string
  ): StripeWebhookEventPayload {
    const event = this.stripeClient.webhooks.constructEvent(
      rawBody,
      signature,
      webhookSecret
    );

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;

        return {
          type: event.type,
          data: {
            subscriptionId:
              typeof session.subscription === 'string'
                ? session.subscription
                : (session.subscription?.id ?? null),
            userId: session.metadata?.userId
          }
        };
      }
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        return {
          type: event.type,
          data: this.toSubscriptionSnapshot(event.data.object)
        };
      default:
        return {
          type: event.type
        };
    }
  }

  /**
   * Retrieves a Stripe Subscription object by its ID and converts it to a StripeSubscriptionSnapshot.
   *
   * @param {string} stripeSubscriptionId - the ID of the Stripe Subscription object to retrieve
   * @returns {Promise<StripeSubscriptionSnapshot>} - a promise that resolves to the retrieved StripeSubscriptionSnapshot
   */
  async retrieveSubscription(
    stripeSubscriptionId: string
  ): Promise<StripeSubscriptionSnapshot> {
    const subscription =
      await this.stripeClient.subscriptions.retrieve(stripeSubscriptionId);

    return this.toSubscriptionSnapshot(subscription);
  }

  async listSubscriptionsByCustomer(
    customerId: string
  ): Promise<StripeSubscriptionSnapshot[]> {
    const subscriptions = await this.stripeClient.subscriptions.list({
      customer: customerId,
      status: 'all',
      limit: 10
    });

    return subscriptions.data.map(subscription =>
      this.toSubscriptionSnapshot(subscription)
    );
  }

  /**
   * Converts a Stripe Subscription object to a StripeSubscriptionSnapshot.
   *
   * @param {Stripe.Subscription} subscription - the Stripe Subscription object to convert
   * @returns {StripeSubscriptionSnapshot} - the converted StripeSubscriptionSnapshot
   * @private
   */
  private toSubscriptionSnapshot(
    subscription: Stripe.Subscription
  ): StripeSubscriptionSnapshot {
    return {
      id: subscription.id,
      customerId:
        typeof subscription.customer === 'string'
          ? subscription.customer
          : subscription.customer.id,
      status: subscription.status,
      currentPeriodEndTimestamp: subscription.items.data
        .map(item => item.current_period_end)
        .filter((value): value is number => typeof value === 'number')
    };
  }
}
