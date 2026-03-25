import { closeDb } from '@/config/database';
import type { DataSource } from 'typeorm';

declare global {
  var __TEST_DB__: DataSource | undefined;
}

export default async function globalTeardown() {
  await closeDb(globalThis.__TEST_DB__);
  console.info('[E2E] Test database connection closed');
}
