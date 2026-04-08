import { clerkAuthMiddleware } from '@/middlewares/clerk-auth';
import { verifyClerkSessionToken } from '@/modules/auth/lib/clerk';
import { UnauthorizedError } from '@/shared/errors/errors';
import type { verifyToken } from '@clerk/fastify';
import type { FastifyReply, FastifyRequest } from 'fastify';

jest.mock('@/modules/auth/lib/clerk', () => ({
  verifyClerkSessionToken: jest.fn()
}));

describe('clerkAuthMiddleware', () => {
  const mockedVerifyClerkSessionToken =
    verifyClerkSessionToken as jest.MockedFunction<
      typeof verifyClerkSessionToken
    >;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('rejects missing authorization headers', () => {
    const req = {
      headers: {},
      log: { warn: jest.fn() }
    };

    expect(() =>
      clerkAuthMiddleware(req as unknown as FastifyRequest, {} as FastifyReply)
    ).toThrow(UnauthorizedError);
  });

  it('rejects invalid authorization schemes', () => {
    const req = {
      headers: { authorization: 'Basic abc' },
      log: { warn: jest.fn() }
    };

    expect(() =>
      clerkAuthMiddleware(req as unknown as FastifyRequest, {} as FastifyReply)
    ).toThrow(UnauthorizedError);
  });

  it('attaches the Clerk user id on success', async () => {
    const req = {
      headers: { authorization: 'Bearer token-123' },
      log: { warn: jest.fn() },
      user: {
        id: 'clerk-user-1'
      }
    };
    mockedVerifyClerkSessionToken.mockResolvedValue({
      clerkUserId: 'clerk-user-1',
      sessionId: 'sess_1',
      payload: { sub: 'clerk-user-1' } as unknown as Awaited<
        ReturnType<typeof verifyToken>
      >
    });

    await clerkAuthMiddleware(
      req as unknown as FastifyRequest,
      {} as FastifyReply
    );

    expect(req.user).toEqual({ id: 'clerk-user-1' });
  });

  it('normalizes verification failures to unauthorized', async () => {
    const req = {
      headers: { authorization: 'Bearer token-123' },
      url: '/api/v1/posts',
      log: { warn: jest.fn() }
    };
    mockedVerifyClerkSessionToken.mockRejectedValue(new Error('bad token'));

    await expect(
      clerkAuthMiddleware(req as unknown as FastifyRequest, {} as FastifyReply)
    ).rejects.toBeInstanceOf(UnauthorizedError);
    expect(req.log.warn).toHaveBeenCalled();
  });
});
