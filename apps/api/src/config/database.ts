import 'reflect-metadata';
import path from 'path';
import { DataSource } from 'typeorm';
import { UserEntity } from '@/modules/users/entity';
import { FacebookAccountEntity } from '@/modules/facebook/entity';
import { PostEntity } from '@/modules/posts/entity';
import { AuditLogEntity } from '@/modules/audit-logs/entity';
import { PostMetricEntity } from '@/modules/analytics/entity';

// Add new entities here as modules are built.
// Explicit imports are preferred over glob patterns —
// glob strings break when compiled to dist/ with different paths.
//
// import { UserEntity }            from '../modules/users/entities/user.entity';
// import { FacebookAccountEntity } from '../modules/facebook/entities/facebook-account.entity';
// import { PostEntity }            from '../modules/posts/entities/post.entity';
// import { PostMetricEntity }      from '../modules/analytics/entities/post-metric.entity';
// import { PlanEntity }            from '../modules/billing/entities/plan.entity';
// import { SubscriptionEntity }    from '../modules/billing/entities/subscription.entity';
// import { AuditLogEntity }        from '../modules/audit/entities/audit-log.entity';

// Single source of truth for the DB connection.
// Passed into repositories via constructor (DI — no global access).

/**
 * Creates a new DataSource instance configured for PostgreSQL.
 *
 * Environment variables:
 *   DATABASE_URL      — postgres connection string (dev/prod)
 *   DATABASE_URL_TEST — separate test database (used when NODE_ENV=test)
 *
 * @returns A new (not yet initialized) DataSource instance.
 */
export function createDataSource(): DataSource {
  const isTest = process.env.NODE_ENV === 'test';
  const isProd = process.env.NODE_ENV === 'production';

  const connectionUrl = isTest
    ? process.env.DATABASE_URL_TEST
    : process.env.DATABASE_URL;

  if (!connectionUrl) {
    throw new Error(
      isTest
        ? 'DATABASE_URL_TEST is not set. Check your .env.test file.'
        : 'DATABASE_URL is not set. Check your .env file.'
    );
  }

  return new DataSource({
    type: 'postgres',
    url: connectionUrl,

    // Entities: explicit array — traceable imports, no glob surprises.
    // Uncomment each entity as you build its module.
    entities: [
      UserEntity,
      FacebookAccountEntity,
      PostEntity,
      PostMetricEntity,
      // PlanEntity,
      // SubscriptionEntity,
      AuditLogEntity
    ],

    // synchronize: auto-creates/alters tables to match entities.
    // Safe for development ONLY — always use migrations in production.
    synchronize: !isProd && !isTest,

    // In production and test environments, run migrations explicitly.
    migrations: [path.join(__dirname, '../migrations/*{.ts,.js}')],
    migrationsRun: false,

    // SSL: required for most hosted PostgreSQL providers (Railway, Supabase, RDS).
    ssl: isProd ? { rejectUnauthorized: false } : false,

    logging: process.env.NODE_ENV === 'development'
  });
}

/**
 * Initializes the database connection.
 * Call once at application startup before registering routes.
 *
 * @returns A promise resolving to the initialized DataSource.
 */
export async function initializeDb(): Promise<DataSource> {
  const dataSource = createDataSource();
  await dataSource.initialize();
  console.info(
    `[DB] PostgreSQL connected → ${dataSource.options.database as string}`
  );
  return dataSource;
}

/**
 * Closes the database connection gracefully.
 * Safe to call even if the connection was never initialized.
 *
 * @param dataSource - The DataSource to close. No-op if undefined or not initialized.
 */
export async function closeDb(dataSource?: DataSource): Promise<void> {
  if (dataSource?.isInitialized) {
    await dataSource.destroy();
    console.info('[DB] Connection closed.');
  }
}
