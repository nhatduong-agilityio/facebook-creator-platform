import type { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { ZodError } from 'zod';

import { AppError } from './errors';

export function globalErrorHandler(
  error: ZodError | FastifyError | Error,
  req: FastifyRequest,
  reply: FastifyReply
): FastifyReply {
  // 1. Zod validation errors → 400
  if (error instanceof ZodError) {
    return reply.status(400).send({
      statusCode: 400,
      code: 'VALIDATION_ERROR',
      message: 'Invalid input',
      errors: error.issues.map(e => ({
        field: e.path.join('.'),
        message: e.message
      }))
    });
  }

  // 2. Known domain errors → correct status code
  if (error instanceof AppError) {
    return reply.status(error.statusCode).send({
      statusCode: error.statusCode,
      code: error.code,
      message: error.message
    });
  }

  // 3. Unknown / unexpected → 500, log internally, safe message externally
  req.log.error(
    {
      err: {
        message: error.message,
        stack: error.stack,
        name: error.name
      },
      url: req.url,
      method: req.method
    },
    'Unhandled error'
  );

  return reply.status(500).send({
    statusCode: 500,
    code: 'INTERNAL_SERVER_ERROR',
    message: 'Something went wrong. Please try again.'
  });
}
