import type { PostMetricEntity } from '@/modules/analytics/entity';
import type { FacebookAccountEntity } from '@/modules/facebook/entity';
import type { PlanEntity } from '@/modules/plans/entity';
import type { PostEntity } from '@/modules/posts/entity';
import type { SubscriptionEntity } from '@/modules/subscriptions/entity';
import type { UserEntity } from '@/modules/users/entity';
import { PLAN_CODES } from '@/shared/constants/billing';
import { POST_STATUSES } from '@/shared/constants/post';
import { SUBSCRIPTION_STATUSES } from '@/shared/constants/subscription';

export function makeUser(overrides: Partial<UserEntity> = {}): UserEntity {
  return {
    id: 'user-internal-1',
    clerkUserId: 'clerk-user-1',
    email: 'user@example.com',
    name: 'Test User',
    stripeCustomerId: null,
    createdAt: new Date('2026-04-08T00:00:00.000Z'),
    updatedAt: new Date('2026-04-08T00:00:00.000Z'),
    ...overrides
  };
}

export function makeFacebookAccount(
  overrides: Partial<FacebookAccountEntity> = {}
): FacebookAccountEntity {
  return {
    id: 'facebook-account-1',
    userId: 'user-internal-1',
    facebookUserId: 'facebook-user-1',
    pageId: 'page-1',
    pageName: 'Page One',
    accessToken: 'page-token',
    tokenExpiresAt: new Date('2026-12-31T00:00:00.000Z'),
    createdAt: new Date('2026-04-08T00:00:00.000Z'),
    updatedAt: new Date('2026-04-08T00:00:00.000Z'),
    ...overrides
  };
}

export function makePost(overrides: Partial<PostEntity> = {}): PostEntity {
  return {
    id: 'post-1',
    userId: 'user-internal-1',
    facebookAccountId: 'facebook-account-1',
    title: 'Launch Post',
    content: 'Ship it.',
    mediaUrl: null,
    status: POST_STATUSES[0],
    scheduledAt: null,
    publishedAt: null,
    facebookPostId: null,
    lastError: null,
    createdAt: new Date('2026-04-08T00:00:00.000Z'),
    updatedAt: new Date('2026-04-08T00:00:00.000Z'),
    ...overrides
  };
}

export function makeMetric(
  overrides: Partial<PostMetricEntity> = {}
): PostMetricEntity {
  return {
    id: 'metric-1',
    postId: 'post-1',
    likes: 3,
    comments: 2,
    reach: 20,
    engagement: 25,
    fetchedAt: new Date('2026-04-08T00:00:00.000Z'),
    createdAt: new Date('2026-04-08T00:00:00.000Z'),
    ...overrides
  };
}

export function makePlan(overrides: Partial<PlanEntity> = {}): PlanEntity {
  return {
    id: 'plan-free-1',
    code: PLAN_CODES.FREE,
    name: 'Free',
    description: 'Free plan',
    monthlyPrice: 0,
    postLimit: 10,
    scheduledLimit: 3,
    createdAt: new Date('2026-04-08T00:00:00.000Z'),
    updatedAt: new Date('2026-04-08T00:00:00.000Z'),
    ...overrides
  };
}

export function makeSubscription(
  overrides: Partial<SubscriptionEntity> = {}
): SubscriptionEntity {
  return {
    id: 'subscription-1',
    userId: 'user-internal-1',
    planId: 'plan-free-1',
    stripeSubscriptionId: null,
    stripeCustomerId: null,
    status: SUBSCRIPTION_STATUSES[2],
    currentPeriodEnd: null,
    createdAt: new Date('2026-04-08T00:00:00.000Z'),
    updatedAt: new Date('2026-04-08T00:00:00.000Z'),
    ...overrides
  };
}
