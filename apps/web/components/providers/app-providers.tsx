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
      colorPrimary: theme === 'dark' ? '#ea580c' : '#f97316',
      colorBackground: theme === 'dark' ? '#0c0a09' : '#ffffff',
      colorText: theme === 'dark' ? '#fafaf9' : '#1c1917',
      colorInputBackground: theme === 'dark' ? '#1c1917' : '#ffffff',
      colorInputText: theme === 'dark' ? '#fafaf9' : '#1c1917',
      colorNeutral: theme === 'dark' ? '#a8a29e' : '#57534e',
      borderRadius: '0.75rem'
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
