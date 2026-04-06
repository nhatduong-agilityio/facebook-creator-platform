import type { UserEntity } from '@/modules/users/entity';
import type {
  BillingCheckoutSessionDto,
  BillingPlanContext,
  BillingSubscriptionSummaryDto
} from '../contracts';

export type StripeSubscriptionProviderStatus =
  | 'active'
  | 'trialing'
  | 'past_due'
  | 'canceled'
  | 'unpaid'
  | 'incomplete'
  | 'incomplete_expired'
  | 'paused';

export type StripeSubscriptionSnapshot = {
  id: string;
  customerId: string;
  status: StripeSubscriptionProviderStatus;
  currentPeriodEndTimestamp: number[];
};

export type StripeWebhookEventPayload =
  | {
      type: 'checkout.session.completed';
      data: {
        subscriptionId: string | null;
        userId?: string;
      };
    }
  | {
      type: 'customer.subscription.updated' | 'customer.subscription.deleted';
      data: StripeSubscriptionSnapshot;
    }
  | {
      type: string;
      data?: undefined;
    };

export interface StripeBillingProviderPort {
  createCustomer(input: {
    email: string;
    name?: string | null;
    userId: string;
  }): Promise<{ customerId: string }>;
  createCheckoutSession(input: {
    customerId: string;
    priceId: string;
    successUrl: string;
    cancelUrl: string;
    userId: string;
  }): Promise<{
    sessionId: string;
    checkoutUrl: string | null;
    subscriptionId: string | null;
  }>;
  constructWebhookEvent(
    signature: string,
    rawBody: Buffer,
    webhookSecret: string
  ): StripeWebhookEventPayload;
  retrieveSubscription(
    stripeSubscriptionId: string
  ): Promise<StripeSubscriptionSnapshot>;
  listSubscriptionsByCustomer(
    customerId: string
  ): Promise<StripeSubscriptionSnapshot[]>;
}

export interface BillingServicePort {
  getUserPlanContext(userId: string): Promise<BillingPlanContext>;
  getUserPlanContextForUser(user: UserEntity): Promise<BillingPlanContext>;
  getSubscriptionSummary(
    userId: string
  ): Promise<BillingSubscriptionSummaryDto>;
  getSubscriptionSummaryForUser(
    user: UserEntity
  ): Promise<BillingSubscriptionSummaryDto>;
  createCheckoutSession(input: {
    userId: string;
    successUrl: string;
    cancelUrl: string;
  }): Promise<BillingCheckoutSessionDto>;
  handleWebhook(signature: string, rawBody: Buffer): Promise<string>;
}
