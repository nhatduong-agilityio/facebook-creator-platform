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

import { createAnalyticsModule } from '@/modules/analytics/module';
import type { AnalyticsServicePort } from '@/modules/analytics/ports';
import type { BillingServicePort } from '@/modules/billing/ports';
import type { AuthServicePort } from '@/modules/auth/ports';
import { buildTestApp } from '@/__tests__/helpers/build-test-app';
import { makeUser } from '@/__tests__/helpers/fixtures';

describe('AnalyticsController e2e', () => {
  let app: FastifyInstance;
  let analyticsService: MockProxy<AnalyticsServicePort>;
  let billingService: MockProxy<BillingServicePort>;
  let authService: MockProxy<AuthServicePort>;

  beforeEach(async () => {
    analyticsService = mock<AnalyticsServicePort>();
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

    const controller = createAnalyticsModule(
      analyticsService,
      billingService,
      authService
    );
    app = await buildTestApp(fastify => {
      fastify.register(controller.routes.bind(controller), {
        prefix: '/api/v1/analytics'
      });
    });
  });

  afterEach(async () => {
    jest.clearAllMocks();
    await app.close();
  });

  it('returns analytics overview', async () => {
    analyticsService.getOverview.mockResolvedValue({
      totalPosts: 4,
      scheduledPosts: 1,
      publishedPosts: 2,
      totalLikes: 12,
      totalComments: 7,
      totalReach: 30,
      totalEngagement: 49
    });

    const response = await request(app.server).get(
      '/api/v1/analytics/overview'
    );

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      data: {
        totalPosts: 4,
        scheduledPosts: 1,
        publishedPosts: 2,
        totalLikes: 12,
        totalComments: 7,
        totalReach: 30,
        totalEngagement: 49
      }
    });
  });

  it('returns post analytics', async () => {
    analyticsService.getPostAnalytics.mockResolvedValue([
      {
        id: 'post-1',
        title: 'Launch Post',
        status: 'published',
        scheduledAt: null,
        publishedAt: new Date('2026-04-08T00:00:00.000Z'),
        facebookPostId: 'fb-post-1',
        metrics: {
          likes: 3,
          comments: 2,
          reach: 10,
          engagement: 15,
          fetchedAt: new Date('2026-04-08T00:00:00.000Z')
        }
      }
    ]);

    const response = await request(app.server).get('/api/v1/analytics/posts');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0]).toEqual(
      expect.objectContaining({
        id: 'post-1',
        title: 'Launch Post',
        facebookPostId: 'fb-post-1'
      })
    );
  });
});
