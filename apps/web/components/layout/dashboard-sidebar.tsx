'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { dashboardNavigation } from '@/data/dashboard-navigation';
import { DashboardIcon } from '@/components/ui/dashboard-icon';
import {
  StatusBadge,
  primaryButtonClassName,
  secondaryButtonClassName
} from '@/components/ui/dashboard-primitives';

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
    <aside className="hidden w-[248px] shrink-0 xl:block">
      <div className="panel-strong sticky top-5 flex min-h-[calc(100vh-2.5rem)] flex-col rounded-[1.15rem] p-4">
        <Link
          href="/"
          className="rounded-[0.95rem] border border-[var(--line)] p-4"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="eyebrow text-[11px] text-[var(--accent-secondary)]">
                Facebook Creator Platform
              </p>
              <h1 className="mt-2 text-lg font-semibold tracking-[-0.04em]">
                Ops Console
              </h1>
            </div>
            <StatusBadge tone={planLabel === 'Pro' ? 'pro' : 'free'}>
              {planLabel}
            </StatusBadge>
          </div>
          <p className="mt-3 text-sm leading-6 text-[var(--muted-foreground)]">
            One workspace for publishing, scheduling, analytics, and billing.
          </p>
        </Link>

        <div className="mt-6">
          <p className="eyebrow text-[11px] text-[var(--muted-foreground)]">
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
                    <span className="rounded-md border border-[var(--line)] bg-[var(--panel-contrast)] p-2 text-[var(--accent)]">
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

        <div className="mt-6 rounded-[1rem] border border-[var(--line)] bg-[var(--panel-muted)] p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold">Workspace</p>
            <span className="text-xs uppercase tracking-[0.12em] text-[var(--muted-foreground)]">
              {planStatus}
            </span>
          </div>

          <div className="mt-4 space-y-3 text-sm text-[var(--muted-foreground)]">
            <div className="flex items-center justify-between gap-3">
              <span>User</span>
              <span className="max-w-[140px] truncate text-[var(--foreground)]">
                {accountName}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span>Pages</span>
              <span className="text-[var(--foreground)]">{connectedPages}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span>Status</span>
              <span className="text-[var(--foreground)]">{planStatus}</span>
            </div>
          </div>
        </div>

        <div className="mt-auto grid gap-2 pt-6">
          <Link href="/dashboard/posts" className={primaryButtonClassName}>
            Create Post
          </Link>
          <Link href="/dashboard/accounts" className={secondaryButtonClassName}>
            Manage Pages
          </Link>
        </div>
      </div>
    </aside>
  );
}
