'use client';

import { ClerkProvider } from '@clerk/nextjs';

import { publicEnv } from '@/lib/env';
import { QueryProvider } from '@/components/providers/query-provider';
import { ToastProvider } from '@/components/providers/toast-provider';
import {
  ThemeProvider,
  useTheme,
  type ResolvedTheme
} from '@/components/providers/theme-provider';

function clerkAppearance(theme: ResolvedTheme) {
  return {
    variables: {
      colorPrimary: theme === 'dark' ? '#ff8e75' : '#e8634a',
      colorBackground: theme === 'dark' ? '#132943' : '#ffffff',
      colorText: theme === 'dark' ? '#ffffff' : '#132943',
      colorInputBackground: theme === 'dark' ? '#19314f' : '#eef3f9',
      colorInputText: theme === 'dark' ? '#ffffff' : '#132943',
      colorNeutral: theme === 'dark' ? '#b7cde3' : '#6b7f97',
      borderRadius: '1rem'
    }
  } as const;
}

function ProvidersInner({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { resolvedTheme } = useTheme();
  const app = (
    <ToastProvider>
      <QueryProvider>{children}</QueryProvider>
    </ToastProvider>
  );

  if (!publicEnv.clerkPublishableKey) {
    return app;
  }

  return (
    <ClerkProvider
      publishableKey={publicEnv.clerkPublishableKey}
      signInUrl={publicEnv.signInUrl}
      signUpUrl={publicEnv.signUpUrl}
      appearance={clerkAppearance(resolvedTheme)}
    >
      {app}
    </ClerkProvider>
  );
}

export function AppProviders({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ThemeProvider>
      <ProvidersInner>{children}</ProvidersInner>
    </ThemeProvider>
  );
}
