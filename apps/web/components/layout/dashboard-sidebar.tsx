'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { dashboardNavigation } from '@/data/dashboard-navigation';
import { Button } from '@/components/ui/button';
import { DashboardIcon } from '@/components/ui/dashboard-icon';
import { StatusBadge } from '@/components/ui/dashboard-primitives';

export function DashboardSidebar({
  accountName,
  planLabel,
  planStatus,
  connectedPages
}: {
  accountName: string;
  planLabel: string;
  planStatus: string;
  connectedPages: number;
}) {
  const pathname = usePathname();

  return (
    <aside className="hidden w-[260px] shrink-0 xl:block">
      <div className="sticky top-4 flex min-h-[calc(100vh-2rem)] flex-col rounded-2xl border border-border bg-card p-4 shadow-sm">
        <Link
          href="/"
          className="rounded-xl border border-border bg-muted/40 p-4"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="eyebrow text-[11px] text-primary">
                Facebook Creator Platform
              </p>
              <h1 className="mt-2 text-lg font-semibold tracking-tight">
                Ops Console
              </h1>
            </div>
            <StatusBadge tone={planLabel === 'Pro' ? 'pro' : 'free'}>
              {planLabel}
            </StatusBadge>
          </div>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Posts, analytics, billing.
          </p>
        </Link>

        <div className="mt-6">
          <p className="eyebrow text-[11px] text-muted-foreground">
            Navigation
          </p>
          <nav aria-label="Dashboard navigation" className="mt-3 space-y-1.5">
            {dashboardNavigation.map(item => {
              const active =
                pathname === item.href ||
                (item.href !== '/dashboard' && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`dashboard-nav-item ${
                    active ? 'dashboard-nav-item-active' : ''
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <span className="rounded-md border border-border bg-background p-2 text-primary">
                      <DashboardIcon icon={item.icon} />
                    </span>
                    <span className="block text-sm font-semibold">
                      {item.label}
                    </span>
                  </span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="mt-6 rounded-xl border border-border bg-muted/40 p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold">Workspace</p>
            <span className="text-xs uppercase tracking-[0.12em] text-muted-foreground">
              {planStatus}
            </span>
          </div>

          <div className="mt-4 space-y-3 text-sm text-muted-foreground">
            <div className="flex items-center justify-between gap-3">
              <span>User</span>
              <span className="max-w-[140px] truncate text-foreground">
                {accountName}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span>Pages</span>
              <span className="text-foreground">{connectedPages}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span>Status</span>
              <span className="text-foreground">{planStatus}</span>
            </div>
          </div>
        </div>

        <div className="mt-auto grid gap-2 pt-6">
          <Button asChild>
            <Link href="/dashboard/posts">Create Post</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/dashboard/accounts">Manage Pages</Link>
          </Button>
        </div>
      </div>
    </aside>
  );
}
