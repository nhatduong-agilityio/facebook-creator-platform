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

import { createFacebookModule } from '@/modules/facebook/module';
import type { FacebookServicePort } from '@/modules/facebook/ports';
import type { AuthServicePort } from '@/modules/auth/ports';
import { buildTestApp } from '@/__tests__/helpers/build-test-app';
import { makeFacebookAccount, makeUser } from '@/__tests__/helpers/fixtures';

describe('FacebookController e2e', () => {
  let app: FastifyInstance;
  let facebookService: MockProxy<FacebookServicePort>;
  let authService: MockProxy<AuthServicePort>;

  beforeEach(async () => {
    facebookService = mock<FacebookServicePort>();
    authService = mock<AuthServicePort>();
    authService.getOrCreateUser.mockResolvedValue(makeUser());

    const controller = createFacebookModule(facebookService, authService);
    app = await buildTestApp(fastify => {
      fastify.register(controller.routes.bind(controller), {
        prefix: '/api/v1/facebook'
      });
    });
  });

  afterEach(async () => {
    jest.clearAllMocks();
    await app.close();
  });

  it('returns a connect URL', async () => {
    facebookService.buildConnectUrl.mockReturnValue(
      'https://facebook.test/connect'
    );

    const response = await request(app.server).get(
      '/api/v1/facebook/connect-url'
    );

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      data: { url: 'https://facebook.test/connect' }
    });
    expect(facebookService.buildConnectUrl).toHaveBeenCalledWith(
      'clerk-user-1'
    );
  });

  it('lists connected accounts', async () => {
    facebookService.listAccounts.mockResolvedValue([makeFacebookAccount()]);

    const response = await request(app.server).get('/api/v1/facebook/accounts');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0]).toEqual(
      expect.objectContaining({
        id: 'facebook-account-1',
        pageId: 'page-1',
        pageName: 'Page One'
      })
    );
  });

  it('connects an account from callback data', async () => {
    facebookService.connectAccount.mockResolvedValue(makeFacebookAccount());

    const response = await request(app.server)
      .post('/api/v1/facebook/callback')
      .send({ code: 'oauth-code', pageId: 'page-1' });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(facebookService.connectAccount).toHaveBeenCalledWith({
      userId: 'clerk-user-1',
      code: 'oauth-code',
      pageId: 'page-1'
    });
  });

  it('validates callback input', async () => {
    const response = await request(app.server)
      .post('/api/v1/facebook/callback')
      .send({ code: '' });

    expect(response.status).toBe(400);
    expect(response.body.code).toBe('VALIDATION_ERROR');
  });
});
