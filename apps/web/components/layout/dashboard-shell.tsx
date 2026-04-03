'use client';

import type { ReactNode } from 'react';

import { DashboardSidebar } from '@/components/layout/dashboard-sidebar';
import { DashboardTopbar } from '@/components/layout/dashboard-topbar';
import {
  useDashboardAccountsQuery,
  useDashboardBillingQuery,
  useDashboardSessionQuery
} from '@/features/dashboard/hooks/use-dashboard-queries';
import { summarizePlan } from '@/features/dashboard/lib/format';

export function DashboardShell({ children }: { children: ReactNode }) {
  const sessionQuery = useDashboardSessionQuery();
  const billingQuery = useDashboardBillingQuery();
  const accountsQuery = useDashboardAccountsQuery();

  const connectedPages = accountsQuery.data?.length ?? 0;

  return (
    <main
      id="main-content"
      className="min-h-screen bg-background text-foreground"
    >
      <div className="mx-auto flex w-full max-w-[1600px] gap-6 px-4 sm:px-6 lg:px-8">
        <DashboardSidebar
          accountName={
            sessionQuery.data?.name ?? sessionQuery.data?.email ?? 'Loading'
          }
          planLabel={summarizePlan(billingQuery.data?.plan.code ?? 'free')}
          planStatus={billingQuery.data?.plan.status ?? 'Loading'}
          connectedPages={connectedPages}
        />

        <div className="flex min-h-screen min-w-0 flex-1 flex-col">
          <div className="sticky top-0 z-40 border-b border-border bg-background/92 backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:-mx-6 ">
            <div className="mx-auto w-full px-4 sm:px-6">
              <DashboardTopbar connectedPages={connectedPages} />
            </div>
          </div>

          <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 py-4 pb-8">
            {children}
          </div>
        </div>
      </div>
    </main>
  );
}
