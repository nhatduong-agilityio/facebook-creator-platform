import type { Route } from 'next';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { GlassTag } from '@/components/ui/dashboard-primitives';
import { ThemeToggle } from '@/components/ui/theme-toggle';

const featureCards = [
  {
    title: 'Content',
    detail: 'Create and publish posts.'
  },
  {
    title: 'Schedule',
    detail: 'Manage the calendar.'
  },
  {
    title: 'Measure',
    detail: 'Review results.'
  }
];

const previewRows = [
  {
    title: 'Queue health',
    value: '24 scheduled',
    detail: '2 need review'
  },
  {
    title: 'Best posting window',
    value: '7:00 PM',
    detail: 'Highest reach in the last 30 days'
  },
  {
    title: 'Plan status',
    value: 'Pro ready',
    detail: 'Upgrade when scheduling becomes the bottleneck'
  }
];

export function MarketingHome({
  clerkConfigured
}: {
  clerkConfigured: boolean;
}) {
  return (
    <main id="main-content" className="shell-grid min-h-screen text-foreground">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-5 py-6 sm:px-8 lg:px-10">
        <header className="flex items-center justify-between gap-4 border-b border-border pb-5">
          <div>
            <p className="eyebrow text-[11px] text-primary">
              Facebook Creator Platform
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Posts, analytics, billing.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <ThemeToggle />
            <Button asChild variant="outline">
              <Link href={'/sign-in' as Route}>Sign in</Link>
            </Button>
            <Button asChild>
              <Link href="/dashboard" prefetch={false}>
                Open dashboard
              </Link>
            </Button>
          </div>
        </header>

        <section className="grid flex-1 gap-8 py-10 xl:grid-cols-[1.02fr_0.98fr] xl:items-center">
          <div className="space-y-8">
            <div className="flex flex-wrap gap-2.5">
              <GlassTag tone="accent">Facebook publishing</GlassTag>
              <GlassTag tone="neutral">Scheduling</GlassTag>
              <GlassTag tone="neutral">Analytics</GlassTag>
              <GlassTag tone="success">Creator friendly</GlassTag>
            </div>

            <div className="max-w-4xl space-y-5">
              <h1 className="max-w-4xl text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
                A simpler operating system for Facebook publishing.
              </h1>
              <p className="max-w-3xl text-base leading-8 text-muted-foreground">
                Connect pages, create posts, schedule delivery, and track
                results.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/dashboard" prefetch={false}>
                  Open dashboard
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href={'/sign-up' as Route}>Create account</Link>
              </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {featureCards.map(card => (
                <Card key={card.title}>
                  <CardHeader className="pb-2">
                    <p className="eyebrow text-[11px] text-primary">
                      {card.title}
                    </p>
                    <CardTitle className="text-xl">{card.detail}</CardTitle>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>

          <aside className="rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8">
            <div className="flex items-center justify-between gap-4 border-b border-border pb-5">
              <div>
                <p className="eyebrow text-[11px] text-primary">Preview</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                  Dashboard
                </h2>
              </div>
              <GlassTag tone={clerkConfigured ? 'success' : 'warning'}>
                {clerkConfigured ? 'Auth ready' : 'Setup needed'}
              </GlassTag>
            </div>

            <div className="mt-6 rounded-2xl border border-border bg-background p-5">
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-border bg-muted/40 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    Pages
                  </p>
                  <p className="mt-3 text-3xl font-semibold tracking-tight">
                    12
                  </p>
                </div>
                <div className="rounded-xl border border-border bg-muted/40 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    Scheduled
                  </p>
                  <p className="mt-3 text-3xl font-semibold tracking-tight">
                    24
                  </p>
                </div>
                <div className="rounded-xl border border-border bg-muted/40 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    Reach
                  </p>
                  <p className="mt-3 text-3xl font-semibold tracking-tight">
                    128K
                  </p>
                </div>
              </div>

              <div className="mt-5 grid gap-3">
                {previewRows.map(row => (
                  <div
                    key={row.title}
                    className="rounded-xl border border-border bg-muted/40 p-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold">{row.title}</p>
                        <p className="mt-2 text-xl font-semibold">
                          {row.value}
                        </p>
                      </div>
                      <span className="rounded-full bg-background px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                        Status
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      {row.detail}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}
