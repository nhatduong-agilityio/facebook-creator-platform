'use client';

import { UserButton } from '@clerk/nextjs';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { dashboardNavigation } from '@/data/dashboard-navigation';
import { DashboardIcon } from '@/components/ui/dashboard-icon';
import {
  GlassTag,
  primaryButtonClassName
} from '@/components/ui/dashboard-primitives';
import { Input } from '@/components/ui/input';
import { ThemeToggle } from '@/components/ui/theme-toggle';

export function DashboardTopbar({
  connectedPages
}: {
  connectedPages: number;
}) {
  const pathname = usePathname();
  const todayLabel = 'Today';

  return (
    <div className="panel-strong sticky top-4 z-20 rounded-[1rem] px-4 py-3">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="hidden rounded-md border border-[var(--line)] bg-[var(--panel-contrast)] p-2 text-[var(--accent)] sm:block">
            <DashboardIcon
              icon={
                dashboardNavigation.find(
                  item =>
                    pathname === item.href ||
                    (item.href !== '/dashboard' &&
                      pathname.startsWith(item.href))
                )?.icon ?? 'overview'
              }
            />
          </div>

          <label className="flex min-w-0 flex-1 items-center gap-3 rounded-lg border border-[var(--line)] bg-[var(--panel)] px-4 py-2.5">
            <span className="sr-only">Search workspace</span>
            <span className="text-sm text-[var(--muted-foreground)]">/</span>
            <Input
              type="search"
              placeholder="Search posts, pages, metrics"
              aria-label="Search workspace"
              autoComplete="off"
              className="h-auto min-w-0 border-0 bg-transparent p-0 shadow-none focus:border-transparent focus-visible:ring-0"
            />
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <GlassTag tone="neutral">{todayLabel}</GlassTag>
          <GlassTag tone={connectedPages > 0 ? 'success' : 'warning'}>
            {connectedPages} page{connectedPages === 1 ? '' : 's'}
          </GlassTag>
          <ThemeToggle compact />
          <Link href="/dashboard/posts" className={primaryButtonClassName}>
            Create Post
          </Link>
          <UserButton
            appearance={{
              elements: {
                userButtonAvatarBox: 'h-9 w-9'
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}
