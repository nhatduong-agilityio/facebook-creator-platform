import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  PageHeader,
  SectionHeading
} from '@/components/ui/dashboard-primitives';
import { publicEnv } from '@/lib/env';

export function DashboardSetupState() {
  return (
    <main
      id="main-content"
      className="shell-grid flex min-h-screen items-center justify-center px-5 py-8"
    >
      <div className="w-full max-w-4xl space-y-4">
        <PageHeader
          eyebrow="Authentication"
          title="Set up sign in to open the dashboard"
          description="Add the Clerk public key to enable protected product routes."
        />

        <Card className="p-5">
          <SectionHeading
            eyebrow="Environment"
            title="Required values"
            description="Use these values in the web app environment file."
          />

          <div className="mt-5 rounded-[24px] border border-[var(--line)] bg-[var(--panel-muted)] p-5 font-mono text-sm text-[var(--muted-foreground)]">
            <p>NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxx</p>
            <p>NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in</p>
            <p>NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up</p>
            <p>NEXT_PUBLIC_API_URL={publicEnv.apiBaseUrl}</p>
          </div>

          <div className="mt-5">
            <Button asChild>
              <Link href="/">Back to home</Link>
            </Button>
          </div>
        </Card>
      </div>
    </main>
  );
}
