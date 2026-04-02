// Shared
import { BaseService } from '@/shared/service';
import { SUBSCRIPTION_STATUSES } from '@/shared/constants/subscription';
import { PLAN_CODES } from '@/shared/constants/billing';

// Types
import type {
  BillingServicePort,
  StripeBillingProviderPort,
  StripeSubscriptionProviderStatus,
  StripeSubscriptionSnapshot
} from '../ports';
import type { UserStripeBillingPort } from '@/modules/users/ports';
import type { PlanRepositoryPort } from '@/modules/plans/ports';
import type { SubscriptionRepositoryPort } from '@/modules/subscriptions/ports';
import type { AuditLogWriterPort } from '@/modules/audit-logs/ports';
import type { UserEntity } from '@/modules/users/entity';
import {
  ConflictError,
  NotFoundError,
  ValidationError
} from '@/shared/errors/errors';
import type { SubscriptionEntity } from '@/modules/subscriptions/entity';
import type { SubscriptionStatus } from '@/shared/types/subscription';
import type {
  BillingCheckoutSessionDto,
  BillingPlanContext,
  BillingSubscriptionSummaryDto
} from '../contracts';

export class BillingService extends BaseService implements BillingServicePort {
  constructor(
    private readonly userRepo: UserStripeBillingPort,
    private readonly planRepo: PlanRepositoryPort,
    private readonly subscriptionRepo: SubscriptionRepositoryPort,
    private readonly auditLogRepo: AuditLogWriterPort,
    private readonly stripeProvider: StripeBillingProviderPort
  ) {
    super();
  }

  /**
   * Retrieves the billing plan context for a user.
   * The billing plan context is a summary of the user's current subscription plan.
   * @param {string} userId - the user ID to retrieve the billing plan context for
   * @returns {Promise<BillingPlanContext>} - a promise that resolves to the billing plan context
   */
  async getUserPlanContext(userId: string): Promise<BillingPlanContext> {
    const user = await this.requireUser(userId);
    return this.getUserPlanContextForUser(user);
  }

  /**
   * Retrieves the billing plan context for a user entity.
   * The billing plan context is a summary of the user's current subscription plan.
   * @param {UserEntity} user - the user entity to retrieve the billing plan context for
   * @returns {Promise<BillingPlanContext>} - a promise that resolves to the billing plan context
   */
  async getUserPlanContextForUser(
    user: UserEntity
  ): Promise<BillingPlanContext> {
    const subscription = await this.getResolvedSubscription(user.id);
    return await this.buildPlanContext(subscription);
  }

  /**
   * Retrieves a summary of the user's current subscription plan.
   * The summary includes the billing plan code, name, post limit, scheduled limit, status, and current period end date.
   * @param {string} userId - the user ID to retrieve the subscription summary for
   * @returns {Promise<BillingSubscriptionSummaryDto>} - a promise that resolves to the subscription summary
   */
  async getSubscriptionSummary(
    userId: string
  ): Promise<BillingSubscriptionSummaryDto> {
    const user = await this.requireUser(userId);
    return await this.getSubscriptionSummaryForUser(user);
  }

  /**
   * Retrieves a summary of the user's current subscription plan.
   * @param {UserEntity} user - the user entity to retrieve the subscription summary for
   * @returns {Promise<BillingSubscriptionSummaryDto>} - a promise that resolves to the subscription summary
   */
  async getSubscriptionSummaryForUser(
    user: UserEntity
  ): Promise<BillingSubscriptionSummaryDto> {
    const subscription = await this.getResolvedSubscription(user.id);
    const plan = await this.buildPlanContext(subscription);

    return {
      plan,
      stripeSubscriptionId: subscription.stripeSubscriptionId
    };
  }

  /**
   * Creates a new Stripe checkout session for the user to upgrade to the Pro plan.
   * If the user is already on the Pro plan, a ConflictError is thrown.
   * @param {Object} input - the input object with userId, successUrl, and cancelUrl
   * @param {string} input.userId - the user ID to create the checkout session for
   * @param {string} input.successUrl - the URL to redirect the user to after a successful checkout
   * @param {string} input.cancelUrl - the URL to redirect the user to after a cancelled checkout
   * @returns {Promise<BillingCheckoutSessionDto>} - a promise that resolves to an object with the checkout URL and session ID
   * @throws {ConflictError} - if the user is already on the Pro plan
   */
  async createCheckoutSession(input: {
    userId: string;
    successUrl: string;
    cancelUrl: string;
  }): Promise<BillingCheckoutSessionDto> {
    const proPriceId = process.env.STRIPE_PRO_PRICE_ID;

    if (!proPriceId) {
      throw new ValidationError('Missing Stripe PRO price ID');
    }

    const dbUser = await this.requireUser(input.userId);
    const currentPlan = await this.getUserPlanContextForUser(dbUser);

    if (
      currentPlan.isPro &&
      (currentPlan.status === SUBSCRIPTION_STATUSES[2] ||
        currentPlan.status === SUBSCRIPTION_STATUSES[1])
    ) {
      throw new ConflictError('User is already on the Pro plan');
    }

    let stripeCustomerId = dbUser.stripeCustomerId;

    if (!stripeCustomerId) {
      const customer = await this.stripeProvider.createCustomer({
        email: dbUser.email,
        name: dbUser.name,
        userId: dbUser.id
      });

      stripeCustomerId = customer.customerId;
      await this.userRepo.updateStripeCustomerId(
        dbUser.id,
        customer.customerId
      );
    }

    const session = await this.stripeProvider.createCheckoutSession({
      customerId: stripeCustomerId,
      priceId: proPriceId,
      successUrl: input.successUrl,
      cancelUrl: input.cancelUrl,
      userId: dbUser.id
    });

    if (!session.checkoutUrl) {
      throw new ValidationError('Stripe checkout URL was not returned');
    }

    await this.auditLogRepo.createEntry({
      userId: dbUser.id,
      action: 'billing.checkout.created',
      entityType: 'subscription',
      entityId: session.subscriptionId,
      metadata: {
        sessionId: session.sessionId,
        planCode: PLAN_CODES.PRO
      }
    });

    return {
      checkoutUrl: session.checkoutUrl,
      sessionId: session.sessionId
    };
  }

