import { SignUp } from '@clerk/nextjs';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

import { AuthShell } from '@/components/layout/auth-shell';

export default async function SignUpPage() {
  const clerkConfigured = Boolean(
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
  );
  const { userId } = clerkConfigured ? await auth() : { userId: null };

  if (userId) {
    redirect('/dashboard');
  }

  return (
    <AuthShell
      eyebrow="Sign Up"
      title="Create account"
      description="Use email, Google, or Facebook."
      alternateLabel="Back to Sign In"
      alternateHref="/sign-in"
      alternateText="Already have an account?"
    >
      {clerkConfigured ? (
        <div className="auth-clerk-surface">
          <SignUp
            appearance={{
              elements: {
                rootBox: 'w-full max-w-none',
                headerTitle: 'hidden',
                headerSubtitle: 'hidden',
                socialButtonsBlockButtonText:
                  'font-medium text-[var(--foreground)]',
                formFieldLabel: 'text-[var(--foreground)]',
                dividerText:
                  'text-xs font-medium uppercase tracking-[0.12em] text-[var(--muted-foreground)]',
                footerActionLink: 'text-[var(--accent)]',
                identityPreviewText: 'text-[var(--foreground)]'
              }
            }}
          />
        </div>
      ) : (
        <div className="max-w-md rounded-xl border border-border bg-muted/40 p-6 text-sm leading-7 text-muted-foreground">
          Add `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` to enable sign up.
        </div>
      )}
    </AuthShell>
  );
}
