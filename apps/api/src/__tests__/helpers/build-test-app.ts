import fastify, { type FastifyInstance } from 'fastify';

import { globalErrorHandler } from '@/shared/errors/error-handler';

export async function buildTestApp(
  registerRoutes: (app: FastifyInstance) => void
): Promise<FastifyInstance> {
  const app = fastify({ logger: false });

  app.setErrorHandler(globalErrorHandler);

  app.addContentTypeParser(
    'application/json',
    { parseAs: 'buffer' },
    (req, body: Buffer, done) => {
      req.rawBody = body;

      try {
        done(null, JSON.parse(body.toString()));
      } catch {
        done(new Error('Invalid JSON body'), undefined);
      }
    }
  );

  registerRoutes(app);
  await app.ready();

  return app;
}
