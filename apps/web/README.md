# Web (Next.js)

Next.js frontend for the Facebook Creator Platform.

Built with **Next.js**, **React**, **Tailwind CSS**, **Zod**, and **Clerk** — managed by **pnpm**.

---

## Table of Contents

- [Web (Next.js)](#web-nextjs)
  - [Table of Contents](#table-of-contents)
  - [Features](#features)
  - [Project Structure](#project-structure)
  - [Requirements](#requirements)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
  - [Development](#development)
  - [Production](#production)

---

## Features

| Area             | Description                                              |
| ---------------- | -------------------------------------------------------- |
| Auth             | Clerk sign-in/sign-up routes                             |
| API integration  | Configurable base API URL via `NEXT_PUBLIC_API_URL`      |
| Facebook connect | Acts as the OAuth callback surface (`/facebook/connect`) |

---

## Project Structure

```text
apps/web/
├── app/                           # Next.js App Router
│   ├── (marketing)/               # Public marketing pages
│   ├── (auth)/                    # Clerk auth routes (sign-in / sign-up)
│   ├── (dashboard)/               # Authenticated app surfaces
│   │   ├── dashboard/             # Main product UI (accounts/posts/analytics/billing/…)
│   │   └── facebook/connect/      # OAuth callback surface used by the API redirect URI
│   ├── layout.tsx                 # Root layout (providers, shell)
│   ├── globals.css                # Global styles (Tailwind)
│   └── error.tsx                  # Global error boundary
│
├── components/
│   ├── layout/                    # App shells (sidebar/topbar)
│   ├── providers/                 # React providers (Clerk/Query/Theme/Toasts)
│   ├── marketing/                 # Marketing page components
│   └── ui/                        # Reusable UI primitives (buttons, inputs, charts, …)
│
├── features/                      # Feature-first organization
│   ├── dashboard/
│   │   ├── components/            # Views for each dashboard section
│   │   ├── hooks/                 # React Query hooks + mutations
│   │   ├── lib/                   # Schemas, formatting, query keys, derivations
│   │   └── types.ts               # Feature types
│   └── facebook/
│       └── components/            # Facebook connect callback UI flow
│
├── hooks/                         # Cross-feature hooks (API client, etc.)
├── lib/                           # Cross-feature utilities (api/env/utils)
├── public/                        # Static assets
├── next.config.ts                 # Next.js config
└── package.json
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
cp apps/web/.env.example apps/web/.env.local
pnpm dev:web
```

---

## Environment Variables

Create `apps/web/.env.local`:

```bash
cp apps/web/.env.example apps/web/.env.local
```

Required values:

```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxx
NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1
```

Notes:

- `NEXT_PUBLIC_API_URL` should match your API base (default: `http://localhost:3000/api/v1`).
- Local web runs on port `3001` (see `package.json`).

---

## Development

```bash
pnpm --filter web dev
```

The app runs on `http://localhost:3001`.

---

## Production

```bash
pnpm --filter web build
pnpm --filter web start
```
