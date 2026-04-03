# Web App

Next.js frontend for the Facebook Creator Platform.

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

The app runs on [http://localhost:3001](http://localhost:3001).
