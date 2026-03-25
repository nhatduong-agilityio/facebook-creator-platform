import { buildApp } from '@/app';
import type { FastifyInstance } from 'fastify';

let app: FastifyInstance;

export async function getTestApp(): Promise<FastifyInstance> {
  if (!app) {
    app = buildApp({ logger: false });
    await app.ready();
  }
  return app;
}

export async function closeTestApp(): Promise<void> {
  if (app) {
    await app.close();
  }
}
