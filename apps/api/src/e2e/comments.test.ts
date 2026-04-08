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

import { createCommentsModule } from '@/modules/comments/module';
import type { CommentsServicePort } from '@/modules/comments/ports';
import type { AuthServicePort } from '@/modules/auth/ports';
import { buildTestApp } from '@/__tests__/helpers/build-test-app';
import { makeUser } from '@/__tests__/helpers/fixtures';

describe('CommentsController e2e', () => {
  let app: FastifyInstance;
  let commentsService: MockProxy<CommentsServicePort>;
  let authService: MockProxy<AuthServicePort>;

  beforeEach(async () => {
    commentsService = mock<CommentsServicePort>();
    authService = mock<AuthServicePort>();
    authService.getOrCreateUser.mockResolvedValue(makeUser());

    const controller = createCommentsModule(commentsService, authService);
    app = await buildTestApp(fastify => {
      fastify.register(controller.routes.bind(controller), {
        prefix: '/api/v1/comments'
      });
    });
  });

  afterEach(async () => {
    jest.clearAllMocks();
    await app.close();
  });

  it('replies to a post thread', async () => {
    commentsService.replyToPostThread.mockResolvedValue({
      postId: '74cb899d-7129-4e7d-a548-feb4ff6079f4',
      commentId: 'fb-comment-1'
    });

    const response = await request(app.server)
      .post('/api/v1/comments/reply')
      .send({
        postId: '74cb899d-7129-4e7d-a548-feb4ff6079f4',
        message: 'Thanks!'
      });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      data: {
        postId: '74cb899d-7129-4e7d-a548-feb4ff6079f4',
        commentId: 'fb-comment-1'
      }
    });
  });

  it('validates reply input', async () => {
    const response = await request(app.server)
      .post('/api/v1/comments/reply')
      .send({
        postId: 'not-a-uuid',
        message: ''
      });

    expect(response.status).toBe(400);
    expect(response.body.code).toBe('VALIDATION_ERROR');
  });
});
