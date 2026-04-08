'use client';

import { SignInButton, useAuth } from '@clerk/nextjs';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useEffectEvent, useRef, useState } from 'react';

import { useToast } from '@/components/providers/toast-provider';
import { apiRequest, getErrorMessage } from '@/lib/api';

type ConnectState =
  | { status: 'idle'; message: string }
  | { status: 'loading'; message: string }
  | { status: 'success'; message: string }
  | { status: 'error'; message: string };

export function FacebookConnectCallback() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const toast = useToast();
  const startedRef = useRef(false);

  const [state, setState] = useState<ConnectState>({
    status: 'idle',
    message: 'Preparing connection.'
  });

  const code = searchParams.get('code');
  const facebookError = searchParams.get('error');

  const completeConnection = useEffectEvent(
    async (authorizationCode: string) => {
      try {
        const token = await getToken({ template: 'backend' });

        await apiRequest('/auth/session', {
          token
        });

        await apiRequest('/facebook/callback', {
          method: 'POST',
          token,
          body: { code: authorizationCode }
        });

        setState({
          status: 'success',
          message: 'Facebook page connected. Returning to your account.'
        });
        toast.success(
          'Facebook connected',
          'The page is now available in your workspace.'
        );

        window.setTimeout(() => {
          router.replace('/dashboard/accounts');
        }, 1200);
      } catch (error) {
        const message = getErrorMessage(
          error,
          'Unable to connect Facebook right now.'
        );

        setState({
          status: 'error',
          message
        });
        toast.error('Unable to connect Facebook', message);
      }
    }
  );

  useEffect(() => {
    if (!isLoaded || !isSignedIn || startedRef.current) {
      return;
    }

    if (facebookError || !code) {
      return;
    }

    startedRef.current = true;
    void completeConnection(code);
  }, [code, facebookError, isLoaded, isSignedIn]);

  return (
    <main
      id="main-content"
      className="shell-grid flex min-h-screen items-center justify-center px-5 py-8 text-foreground sm:px-8"
    >
      <section className="surface-panel w-full max-w-xl rounded-[28px] p-6 sm:p-8">
        <p className="eyebrow text-xs text-[var(--accent-deep)]">
          Facebook Callback
        </p>
        <h1 className="mt-3 text-3xl font-semibold">Connect Facebook</h1>

        {!isLoaded ? (
          <p className="mt-4 text-sm text-muted-foreground">Loading.</p>
        ) : null}

        {isLoaded && !isSignedIn ? (
          <div className="mt-4 space-y-4">
            <p className="text-sm leading-6 text-muted-foreground">
              Sign in to complete the Facebook connection.
            </p>
            <SignInButton mode="modal">
              <button className="rounded-full bg-foreground px-5 py-3 text-sm font-medium text-background">
                Sign In
              </button>
            </SignInButton>
          </div>
        ) : null}

        {isLoaded && isSignedIn ? (
          <div className="mt-4 space-y-4">
            <div className="rounded-[22px] border border-[var(--line)] bg-[var(--panel-muted)] p-4">
              <p className="text-sm leading-6 text-muted-foreground">
                {facebookError
                  ? `Facebook returned an error: ${facebookError}`
                  : !code
                    ? 'Missing Facebook authorization code.'
                    : state.message}
              </p>
            </div>

            <Link
              href="/dashboard/accounts"
              className="inline-flex rounded-full border border-[var(--line-strong)] bg-[var(--panel-muted)] px-5 py-3 text-sm font-medium text-foreground"
            >
              Back to dashboard
            </Link>
          </div>
        ) : null}
      </section>
    </main>
  );
}
