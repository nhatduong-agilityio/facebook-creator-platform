import 'reflect-metadata';
import './load-env';
import { buildApp } from './app';
import { closeDb, initializeDb } from './config/database';
import type { DataSource } from 'typeorm';
import { PlanRepository } from './modules/plans/repository';

/**
 * Application entry point.
 * Connects to the database, starts the HTTP server, and registers
 * signal handlers for graceful shutdown.
 */
async function bootstrap(): Promise<void> {
  const PORT = parseInt(process.env.PORT ?? '3000', 10);
  const HOST = process.env.HOST ?? '0.0.0.0';

  let dataSource: DataSource | undefined;

  try {
    dataSource = await initializeDb();
    const planRepo = new PlanRepository(dataSource);
    await planRepo.ensureDefaults();
  } catch (err) {
    console.error('[DB] Failed to connect. Exiting.', err);
    process.exit(1);
  }

  const app = buildApp(dataSource);

  try {
    await app.listen({ port: PORT, host: HOST });
    // Fastify logs the address automatically; this confirms bootstrap finished.
    console.info('[Server] Ready');
  } catch (err) {
    app.log.error(err, '[Server] Failed to start');
    await closeDb(dataSource);
    process.exit(1);
  }

  // 3. Graceful shutdown
  const shutdown = async (signal: string): Promise<void> => {
    console.info(`\n[Server] ${signal} received — shutting down...`);
    await app.close();
    await closeDb(dataSource);
    console.info('[Server] Shutdown complete');
    process.exit(0);
  };

  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
}

void bootstrap();
