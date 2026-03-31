# Web App

Frontend client for the Facebook Creator Platform API in `apps/api`.

## Responsibilities

- Sign users in with Clerk
- Call protected backend routes with the Clerk session token
- Connect Facebook pages through the web callback route
- Create, edit, schedule, publish, and delete posts
- Show analytics overview and post-level metrics
- Start Stripe Checkout for Pro plan upgrades

## Environment

Create `apps/web/.env.local`:

```bash
cp apps/web/.env.example apps/web/.env.local
```

Required values:

```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxx
NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1
```

## Development

```bash
pnpm --filter web dev
```

The web app runs on [http://localhost:3001](http://localhost:3001).

## Facebook OAuth

Set the API environment variable below so Facebook redirects back to the web
app instead of directly to the API:

```bash
FACEBOOK_REDIRECT_URI=http://localhost:3001/facebook/connect
```

The callback page then calls `POST /facebook/callback` with the authenticated
session token.
