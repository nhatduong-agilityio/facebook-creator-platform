# Facebook Creator Platform

Backend-focused SaaS practice project for managing Facebook content, scheduling posts, collecting analytics, and enforcing Free / Pro subscriptions.

## Stack

- Monorepo: `pnpm` workspace
- API: Node.js, TypeScript, Fastify, TypeORM, PostgreSQL
- Jobs: BullMQ + Redis
- Auth: Clerk
- Billing: Stripe Checkout + webhooks
- Web: Next.js + React + Tailwind CSS

## Workspace

- `apps/api`: Fastify API, database entities, migrations, jobs, workers
- `apps/web`: Product-facing Next.js app shell

## API Modules

- `auth`: sync Clerk users into the local database
- `facebook`: build connect URL, exchange code, store page tokens
- `posts`: CRUD, manual publish, schedule publishing jobs
- `analytics`: overview metrics and post-level performance snapshots
- `billing`: plan lookup, Stripe Checkout session, webhook sync
- `jobs`: BullMQ queues, processors, and workers for publishing and metrics

## Core Data Model

- `users`
- `facebook_accounts`
- `posts`
- `post_metrics`
- `plans`
- `subscriptions`
- `audit_logs`

## Quick Start

1. Install dependencies:

```bash
pnpm install
```

2. Copy the API environment file:

```bash
cp apps/api/.env.example apps/api/.env
```

3. Copy the web environment file:

```bash
cp apps/web/.env.example apps/web/.env.local
```

4. Start infrastructure:

```bash
pnpm --dir apps/api docker compose up -d
```

5. Run migrations:

```bash
pnpm --filter api migration:run
```

6. Start the apps:

```bash
pnpm dev:api
pnpm dev:worker
pnpm dev:web
```

## Useful Commands

```bash
pnpm lint
pnpm test
pnpm build
pnpm --filter api migration:generate --name=YourMigrationName
pnpm --filter api migration:run
pnpm --filter api migration:revert
```

## API Prefix

All API routes are served under `/api/v1`.

Main groups:

- `/auth`
- `/facebook`
- `/posts`
- `/analytics`
- `/billing`

Swagger UI is available at `/docs`.

## Notes

- Redis is used for BullMQ only, not as an API cache.
- Plan enforcement stays basic for MVP:
  free users are limited by total posts and scheduled posts, while Pro is unlimited.
- Facebook and Stripe integrations are intentionally minimal and focused on the MVP flow.
- The web app runs on `http://localhost:3001` and acts as the Facebook OAuth callback surface.
- Set `FACEBOOK_REDIRECT_URI=http://localhost:3001/facebook/connect` in the API env.
