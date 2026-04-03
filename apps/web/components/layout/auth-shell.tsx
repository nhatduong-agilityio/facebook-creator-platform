import type { Route } from 'next';
import Link from 'next/link';
import type { ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { GlassTag } from '@/components/ui/dashboard-primitives';
import { ThemeToggle } from '@/components/ui/theme-toggle';

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
      className="shell-grid flex min-h-screen items-center justify-center px-5 py-8 text-foreground sm:px-8 lg:px-12"
    >
      <section className="grid w-full max-w-[1100px] overflow-hidden rounded-3xl border border-border bg-card shadow-sm xl:grid-cols-[minmax(0,1.08fr)_minmax(420px,0.92fr)]">
        <div className="border-b border-border bg-card p-6 sm:p-8 xl:border-b-0 xl:border-r xl:p-10">
          <div className="flex items-start justify-between gap-6">
            <div>
              <Button asChild variant="ghost" size="sm" className="-ml-3 px-3">
                <Link href="/">
                  <span aria-hidden="true">←</span>
                  <span>Back to home</span>
                </Link>
              </Button>
              <p className="eyebrow text-[11px] text-primary">{eyebrow}</p>
            </div>

            <ThemeToggle />
          </div>

          <div className="mt-10 max-w-[36rem]">
            <h1 className="text-[clamp(3rem,6vw,4.5rem)] font-semibold leading-[0.95] tracking-tight">
              {title}
            </h1>
          </div>

          <p className="mt-5 max-w-xl text-base leading-8 text-muted-foreground sm:text-[1.05rem]">
            {description}
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <span>{alternateText}</span>
            <Button asChild variant="outline" size="sm">
              <Link href={alternateHref as Route}>{alternateLabel}</Link>
            </Button>
          </div>

          <div className="mt-6 flex flex-wrap gap-2.5">
            <GlassTag tone="neutral">Email</GlassTag>
            <GlassTag tone="neutral">Google</GlassTag>
            <GlassTag tone="neutral">Facebook</GlassTag>
            <GlassTag tone="success">Clerk</GlassTag>
          </div>

          <Card className="mt-8 rounded-xl border-border bg-muted/40 px-4 py-4 text-sm leading-6 text-muted-foreground shadow-none">
            Access posts, pages, analytics, and billing from one account.
          </Card>
        </div>

        <div className="bg-muted/30 p-6 sm:p-8 lg:p-10">
          <div className="mx-auto flex h-full max-w-md flex-col justify-center">
            <div className="mb-6">
              <p className="eyebrow text-[11px] text-primary">Secure access</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                Continue
              </h2>
            </div>

            {children}
          </div>
        </div>
      </section>
    </main>
  );
}
