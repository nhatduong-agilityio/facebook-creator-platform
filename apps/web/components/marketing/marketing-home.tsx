import type { Route } from 'next';
import Link from 'next/link';

import { GlassTag } from '@/components/ui/dashboard-primitives';
import { ThemeToggle } from '@/components/ui/theme-toggle';

const primaryLinkClassName =
  'inline-flex items-center justify-center rounded-lg bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[color:color-mix(in_srgb,var(--accent)_88%,white)]';
const secondaryLinkClassName =
  'inline-flex items-center justify-center rounded-lg border border-[var(--line-strong)] bg-[var(--panel)] px-5 py-2.5 text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--accent)] hover:bg-[var(--panel-contrast)]';

const featureCards = [
  {
    title: 'Content',
    detail: 'Create, review, and publish posts from one structured workflow.'
  },
  {
    title: 'Schedule',
    detail: 'Plan the queue around timing, capacity, and page availability.'
  },
  {
    title: 'Measure',
    detail:
      'Track reach and engagement without opening separate reporting tools.'
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
    <main
      id="main-content"
      className="shell-grid min-h-screen text-[var(--foreground)]"
    >
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-5 py-6 sm:px-8 lg:px-10">
        <header className="flex items-center justify-between gap-4 border-b border-[var(--line)] pb-5">
          <div>
            <p className="eyebrow text-[11px] text-[var(--accent-secondary)]">
              Facebook Creator Platform
            </p>
            <p className="mt-2 text-sm text-[var(--muted-foreground)]">
              Scheduling, analytics, comments, billing.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <ThemeToggle />
            <Link href={'/sign-in' as Route} className={secondaryLinkClassName}>
              Sign in
            </Link>
            <Link
              href="/dashboard"
              prefetch={false}
              className={primaryLinkClassName}
            >
              Open dashboard
            </Link>
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
              <h1 className="max-w-4xl text-4xl font-semibold tracking-[-0.07em] sm:text-5xl lg:text-6xl">
                Operate Facebook content from one production-ready console.
              </h1>
              <p className="max-w-3xl text-base leading-8 text-[var(--muted-foreground)]">
                Connect pages, create posts, schedule delivery, track
                performance, and manage billing in a workflow built for
                creators, marketers, and small teams.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/dashboard"
                prefetch={false}
                className={primaryLinkClassName}
              >
                Open dashboard
              </Link>
              <Link
                href={'/sign-up' as Route}
                className={secondaryLinkClassName}
              >
                Create account
              </Link>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {featureCards.map(card => (
                <div
                  key={card.title}
                  className="surface-panel rounded-[1rem] p-5"
                >
                  <p className="eyebrow text-[11px] text-[var(--accent-secondary)]">
                    {card.title}
                  </p>
                  <p className="mt-3 text-lg font-semibold">{card.detail}</p>
                </div>
              ))}
            </div>
          </div>

          <aside className="panel-strong rounded-[1.35rem] p-6 sm:p-8">
            <div className="flex items-center justify-between gap-4 border-b border-[var(--line)] pb-5">
              <div>
                <p className="eyebrow text-[11px] text-[var(--accent-secondary)]">
                  Live preview
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em]">
                  Creator workspace
                </h2>
              </div>
              <GlassTag tone={clerkConfigured ? 'success' : 'warning'}>
                {clerkConfigured ? 'Auth ready' : 'Setup needed'}
              </GlassTag>
            </div>

            <div className="mt-6 rounded-[1.1rem] border border-[var(--line)] bg-[var(--panel)] p-5">
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-[0.95rem] border border-[var(--line)] bg-[var(--panel-muted)] p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--muted-foreground)]">
                    Pages
                  </p>
                  <p className="mt-3 text-3xl font-semibold tracking-[-0.06em]">
                    12
                  </p>
                </div>
                <div className="rounded-[0.95rem] border border-[var(--line)] bg-[var(--panel-muted)] p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--muted-foreground)]">
                    Scheduled
                  </p>
                  <p className="mt-3 text-3xl font-semibold tracking-[-0.06em]">
                    24
                  </p>
                </div>
                <div className="rounded-[0.95rem] border border-[var(--line)] bg-[var(--panel-muted)] p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--muted-foreground)]">
                    Reach
                  </p>
                  <p className="mt-3 text-3xl font-semibold tracking-[-0.06em]">
                    128K
                  </p>
                </div>
              </div>

              <div className="mt-5 grid gap-3">
                {previewRows.map(row => (
                  <div
                    key={row.title}
                    className="rounded-[1rem] border border-[var(--line)] bg-[var(--panel-muted)] p-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold">{row.title}</p>
                        <p className="mt-2 text-xl font-semibold">
                          {row.value}
                        </p>
                      </div>
                      <span className="rounded-full bg-[var(--panel-contrast)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--muted-foreground)]">
                        Insight
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">
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