  async handleWebhook(signature: string, rawBody: Buffer): Promise<string> {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      throw new ValidationError('Missing Stripe webhook secret');
    }

    const event = this.stripeProvider.constructWebhookEvent(
      signature,
      rawBody,
      webhookSecret
    );

    switch (event.type) {
      case 'checkout.session.completed':
        if (event.data?.subscriptionId) {
          await this.syncStripeSubscriptionById(
            event.data.subscriptionId,
            event.data.userId
          );
        }
        break;
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        if (event.data) {
          await this.syncStripeSubscription(event.data);
        }
        break;
      default:
        break;
    }

    return event.type;
  }

  private async syncStripeSubscriptionById(
    stripeSubscriptionId: string,
    userId?: string
  ): Promise<void> {
    const subscription =
      await this.stripeProvider.retrieveSubscription(stripeSubscriptionId);

    await this.syncStripeSubscription(subscription, userId);
  }

  private async syncStripeSubscription(
    subscription: StripeSubscriptionSnapshot,
    fallbackUserId?: string
  ): Promise<void> {
    const user = await this.resolveUserForSubscription(
      subscription,
      fallbackUserId
    );
    const proPlan = await this.planRepo.getProPlan();
    const existing = await this.subscriptionRepo.findByStripeSubscriptionId(
      subscription.id
    );

    await this.subscriptionRepo.saveSubscription({
      id: existing?.id,
      userId: user.id,
      planId: proPlan.id,
      stripeSubscriptionId: subscription.id,
      stripeCustomerId: subscription.customerId,
      status: this.mapStripeStatus(subscription.status),
      currentPeriodEnd: this.resolveCurrentPeriodEnd(subscription)
    });

    await this.auditLogRepo.createEntry({
      userId: user.id,
      action: 'billing.subscription.synced',
      entityType: 'subscription',
      entityId: subscription.id,
      metadata: {
        planCode: subscription.status
      }
    });
  }

  /**
   * Resolves a user entity for a given Stripe subscription snapshot.
   * If a fallback user ID is provided, it will first attempt to find a user by that ID.
   * If no user is found by the fallback ID, it will then attempt to find a user by the Stripe customer ID.
   * If no user is found, a NotFoundError will be thrown.
   * @param {StripeSubscriptionSnapshot} subscription - the Stripe subscription snapshot to resolve a user for
   * @param {string | null | undefined} fallbackUserId - the fallback user ID to attempt to find a user by (optional)
   * @returns {Promise<UserEntity>} - a promise that resolves to the resolved user entity
   * @throws {NotFoundError} - if the user was not found
   */
  private async resolveUserForSubscription(
    subscription: StripeSubscriptionSnapshot,
    fallbackUserId?: string
  ): Promise<UserEntity> {
    if (fallbackUserId) {
      const user = await this.userRepo.findById(fallbackUserId);

      if (user) {
        return user;
      }
    }

    const user = await this.userRepo.findByStripeCustomerId(
      subscription.customerId
    );

    if (!user) {
      throw new NotFoundError(
        `No user is linked to Stripe customer ID ${subscription.customerId}`
      );
    }

    return user;
  }

  /**
   * Maps a Stripe subscription status to a SubscriptionStatus.
   *
   * The mapping is as follows:
   * - 'active' and 'trialing' map to themselves
   * - 'past_due', 'canceled', 'unpaid', and 'incomplete' map to themselves
   * - 'incomplete_expired' and 'paused' map to 'inactive'
   * - any other status maps to 'inactive'
   * @param {StripeSubscriptionProviderStatus} status - the Stripe subscription status to map
   * @returns {SubscriptionStatus} - the mapped SubscriptionStatus
   */
  private mapStripeStatus(
    status: StripeSubscriptionProviderStatus
  ): SubscriptionStatus {
    switch (status) {
      case 'active':
      case 'trialing':
      case 'past_due':
      case 'canceled':
      case 'unpaid':
      case 'incomplete':
        return status;
      case 'incomplete_expired':
      case 'paused':
        return SUBSCRIPTION_STATUSES[0];
      default:
        return SUBSCRIPTION_STATUSES[0];
    }
  }

  /**
   * Resolves the current period end date for a given Stripe subscription snapshot.
   * If the subscription snapshot contains no current period end timestamps, null is returned.
   * Otherwise, the maximum timestamp is resolved to a Date object.
   * @param {StripeSubscriptionSnapshot} subscription - the Stripe subscription snapshot to resolve the current period end date for
   * @returns {Date | null} - the resolved current period end date or null if no timestamps are provided
   */
  private resolveCurrentPeriodEnd(
    subscription: StripeSubscriptionSnapshot
  ): Date | null {
    if (subscription.currentPeriodEndTimestamp.length === 0) {
      return null;
    }

    return new Date(Math.max(...subscription.currentPeriodEndTimestamp) * 1000);
  }

  /**
   * Builds a BillingPlanContext object from a SubscriptionEntity.
   * @param {SubscriptionEntity} subscription - the subscription entity
   * @returns {Promise<BillingPlanContext>} - a promise that resolves to the built BillingPlanContext object
   * @throws {NotFoundError} - if the plan is not found for the subscription
   */
  private async buildPlanContext(
    subscription: SubscriptionEntity
  ): Promise<BillingPlanContext> {
    const plan = await this.planRepo.findById(subscription.planId);

    if (!plan) {
      throw new NotFoundError('Plan not found for subscription');
    }

    return {
      code: plan.code,
      name: plan.name,
      isPro: plan.code === PLAN_CODES.PRO,
      postLimit: plan.postLimit,
      scheduledLimit: plan.scheduledLimit,
      status: subscription.status,
      currentPeriodEnd: subscription.currentPeriodEnd
    };
  }

  /**
   * Gets the resolved subscription for a user.
   * A resolved subscription is a subscription that is either active or free.
   * If the user does not have a current subscription, a free subscription will be created and returned.
   * If the user has a current subscription that is not active, a free subscription will be created and returned.
   * If the user has a current subscription that is active, it will be returned.
   * @param {string} userId - the user ID
   * @returns {Promise<SubscriptionEntity>} - a promise that resolves to the resolved subscription
   */
  private async getResolvedSubscription(
    userId: string
  ): Promise<SubscriptionEntity> {
    await this.planRepo.ensureDefaults();

    const currentSubscription =
      await this.subscriptionRepo.findCurrentByUserId(userId);

    if (!currentSubscription) {
      return await this.ensureFreeSubscription(userId);
    }

    if (this.isActiveStatus(currentSubscription.status)) {
      return currentSubscription;
    }

    return await this.ensureFreeSubscription(userId);
  }

  /**
   * Ensures that a user has a free subscription.
   * If the user already has a free subscription, it will be updated to an active status.
   * If the user does not have a free subscription, a new free subscription will be created.
   * @param {string} userId - the user ID
   * @returns {Promise<SubscriptionEntity>} - a promise that resolves to the ensured free subscription
   */
  private async ensureFreeSubscription(
    userId: string
  ): Promise<SubscriptionEntity> {
    const freePlan = await this.planRepo.getFreePlan();
    const currentSubscription =
      await this.subscriptionRepo.findCurrentByUserId(userId);

    if (currentSubscription?.planId === freePlan.id) {
      currentSubscription.status = SUBSCRIPTION_STATUSES[2];
      currentSubscription.currentPeriodEnd = null;
      return await this.subscriptionRepo.saveSubscription(currentSubscription);
    }

    return await this.subscriptionRepo.saveSubscription({
      userId,
      planId: freePlan.id,
      status: SUBSCRIPTION_STATUSES[2],
      currentPeriodEnd: null,
      stripeSubscriptionId: null,
      stripeCustomerId: null
    });
  }

  /**
   * Checks if a subscription status is active or trialing.
   * @param {SubscriptionStatus} status - the subscription status to check
   * @returns {status is 'active' | 'trialing'} - true if the status is active or trialing, false otherwise
   */
  private isActiveStatus(
    status: SubscriptionStatus
  ): status is 'active' | 'trialing' {
    return (
      status === SUBSCRIPTION_STATUSES[2] || status === SUBSCRIPTION_STATUSES[1]
    );
  }

  /**
   * Finds a user by their Clerk user ID and throws a NotFoundError if not found.
   * Used internally to validate that a user profile exists before continuing.
   * @param {string} clerkUserId - the Clerk user ID to find a user for
   * @returns {Promise<UserEntity>} - a promise that resolves to a user entity if found, otherwise throws a ValidationError
   * @throws {NotFoundError} - if the user was not found
   */
  private async requireUser(clerkUserId: string): Promise<UserEntity> {
    const user = await this.userRepo.findByClerkId(clerkUserId);

    if (!user) {
      throw new NotFoundError('User not found');
    }

    return user;
  }
}
