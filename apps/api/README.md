# API (Fastify)

A REST API for the Facebook Creator Platform — content management, Facebook connect, scheduling/jobs, analytics, and billing.

Built with **TypeScript 5**, **Fastify 5**, **PostgreSQL** via **TypeORM**, validated by **Zod** — managed by **pnpm**.

---

## Table of Contents

- [API (Fastify)](#api-fastify)
  - [Table of Contents](#table-of-contents)
  - [Features](#features)
  - [Project Structure](#project-structure)
  - [Requirements](#requirements)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
  - [API Reference](#api-reference)
  - [Jobs / Workers](#jobs--workers)
  - [Database \& Migrations](#database--migrations)
  - [Testing](#testing)

---

## Features

| Area      | Description                                                         |
| --------- | ------------------------------------------------------------------- |
| Auth      | Clerk integration (bearer JWT), `/api/v1/auth/*`                    |
| Facebook  | Connect URL, account storage, Graph API calls, `/api/v1/facebook/*` |
| Posts     | CRUD + publish + schedule + media upload routes, `/api/v1/posts/*`  |
| Analytics | Overview + post metrics snapshots, `/api/v1/analytics/*`            |
| Comments  | Reply workflow, `/api/v1/comments/*`                                |
| Billing   | Stripe Checkout + webhooks, `/api/v1/billing/*`                     |
| Docs      | Swagger UI at `/docs`                                               |
| Jobs      | BullMQ workers (publishing, metrics, etc.)                          |

---

## Project Structure

```text
apps/api/
├── docker/
│   └── init/                 # init scripts (dev containers)
├── src/
│   ├── main.ts               # HTTP server entry point (connect DB, start API)
│   ├── worker.ts             # Worker entry point (BullMQ processors)
│   ├── app.ts                # Fastify app builder (plugins, Swagger, route modules)
│   ├── load-env.ts           # Loads env (tries apps/api/.env + fallbacks)
│   │
│   ├── config/
│   │   ├── database.ts       # TypeORM DataSource (Postgres) + init/close
│   │   ├── redis.ts          # Redis connection config for BullMQ
│   │   └── stripe.ts         # Stripe configuration helpers
│   │
│   ├── middlewares/          # Cross-cutting request concerns
│   │   ├── clerk-auth/       # Auth guard: verifies Clerk JWT, sets auth context
│   │   ├── auth-context/     # Attaches typed auth context to request
│   │   └── plan-guard/       # Plan enforcement middleware (Free vs Pro)
│   │
│   ├── modules/              # Domain modules (each is self-contained)
│   │   ├── auth/             # Clerk session + webhook ingestion
│   │   ├── users/            # Local user persistence (mirrors Clerk identity)
│   │   ├── facebook/         # OAuth connect + Graph API integration
│   │   ├── posts/            # CRUD + publish/schedule + media routes
│   │   ├── analytics/        # Metrics + snapshots
│   │   ├── comments/         # Comment reply workflows
│   │   ├── billing/          # Stripe checkout + webhook sync
│   │   ├── subscriptions/    # Subscription persistence
│   │   ├── plans/            # Plan definitions + defaults seeding
│   │   ├── audit-logs/       # Audit events persisted for traceability
│   │   └── jobs/             # BullMQ queues/processors/workers
│   │       ├── queues/       # Queue definitions (publish, metrics, ...)
│   │       ├── processors/   # Job handlers
│   │       └── workers/      # Worker bootstrap + embedded-worker switch
│   │
│   ├── shared/               # Shared building blocks (no domain logic)
│   │   ├── errors/           # AppError types + global error handler
│   │   ├── controller/       # Base controller helpers / route wiring patterns
│   │   ├── repository/       # Shared repository helpers (TypeORM wrappers)
│   │   ├── service/          # Shared service utilities
│   │   ├── constants/        # Shared constants used by multiple modules
│   │   └── types/            # Shared DTO/domain types
│   │
│   ├── types/                # Framework/type augmentation (Fastify, webhooks)
│   ├── migrations/           # TypeORM migrations (prod/test; empty until generated)
│   ├── __tests__/            # Unit tests
│   └── e2e/                  # End-to-end tests
├── docker-compose.yml        # Postgres + Redis (development)
├── .env.example              # API environment template
└── package.json
```

### Module layout (pattern)

Most folders under `src/modules/<module>` follow the same shape:

```text
src/modules/<module>/
├── contracts/     # Zod schemas + request/response contracts (API boundary)
├── controller/    # HTTP handlers / route registration
├── service/       # Business logic
├── repository/    # TypeORM queries + persistence mapping
├── entity/        # TypeORM entities (when module owns tables)
├── providers/     # 3rd party adapters (Facebook Graph, Stripe, schedulers, ...)
├── ports/         # Interfaces for dependency inversion
└── module/        # Composition for this module (wires controller/service)
```

---

## Requirements

| Tool    | Version |
| ------- | ------- |
| Node.js | ≥ 20    |
| pnpm    | ≥ 8     |

---

## Installation

From the monorepo root:

```bash
pnpm install

# API env
cp apps/api/.env.example apps/api/.env

# Start Postgres + Redis
pnpm --dir apps/api docker compose up -d

# Run migrations
pnpm --filter api migration:run

# Start API
pnpm dev:api
```

---

## Environment Variables

Create `apps/api/.env`:

```bash
cp apps/api/.env.example apps/api/.env
```

Common variables:

| Variable                    | Example                                                  | Notes                           |
| --------------------------- | -------------------------------------------------------- | ------------------------------- |
| `PORT`                      | `3000`                                                   | API port                        |
| `HOST`                      | `0.0.0.0`                                                | Bind address                    |
| `DATABASE_URL`              | `postgresql://postgres:postgres@localhost:5432/fcp_dev`  | Dev DB                          |
| `DATABASE_URL_TEST`         | `postgresql://postgres:postgres@localhost:5432/fcp_test` | Test DB                         |
| `REDIS_HOST` / `REDIS_PORT` | `localhost` / `6379`                                     | BullMQ                          |
| `CLERK_SECRET_KEY`          | `sk_test_xxx`                                            | Required for Clerk verification |
| `FACEBOOK_REDIRECT_URI`     | `http://localhost:3001/facebook/connect`                 | Must match web callback         |
| `STRIPE_SECRET_KEY`         | `sk_test_xxx`                                            | Billing                         |

---

## API Reference

Base URL (local): `http://localhost:3000`

All routes are prefixed with `/api/v1`.

| Group     | Prefix              |
| --------- | ------------------- |
| Auth      | `/api/v1/auth`      |
| Facebook  | `/api/v1/facebook`  |
| Posts     | `/api/v1/posts`     |
| Analytics | `/api/v1/analytics` |
| Comments  | `/api/v1/comments`  |
| Billing   | `/api/v1/billing`   |

Docs:

- Swagger UI: `GET /docs`
- Health: `GET /health`

Authentication:

- Most routes expect `Authorization: Bearer <clerk_jwt>` (see Swagger security scheme).

---

## Jobs / Workers

There are two ways to run workers:

1. Separate worker process (recommended in development):

```bash
pnpm dev:worker
```

2. Embedded workers inside the API process (enabled by configuration in `modules/jobs/workers`).

---

## Database & Migrations

Development infra (Postgres + Redis):

```bash
pnpm --dir apps/api docker compose up -d
```

TypeORM migration commands:

```bash
pnpm --filter api migration:generate --name=YourMigrationName
pnpm --filter api migration:run
pnpm --filter api migration:revert
```

---

## Testing

```bash
pnpm --filter api test
pnpm --filter api test:e2e
```
