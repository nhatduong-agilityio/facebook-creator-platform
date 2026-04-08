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

jest.mock('@/modules/posts/media-storage', () => ({
  readStoredMediaFileByName: jest.fn().mockResolvedValue({
    buffer: Buffer.from('test-media'),
    mimeType: 'image/png'
  })
}));

import { createPostModule } from '@/modules/posts/module';
import type { PostServicePort } from '@/modules/posts/ports';
import type { BillingServicePort } from '@/modules/billing/ports';
import type { AuthServicePort } from '@/modules/auth/ports';
import { buildTestApp } from '@/__tests__/helpers/build-test-app';
import { makePost, makeUser } from '@/__tests__/helpers/fixtures';

describe('PostController e2e', () => {
  let app: FastifyInstance;
  let postService: MockProxy<PostServicePort>;
  let billingService: MockProxy<BillingServicePort>;
  let authService: MockProxy<AuthServicePort>;

  beforeEach(async () => {
    postService = mock<PostServicePort>();
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

    const controller = createPostModule(
      postService,
      billingService,
      authService
    );
    app = await buildTestApp(fastify => {
      fastify.register(controller.routes.bind(controller), {
        prefix: '/api/v1/posts'
      });
    });
  });

  afterEach(async () => {
    jest.clearAllMocks();
    await app.close();
  });

  it('lists posts', async () => {
    postService.listPosts.mockResolvedValue([makePost()]);

    const response = await request(app.server).get('/api/v1/posts');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveLength(1);
    expect(postService.listPosts).toHaveBeenCalledWith('clerk-user-1');
  });

  it('serves stored media', async () => {
    const response = await request(app.server).get(
      '/api/v1/posts/media/test-file.png'
    );

    expect(response.status).toBe(200);
    expect(response.header['content-type']).toContain('image/png');
  });

  it('creates a post', async () => {
    postService.createPost.mockResolvedValue(makePost());

    const response = await request(app.server)
      .post('/api/v1/posts')
      .send({ title: 'Launch', content: 'Hello world' });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(postService.createPost).toHaveBeenCalledWith(
      'clerk-user-1',
      { title: 'Launch', content: 'Hello world' },
      expect.objectContaining({ code: 'free' })
    );
  });

  it('updates a post', async () => {
    postService.updatePost.mockResolvedValue(
      makePost({ title: 'Updated title' })
    );

    const response = await request(app.server)
      .put('/api/v1/posts/74cb899d-7129-4e7d-a548-feb4ff6079f4')
      .send({ title: 'Updated title' });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(postService.updatePost).toHaveBeenCalledWith(
      'clerk-user-1',
      '74cb899d-7129-4e7d-a548-feb4ff6079f4',
      { title: 'Updated title' }
    );
  });

  it('deletes a post', async () => {
    const response = await request(app.server).delete(
      '/api/v1/posts/74cb899d-7129-4e7d-a548-feb4ff6079f4'
    );

    expect(response.status).toBe(204);
    expect(postService.deletePost).toHaveBeenCalledWith(
      'clerk-user-1',
      '74cb899d-7129-4e7d-a548-feb4ff6079f4'
    );
  });

  it('publishes a post immediately', async () => {
    postService.publishPostNow.mockResolvedValue(
      makePost({ status: 'published', facebookPostId: 'fb-post-1' })
    );

    const response = await request(app.server)
      .post('/api/v1/posts/74cb899d-7129-4e7d-a548-feb4ff6079f4/publish')
      .send({});

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(postService.publishPostNow).toHaveBeenCalledWith(
      'clerk-user-1',
      '74cb899d-7129-4e7d-a548-feb4ff6079f4'
    );
  });

  it('schedules a post', async () => {
    postService.schedulePost.mockResolvedValue(
      makePost({
        status: 'scheduled',
        scheduledAt: new Date('2026-04-10T09:00:00.000Z')
      })
    );

    const response = await request(app.server)
      .post('/api/v1/posts/74cb899d-7129-4e7d-a548-feb4ff6079f4/schedule')
      .send({ scheduledAt: '2026-04-10T09:00:00.000Z' });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(postService.schedulePost).toHaveBeenCalledWith(
      'clerk-user-1',
      '74cb899d-7129-4e7d-a548-feb4ff6079f4',
      new Date('2026-04-10T09:00:00.000Z'),
      expect.objectContaining({ code: 'free' })
    );
  });

  it('validates create input', async () => {
    const response = await request(app.server)
      .post('/api/v1/posts')
      .send({ content: '' });

    expect(response.status).toBe(400);
    expect(response.body.code).toBe('VALIDATION_ERROR');
  });
});
