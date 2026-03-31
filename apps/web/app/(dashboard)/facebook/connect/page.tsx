import { Suspense } from 'react';

import { FacebookConnectCallback } from '@/features/facebook/components/facebook-connect-callback';

function CallbackFallback() {
  return (
    <main className="shell-grid flex min-h-screen items-center justify-center px-5 py-8 text-[var(--foreground)] sm:px-8">
      <section className="surface-panel w-full max-w-xl rounded-[28px] p-6 sm:p-8">
        <p className="eyebrow text-xs text-[var(--accent-deep)]">
          Facebook Callback
        </p>
        <h1 className="mt-3 text-3xl font-semibold">Connect Facebook</h1>
        <p className="mt-4 text-sm leading-6 text-[var(--muted-foreground)]">
          Loading.
        </p>
      </section>
    </main>
  );
}

export default function FacebookConnectPage() {
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    return (
      <main className="shell-grid flex min-h-screen items-center justify-center px-5 py-8 text-[var(--foreground)] sm:px-8">
        <section className="surface-panel w-full max-w-xl rounded-[28px] p-6 sm:p-8">
          <p className="eyebrow text-xs text-[var(--accent-deep)]">
            Facebook Callback
          </p>
          <h1 className="mt-3 text-3xl font-semibold">Connect Facebook</h1>
          <p className="mt-4 text-sm leading-6 text-[var(--muted-foreground)]">
            Sign in must be configured before you can connect a Facebook page.
          </p>
        </section>
      </main>
    );
  }

  return (
    <Suspense fallback={<CallbackFallback />}>
      <FacebookConnectCallback />
    </Suspense>
  );
}
