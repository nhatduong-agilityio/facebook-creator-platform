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

import { createAuthModule } from '@/modules/auth/module';
import type {
  AuthServicePort,
  ClerkWebhookVerifierPort
} from '@/modules/auth/ports';
import { clerkAuthMiddleware } from '@/middlewares/clerk-auth';
import { buildTestApp } from '@/__tests__/helpers/build-test-app';
import { makeUser } from '@/__tests__/helpers/fixtures';

describe('AuthController e2e', () => {
  let app: FastifyInstance;
  let authService: MockProxy<AuthServicePort>;
  let webhookVerifier: MockProxy<ClerkWebhookVerifierPort>;

  beforeEach(async () => {
    authService = mock<AuthServicePort>();
    webhookVerifier = mock<ClerkWebhookVerifierPort>();
    authService.getOrCreateUser.mockResolvedValue(makeUser());

    const controller = createAuthModule(authService, webhookVerifier);

    app = await buildTestApp(fastify => {
      fastify.register(controller.routes.bind(controller), {
        prefix: '/api/v1/auth'
      });
    });
  });

  afterEach(async () => {
    jest.clearAllMocks();
    await app.close();
  });

  it('returns the authenticated session', async () => {
    const response = await request(app.server).get('/api/v1/auth/session');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      data: expect.objectContaining({
        id: 'user-internal-1',
        clerkUserId: 'clerk-user-1',
        email: 'user@example.com',
        name: 'Test User'
      })
    });
    expect(authService.getOrCreateUser).toHaveBeenCalledWith('clerk-user-1');
  });

  it('handles Clerk webhooks', async () => {
    webhookVerifier.verifyWebhook.mockResolvedValue({
      type: 'user.updated',
      data: {
        id: 'clerk-user-1',
        email: 'user@example.com',
        firstName: 'Test',
        lastName: 'User'
      }
    });
    authService.syncClerkWebhook.mockResolvedValue(makeUser());

    const response = await request(app.server)
      .post('/api/v1/auth/webhooks/clerk')
      .send({ anything: true });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      data: { type: 'user.updated' }
    });
    expect(authService.syncClerkWebhook).toHaveBeenCalled();
  });

  it('returns a validation error for invalid webhook signature', async () => {
    webhookVerifier.verifyWebhook.mockRejectedValue(new Error('bad signature'));

    const response = await request(app.server)
      .post('/api/v1/auth/webhooks/clerk')
      .send({ anything: true });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      statusCode: 400,
      code: 'VALIDATION_ERROR',
      message: 'Invalid Clerk webhook signature'
    });
  });

  it('relies on Clerk auth for protected routes', async () => {
    const mockedClerkAuth = clerkAuthMiddleware as jest.MockedFunction<
      typeof clerkAuthMiddleware
    >;

    mockedClerkAuth.mockImplementationOnce(async () => {
      await new Promise(_resolve => {
        throw new Error('missing auth');
      });
    });

    const response = await request(app.server).get('/api/v1/auth/me');

    expect(response.status).toBe(500);
  });
});
