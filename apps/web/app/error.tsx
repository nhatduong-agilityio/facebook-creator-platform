'use client';

import Link from 'next/link';
import { useEffect } from 'react';

import { Button } from '@/components/ui/button';
import { ErrorCallout } from '@/components/ui/dashboard-primitives';

export default function GlobalError({
  error,
  reset
}: Readonly<{
  error: Error & { digest?: string };
  reset: () => void;
}>) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main
      id="main-content"
      className="shell-grid flex min-h-screen items-center justify-center px-5 py-8"
    >
      <div className="w-full max-w-2xl space-y-4">
        <ErrorCallout
          title="Application error"
          error={error}
          className="surface-panel"
        />

        <div className="flex flex-wrap gap-3">
          <Button
            type="button"
            onClick={() => {
              reset();
            }}
          >
            Retry
          </Button>
          <Button asChild variant="secondary">
            <Link href="/">Back to home</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
