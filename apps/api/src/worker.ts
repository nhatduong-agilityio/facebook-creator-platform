import 'reflect-metadata';
import './load-env';
import type { DataSource } from 'typeorm';

import { closeDb, initializeDb } from './config/database';
import { startWorkers } from './modules/jobs/workers';
import { PlanRepository } from './modules/plans/repository';

async function bootstrapWorker(): Promise<void> {
  let dataSource: DataSource | undefined;
  let stopWorkers: (() => Promise<void>) | undefined;

  try {
    dataSource = await initializeDb();
    const planRepo = new PlanRepository(dataSource);
    await planRepo.ensureDefaults();
    stopWorkers = startWorkers(dataSource);
    console.info('[Worker] Job workers are running');
  } catch (error) {
    console.error('[Worker] Failed to start', error);
    process.exit(1);
  }

  const shutdown = async (signal: string): Promise<void> => {
    console.info(`\n[Worker] ${signal} received — shutting down...`);
    await stopWorkers?.();
    await closeDb(dataSource);
    console.info('[Worker] Shutdown complete');
    process.exit(0);
  };

  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
}

void bootstrapWorker();
