/* eslint-disable @typescript-eslint/unbound-method */
import { mock, type MockProxy } from 'jest-mock-extended';

import type { AuditLogWriterPort } from '@/modules/audit-logs/ports';
import type {
  StripeBillingProviderPort,
  StripeSubscriptionSnapshot
} from '@/modules/billing/ports';
import { BillingService } from '@/modules/billing/service';
import type { PlanRepositoryPort } from '@/modules/plans/ports';
import type { SubscriptionRepositoryPort } from '@/modules/subscriptions/ports';
import type { UserStripeBillingPort } from '@/modules/users/ports';
import {
  makePlan,
  makeSubscription,
  makeUser
} from '@/__tests__/helpers/fixtures';
import { PLAN_CODES } from '@/shared/constants/billing';
import { SUBSCRIPTION_STATUSES } from '@/shared/constants/subscription';
import { ExternalServiceError, ValidationError } from '@/shared/errors/errors';

describe('BillingService', () => {
  const originalPriceId = process.env.STRIPE_PRO_PRICE_ID;
  const originalWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let userRepo: MockProxy<UserStripeBillingPort>;
  let planRepo: MockProxy<PlanRepositoryPort>;
  let subscriptionRepo: MockProxy<SubscriptionRepositoryPort>;
  let auditLogRepo: MockProxy<AuditLogWriterPort>;
  let stripeProvider: MockProxy<StripeBillingProviderPort>;
  let service: BillingService;

  beforeEach(() => {
    process.env.STRIPE_PRO_PRICE_ID = 'price_test_123';
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_123';

    userRepo = mock<UserStripeBillingPort>();
    planRepo = mock<PlanRepositoryPort>();
    subscriptionRepo = mock<SubscriptionRepositoryPort>();
    auditLogRepo = mock<AuditLogWriterPort>();
    stripeProvider = mock<StripeBillingProviderPort>();
    service = new BillingService(
      userRepo,
      planRepo,
      subscriptionRepo,
      auditLogRepo,
      stripeProvider
    );
  });

  afterEach(() => {
    process.env.STRIPE_PRO_PRICE_ID = originalPriceId;
    process.env.STRIPE_WEBHOOK_SECRET = originalWebhookSecret;
  });

  it('creates a customer and checkout session with idempotency keys', async () => {
    const user = makeUser({ stripeCustomerId: null });
    const freePlan = makePlan();
    const freeSubscription = makeSubscription();
    userRepo.findByClerkId.mockResolvedValue(user);
    planRepo.ensureDefaults.mockResolvedValue(undefined);
    subscriptionRepo.findCurrentByUserId.mockResolvedValue(freeSubscription);
    planRepo.findById.mockResolvedValueOnce(null);
    planRepo.getFreePlan.mockResolvedValue(freePlan);
    subscriptionRepo.saveSubscription.mockResolvedValue(freeSubscription);
    stripeProvider.createCustomer.mockResolvedValue({ customerId: 'cus_123' });
    stripeProvider.createCheckoutSession.mockResolvedValue({
      sessionId: 'cs_123',
      checkoutUrl: 'https://stripe.test/checkout',
      subscriptionId: 'sub_123'
    });

    const result = await service.createCheckoutSession({
      userId: user.clerkUserId,
      successUrl: 'http://localhost:3001/billing?checkout=success',
      cancelUrl: 'http://localhost:3001/billing?checkout=cancel'
    });

    expect(stripeProvider.createCustomer).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: user.id,
        idempotencyKey: `billing:customer:create:${user.id}`
      })
    );
    expect(stripeProvider.createCheckoutSession).toHaveBeenCalledWith(
      expect.objectContaining({
        customerId: 'cus_123',
        priceId: 'price_test_123',
        userId: user.id,
        idempotencyKey: `billing:checkout:create:${user.id}:price_test_123`
      })
    );
    expect(result).toEqual({
      checkoutUrl: 'https://stripe.test/checkout',
      sessionId: 'cs_123'
    });
  });

  it('rejects placeholder Stripe price ids', async () => {
    process.env.STRIPE_PRO_PRICE_ID = 'price_xxx';

    await expect(
      service.createCheckoutSession({
        userId: 'clerk-user-1',
        successUrl: 'http://localhost:3001/success',
        cancelUrl: 'http://localhost:3001/cancel'
      })
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it('returns a free subscription summary when no paid subscription exists', async () => {
    const user = makeUser();
    const freePlan = makePlan();
    const freeSubscription = makeSubscription();
    userRepo.findByClerkId.mockResolvedValue(user);
    planRepo.ensureDefaults.mockResolvedValue(undefined);
    subscriptionRepo.findCurrentByUserId.mockResolvedValue(null);
    stripeProvider.listSubscriptionsByCustomer.mockResolvedValue([]);
    planRepo.getFreePlan.mockResolvedValue(freePlan);
    subscriptionRepo.saveSubscription.mockResolvedValue(freeSubscription);

    const result = await service.getSubscriptionSummary(user.clerkUserId);

    expect(result).toEqual({
      plan: {
        code: PLAN_CODES.FREE,
        name: 'Free',
        isPro: false,
        postLimit: 10,
        scheduledLimit: 3,
        status: SUBSCRIPTION_STATUSES[2],
        currentPeriodEnd: null
      },
      stripeSubscriptionId: null
    });
  });

  it('surfaces Stripe reconciliation failures instead of silently downgrading', async () => {
    const user = makeUser({ stripeCustomerId: 'cus_123' });
    userRepo.findByClerkId.mockResolvedValue(user);
    planRepo.ensureDefaults.mockResolvedValue(undefined);
    subscriptionRepo.findCurrentByUserId.mockResolvedValue(null);
    stripeProvider.listSubscriptionsByCustomer.mockRejectedValue(
      new Error('stripe unavailable')
    );

    await expect(
      service.getUserPlanContextForUser(user)
    ).rejects.toBeInstanceOf(ExternalServiceError);
  });

  it('handles checkout completed webhooks by syncing the Stripe subscription', async () => {
    const user = makeUser({ stripeCustomerId: 'cus_123' });
    const proPlan = makePlan({
      id: 'plan-pro-1',
      code: PLAN_CODES.PRO,
      name: 'Pro',
      postLimit: -1,
      scheduledLimit: -1
    });
    const snapshot: StripeSubscriptionSnapshot = {
      id: 'sub_123',
      customerId: 'cus_123',
      status: 'active',
      currentPeriodEndTimestamp: [1776000000]
    };
    userRepo.findById.mockResolvedValue(user);
    planRepo.getProPlan.mockResolvedValue(proPlan);
    stripeProvider.constructWebhookEvent.mockReturnValue({
      type: 'checkout.session.completed',
      data: { subscriptionId: 'sub_123', userId: user.id }
    });
    stripeProvider.retrieveSubscription.mockResolvedValue(snapshot);
    subscriptionRepo.saveSubscription.mockResolvedValue(
      makeSubscription({
        planId: proPlan.id,
        stripeSubscriptionId: 'sub_123',
        stripeCustomerId: 'cus_123'
      })
    );

    const result = await service.handleWebhook('sig_123', Buffer.from('{}'));

    expect(result).toBe('checkout.session.completed');
    expect(subscriptionRepo.saveSubscription).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: user.id,
        planId: proPlan.id,
        stripeSubscriptionId: 'sub_123'
      })
    );
  });
});
