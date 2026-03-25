import { type ZodError, z } from 'zod';

import { globalErrorHandler } from '@/shared/error-handler';
import {
  AppError,
  NotFoundError,
  ForbiddenError,
  UnauthorizedError,
  ConflictError,
  ValidationError,
  ExternalServiceError
} from '@/shared/errors';
import type { FastifyReply, FastifyRequest } from 'fastify';

const makeReply = () => {
  const reply = {
    _status: 0,
    _body: {},
    status(code: number) {
      this._status = code;
      return this;
    },
    send(body: {
      statusCode: number;
      code: string;
      message: string;
      errors: { field: string; message: string }[];
    }) {
      this._body = body;
      return this;
    }
  };
  return reply as unknown as FastifyReply & {
    _status: number;
    _body: {
      statusCode: number;
      code: string;
      message: string;
      errors: { field: string; message: string }[];
    };
  };
};

const makeReq = () =>
  ({
    url: '/test',
    method: 'GET',
    log: { error: jest.fn() }
  }) as unknown as FastifyRequest;

// ── Tests ──────────────────────────────────────────────────

describe('globalErrorHandler', () => {
  describe('ZodError → 400 VALIDATION_ERROR', () => {
    it('returns 400 with errors array', () => {
      const schema = z.object({ name: z.string().min(1) });
      let zodError: ZodError;
      try {
        schema.parse({ name: '' });
      } catch (e) {
        zodError = e as ZodError;
      }

      const reply = makeReply();
      globalErrorHandler(zodError!, makeReq(), reply);

      expect(reply._status).toBe(400);
      expect(reply._body.code).toBe('VALIDATION_ERROR');
      expect(reply._body.errors).toBeInstanceOf(Array);
      expect(reply._body.errors[0].field).toBe('name');
    });
  });

  describe('AppError subclasses → correct status codes', () => {
    const cases: [AppError, number, string][] = [
      [new NotFoundError(), 404, 'NOT_FOUND'],
      [new ForbiddenError(), 403, 'FORBIDDEN'],
      [new UnauthorizedError(), 401, 'UNAUTHORIZED'],
      [new ValidationError('bad'), 400, 'VALIDATION_ERROR'],
      [new ConflictError('conflict'), 409, 'CONFLICT'],
      [new ExternalServiceError('fb'), 502, 'EXTERNAL_SERVICE_ERROR']
    ];

    it.each(cases)('%s → %i %s', (error, expectedStatus, expectedCode) => {
      const reply = makeReply();
      globalErrorHandler(error, makeReq(), reply);

      expect(reply._status).toBe(expectedStatus);
      expect(reply._body.code).toBe(expectedCode);
      expect(reply._body.statusCode).toBe(expectedStatus);
      expect(typeof reply._body.message).toBe('string');
    });
  });

  describe('Unknown Error → 500 INTERNAL_SERVER_ERROR', () => {
    it('returns 500 and does not expose internal details', () => {
      const error = new Error('DB connection string: postgres://secret@host');
      const req = makeReq();
      const reply = makeReply();

      globalErrorHandler(error, req, reply);

      expect(reply._status).toBe(500);
      expect(reply._body.code).toBe('INTERNAL_SERVER_ERROR');
      // Must NOT expose the real error message
      expect(reply._body.message).not.toContain('postgres://');
      expect(reply._body.message).not.toContain('secret');
      // Must log the real error internally
      expect(req.log.error).toHaveBeenCalledTimes(1);
    });
  });

  describe('AppError instanceof check', () => {
    it('subclasses are instances of AppError', () => {
      expect(new NotFoundError()).toBeInstanceOf(AppError);
      expect(new ForbiddenError()).toBeInstanceOf(AppError);
      expect(new UnauthorizedError()).toBeInstanceOf(AppError);
    });
  });
});
