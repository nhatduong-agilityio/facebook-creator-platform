/* eslint-disable @typescript-eslint/unbound-method */
import {
  createPlanGuardMiddleware,
  requireProPlan
} from '@/middlewares/plan-guard';
import type { BillingServicePort } from '@/modules/billing/ports';
import { ForbiddenError } from '@/shared/errors/errors';
import type { FastifyReply, FastifyRequest } from 'fastify';

const billingService = {
  getUserPlanContextForUser: jest.fn().mockResolvedValue({ isPro: false }),
  getUserPlanContext: jest.fn(),
  getSubscriptionSummary: jest.fn(),
  getSubscriptionSummaryForUser: jest.fn(),
  createCheckoutSession: jest.fn(),
  handleWebhook: jest.fn()
} as BillingServicePort;

describe('plan guard middleware', () => {
  it('hydrates req.plan from currentUser when present', async () => {
    const middleware = createPlanGuardMiddleware(billingService);
    const req = {
      currentUser: { id: 'user-internal-1' },
      user: { id: 'clerk-user-1' },
      plan: {
        isPro: false
      }
    };

    await middleware(req as FastifyRequest, {} as FastifyReply);

    expect(billingService.getUserPlanContextForUser).toHaveBeenCalledWith({
      id: 'user-internal-1'
    });
    expect(req.plan).toEqual({ isPro: false });
  });

  it('hydrates req.plan from req.user when currentUser is absent', async () => {
    const newBillingService = {
      ...billingService,
      getUserPlanContext: jest.fn().mockResolvedValue({ isPro: true })
    };

    const middleware = createPlanGuardMiddleware(newBillingService);
    const req = {
      user: { id: 'clerk-user-1' },
      plan: {
        isPro: true
      }
    };

    await middleware(req as FastifyRequest, {} as FastifyReply);

    expect(newBillingService.getUserPlanContext).toHaveBeenCalledWith(
      'clerk-user-1'
    );
    expect(req.plan).toEqual({ isPro: true });
  });

  it('throws when a pro plan is required and missing', () => {
    expect(() =>
      requireProPlan(
        { plan: { isPro: false } } as FastifyRequest,
        {} as FastifyReply
      )
    ).toThrow(ForbiddenError);
  });

  it('allows pro plans', () => {
    expect(() =>
      requireProPlan(
        { plan: { isPro: true } } as FastifyRequest,
        {} as FastifyReply
      )
    ).not.toThrow();
  });
});
