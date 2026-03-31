import { auth } from '@clerk/nextjs/server';

import { DashboardShell } from '@/components/layout/dashboard-shell';
import { DashboardSetupState } from '@/features/dashboard/components/setup-state';
import { isClerkConfigured } from '@/lib/env';

export default async function DashboardLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  if (!isClerkConfigured) {
    return <DashboardSetupState />;
  }

  const { isAuthenticated, redirectToSignIn } = await auth();

  if (!isAuthenticated) {
    return redirectToSignIn({
      returnBackUrl: '/dashboard'
    });
  }

  return <DashboardShell>{children}</DashboardShell>;
}
