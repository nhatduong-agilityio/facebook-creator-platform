/* eslint-disable @typescript-eslint/unbound-method */
import request from 'supertest';
import { mock, type MockProxy } from 'jest-mock-extended';
import type { FastifyInstance } from 'fastify';

jest.mock('@/middlewares/clerk-auth', () => ({
  clerkAuthMiddleware: jest.fn(async req => {
    await new Promise(resolve => {
      req.user = { id: 'clerk-user-1' };
      resolve(req);
    });
  })
}));

import { createBillingModule } from '@/modules/billing/module';
import type { BillingServicePort } from '@/modules/billing/ports';
import type { AuthServicePort } from '@/modules/auth/ports';
import { buildTestApp } from '@/__tests__/helpers/build-test-app';
import { makeUser } from '@/__tests__/helpers/fixtures';

describe('BillingController e2e', () => {
  let app: FastifyInstance;
  let billingService: MockProxy<BillingServicePort>;
  let authService: MockProxy<AuthServicePort>;

  beforeEach(async () => {
    billingService = mock<BillingServicePort>();
    authService = mock<AuthServicePort>();

    authService.getOrCreateUser.mockResolvedValue(makeUser());
    billingService.getUserPlanContextForUser.mockResolvedValue({
      code: 'free',
      name: 'Free',
      isPro: false,
      postLimit: 10,
      scheduledLimit: 3,
      status: 'active',
      currentPeriodEnd: null
    });

    const controller = createBillingModule(billingService, authService);
    app = await buildTestApp(fastify => {
      fastify.register(controller.routes.bind(controller), {
        prefix: '/api/v1/billing'
      });
    });
  });

  afterEach(async () => {
    jest.clearAllMocks();
    await app.close();
  });

  it('creates a checkout session', async () => {
    billingService.createCheckoutSession.mockResolvedValue({
      checkoutUrl: 'https://stripe.test/checkout',
      sessionId: 'cs_test_123'
    });

    const response = await request(app.server)
      .post('/api/v1/billing/checkout')
      .send({
        successUrl: 'http://localhost:3001/billing?checkout=success',
        cancelUrl: 'http://localhost:3001/billing?checkout=cancel'
      });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      data: {
        checkoutUrl: 'https://stripe.test/checkout',
        sessionId: 'cs_test_123'
      }
    });
  });

  it('returns the current subscription summary', async () => {
    billingService.getSubscriptionSummaryForUser.mockResolvedValue({
      plan: {
        code: 'free',
        name: 'Free',
        isPro: false,
        postLimit: 10,
        scheduledLimit: 3,
        status: 'active',
        currentPeriodEnd: null
      },
      stripeSubscriptionId: null
    });

    const response = await request(app.server).get(
      '/api/v1/billing/subscription'
    );

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.plan.code).toBe('free');
  });

  it('handles Stripe webhook events', async () => {
    billingService.handleWebhook.mockResolvedValue(
      'checkout.session.completed'
    );

    const response = await request(app.server)
      .post('/api/v1/billing/webhook')
      .set('stripe-signature', 'sig_test_123')
      .send({ id: 'evt_1' });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      data: {
        type: 'checkout.session.completed'
      }
    });
    expect(billingService.handleWebhook).toHaveBeenCalled();
  });

  it('validates missing Stripe webhook signature', async () => {
    const response = await request(app.server)
      .post('/api/v1/billing/webhook')
      .send({ id: 'evt_1' });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      statusCode: 400,
      code: 'VALIDATION_ERROR',
      message: 'Missing Stripe webhook signature'
    });
  });
});
