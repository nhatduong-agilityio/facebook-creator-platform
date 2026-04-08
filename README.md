# Facebook Creator Platform

A backend-focused SaaS practice monorepo for managing Facebook content, scheduling posts, collecting analytics, and enforcing Free/Pro subscriptions.

Built with **TypeScript 5**, **Fastify 5**, **PostgreSQL** via **TypeORM**, validated by **Zod** — managed by **pnpm**.

---

## Table of Contents

- [Facebook Creator Platform](#facebook-creator-platform)
  - [Table of Contents](#table-of-contents)
  - [Features](#features)
  - [Project Structure](#project-structure)
  - [Requirements](#requirements)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
  - [API Reference](#api-reference)
  - [Architecture \& Design](#architecture--design)
  - [Code Quality](#code-quality)

---

## Features

| App / Area              | Description |
| ----------------------- | ----------- |
| `apps/api`              | Fastify REST API + Swagger UI, TypeORM (PostgreSQL), Zod validation |
| `apps/api` (jobs)       | Background workers using BullMQ + Redis |
| Authentication          | Clerk-based auth (JWT bearer token accepted by API) |
| Billing                 | Stripe Checkout + webhooks |
| Facebook integration    | OAuth connect + basic account/page token storage |
| `apps/web`              | Next.js frontend (Tailwind), acts as OAuth callback surface |

---

## Project Structure

```text
nodejs-training/
├── apps/
│   ├── api/                      # Fastify API + jobs + TypeORM (Postgres)
│   │   ├── src/
│   │   │   ├── main.ts           # API entry point
│   │   │   ├── worker.ts         # Worker entry point (BullMQ)
│   │   │   ├── app.ts            # Fastify app builder + route registration
│   │   │   ├── modules/          # auth, facebook, posts, analytics, billing, ...
│   │   │   └── shared/           # shared errors/types/helpers
│   │   ├── docker-compose.yml    # Postgres + Redis (dev)
│   │   └── .env.example
│   │
│   └── web/                      # Next.js frontend (App Router)
│       ├── app/                  # routes (marketing/auth/dashboard)
│       ├── features/             # feature-first UI (dashboard, facebook)
│       ├── components/           # UI primitives + layout shells + providers
│       └── .env.example
│
├── package.json                  # Workspace scripts (dev:* / build / lint / format)
├── pnpm-workspace.yaml           # pnpm workspace config (apps/*, packages/*)
├── commitlint.config.js          # Conventional Commits enforcement
├── .husky/                       # git hooks (pre-commit, commit-msg)
└── README.md                     # you are here
```

See app-level READMEs:

- `apps/api/README.md`
- `apps/web/README.md`

---

## Requirements

| Tool    | Version |
| ------- | ------- |
| Node.js | ≥ 20    |
| pnpm    | ≥ 8     |

---

## Installation

```bash
# Install dependencies
pnpm install

# API env
cp apps/api/.env.example apps/api/.env

# Web env
cp apps/web/.env.example apps/web/.env.local

# Start infra (Postgres + Redis)
pnpm --dir apps/api docker compose up -d

# Run migrations
pnpm --filter api migration:run

# Start apps (3 terminals recommended)
pnpm dev:api
pnpm dev:worker
pnpm dev:web
```

---

## Environment Variables

This monorepo keeps env files per app:

- API: `apps/api/.env` (see `apps/api/.env.example`)
- Web: `apps/web/.env.local` (see `apps/web/.env.example`)

---

## API Reference

All API routes are served under `/api/v1`.

Main route groups:

- `/api/v1/auth`
- `/api/v1/facebook`
- `/api/v1/posts`
- `/api/v1/analytics`
- `/api/v1/comments`
- `/api/v1/billing`

Docs:

- Swagger UI: `http://localhost:3000/docs`
- Health: `http://localhost:3000/health`

---

## Architecture & Design

The API follows a modular structure (controllers/services/repositories/providers) wired in `apps/api/src/app.ts` and started from `apps/api/src/main.ts`.

Notes:

- Redis is used for BullMQ jobs only (not as an API cache).
- The web app runs on `http://localhost:3001` and is used as the Facebook OAuth callback surface.
- Set `FACEBOOK_REDIRECT_URI=http://localhost:3001/facebook/connect` in the API env for local OAuth.

---

## Code Quality

Workspace commands:

```bash
pnpm lint
pnpm format
pnpm format:check
pnpm build
pnpm test
pnpm test:e2e
```
