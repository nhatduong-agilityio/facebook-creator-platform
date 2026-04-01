import type { BillingServicePort } from '@/modules/billing/ports';
import { ForbiddenError } from '@/shared/errors/errors';
import type { FastifyReply, FastifyRequest } from 'fastify';

/**
 * Creates a middleware that checks if the user has a valid plan.
 *
 * The plan is expected to be present in the request object as `req.plan`.
 * If the plan is not present or is not valid, a ForbiddenError is thrown.
 *
 * @returns {function} - a middleware function that checks for a valid plan.
 */
export function createPlanGuardMiddleware(billingService: BillingServicePort) {
  return async function planGuardMiddleware(
    req: FastifyRequest,
    _reply: FastifyReply
  ): Promise<void> {
    req.plan = req.currentUser
      ? await billingService.getUserPlanContextForUser(req.currentUser)
      : await billingService.getUserPlanContext(req.user.id);
  };
}

/**
 * Throws a ForbiddenError if the user's plan is not a pro plan.
 * @param {FastifyRequest} req - the Fastify request object
 * @param {FastifyReply} _reply - the Fastify reply object (not used)
 */
export function requireProPlan(
  req: FastifyRequest,
  _reply: FastifyReply
): void {
  if (!req.plan?.isPro) {
    throw new ForbiddenError('Pro plan required');
  }
}
