'use client';

import { UserButton } from '@clerk/nextjs';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { dashboardNavigation } from '@/data/dashboard-navigation';
import { Button } from '@/components/ui/button';
import { DashboardIcon } from '@/components/ui/dashboard-icon';
import { GlassTag } from '@/components/ui/dashboard-primitives';
import { ThemeToggle } from '@/components/ui/theme-toggle';

export function DashboardTopbar({
  connectedPages
}: {
  connectedPages: number;
}) {
  const pathname = usePathname();
  const activeItem =
    dashboardNavigation.find(
      item =>
        pathname === item.href ||
        (item.href !== '/dashboard' && pathname.startsWith(item.href))
    ) ?? dashboardNavigation[0];

  return (
    <div className="flex flex-col gap-3 py-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-muted text-primary">
            <DashboardIcon icon={activeItem.icon} />
          </div>

          <div className="min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
              Dashboard
            </p>
            <div className="mt-1 flex min-w-0 items-center gap-2">
              <h2 className="truncate text-lg font-semibold tracking-tight sm:text-xl">
                {activeItem.label}
              </h2>
              <div className="hidden md:flex">
                <GlassTag tone={connectedPages > 0 ? 'success' : 'warning'}>
                  {connectedPages} page{connectedPages === 1 ? '' : 's'}
                </GlassTag>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-2.5">
          <ThemeToggle compact />
          <Button
            asChild
            variant="outline"
            size="sm"
            className="hidden lg:inline-flex"
          >
            <Link href="/dashboard/accounts">Pages</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/dashboard/posts">Create Post</Link>
          </Button>
          <UserButton
            appearance={{
              elements: {
                userButtonAvatarBox: 'h-9 w-9'
              }
            }}
          />
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 xl:hidden">
        <GlassTag tone={connectedPages > 0 ? 'success' : 'warning'}>
          {connectedPages} page{connectedPages === 1 ? '' : 's'}
        </GlassTag>
      </div>

      <nav aria-label="Dashboard sections" className="xl:hidden">
        <div className="no-scrollbar -mx-1 overflow-x-auto px-1">
          <div className="flex min-w-max items-center gap-2">
            {dashboardNavigation.map(item => {
              const active =
                pathname === item.href ||
                (item.href !== '/dashboard' && pathname.startsWith(item.href));

              return (
                <Button
                  key={item.href}
                  asChild
                  variant={active ? 'secondary' : 'ghost'}
                  size="sm"
                  className="shrink-0"
                >
                  <Link
                    href={item.href}
                    aria-current={active ? 'page' : undefined}
                  >
                    <DashboardIcon icon={item.icon} />
                    <span>{item.shortLabel}</span>
                  </Link>
                </Button>
              );
            })}
          </div>
        </div>
      </nav>
    </div>
  );
}
