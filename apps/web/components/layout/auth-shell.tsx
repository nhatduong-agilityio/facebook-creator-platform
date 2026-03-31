import type { Route } from 'next';
import Link from 'next/link';
import type { ReactNode } from 'react';

import { GlassTag } from '@/components/ui/dashboard-primitives';
import { ThemeToggle } from '@/components/ui/theme-toggle';

const actionLinkClassName =
  'inline-flex items-center justify-center rounded-lg border border-[var(--line-strong)] bg-[var(--panel)] px-4 py-2.5 text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--accent)] hover:bg-[var(--panel-contrast)]';

const subtleLinkClassName =
  'inline-flex items-center gap-2 text-sm font-medium text-[var(--muted-foreground)] transition hover:text-[var(--foreground)]';

export function AuthShell({
  eyebrow,
  title,
  description,
  children,
  alternateLabel,
  alternateHref,
  alternateText
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
  alternateLabel: string;
  alternateHref: string;
  alternateText: string;
}) {
  return (
    <main
      id="main-content"
      className="shell-grid flex min-h-screen items-center justify-center px-5 py-8 text-[var(--foreground)] sm:px-8 lg:px-12"
    >
      <section className="grid w-full max-w-[1120px] overflow-hidden rounded-[1.5rem] border border-[var(--line)] bg-[var(--panel)] shadow-[var(--shadow-hard)] xl:grid-cols-[minmax(0,1.08fr)_minmax(420px,0.92fr)]">
        <div className="border-b border-[var(--line)] bg-[var(--panel)] p-6 sm:p-8 xl:border-b-0 xl:border-r xl:p-10">
          <div className="flex items-start justify-between gap-6">
            <div>
              <Link href="/" className={subtleLinkClassName}>
                <span aria-hidden="true">←</span>
                <span>Back to home</span>
              </Link>
              <p className="eyebrow text-[11px] text-[var(--accent-secondary)]">
                {eyebrow}
              </p>
            </div>

            <ThemeToggle />
          </div>

          <div className="mt-10 max-w-[36rem]">
            <h1 className="text-[clamp(3rem,6vw,5rem)] font-semibold leading-[0.92] tracking-[-0.075em]">
              {title}
            </h1>
          </div>

          <p className="mt-5 max-w-xl text-base leading-8 text-[var(--muted-foreground)] sm:text-[1.05rem]">
            {description}
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-3 text-sm text-[var(--muted-foreground)]">
            <span>{alternateText}</span>
            <Link href={alternateHref as Route} className={actionLinkClassName}>
              {alternateLabel}
            </Link>
          </div>

          <div className="mt-6 flex flex-wrap gap-2.5">
            <GlassTag tone="neutral">Email</GlassTag>
            <GlassTag tone="neutral">Google</GlassTag>
            <GlassTag tone="neutral">Facebook</GlassTag>
            <GlassTag tone="success">Free plan first</GlassTag>
          </div>

          <div className="mt-8 grid gap-4 lg:grid-cols-2">
            {[
              'One account covers content, scheduler, analytics, connected pages, and billing.',
              'New workspaces start on Free and upgrade only when usage grows.'
            ].map(item => (
              <div
                key={item}
                className="rounded-[1.05rem] border border-[var(--line)] bg-[var(--panel-muted)] px-4 py-4 text-sm leading-6 text-[var(--foreground-soft)]"
              >
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[var(--panel-strong)] p-6 sm:p-8 lg:p-10">
          <div className="mx-auto flex h-full max-w-md flex-col justify-center">
            <div className="mb-6">
              <p className="eyebrow text-[11px] text-[var(--accent-secondary)]">
                Secure access
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em]">
                Continue to the workspace
              </h2>
            </div>

            {children}
          </div>
        </div>
      </section>
    </main>
  );
}
