import type { DataSource } from 'typeorm';
import { initializeDb } from '@/config/database';

// Attached to globalThis so global-teardown can access the same instance
declare global {
  var __TEST_DB__: DataSource | undefined;
}

export default async function globalSetup() {
  process.env.NODE_ENV = 'test';

  const dataSource = await initializeDb();
  await dataSource.runMigrations();

  // Expose to globalTeardown
  globalThis.__TEST_DB__ = dataSource;

  console.info('[E2E] Test database ready');
}
