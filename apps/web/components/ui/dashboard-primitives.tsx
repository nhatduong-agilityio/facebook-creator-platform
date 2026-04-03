'use client';

import type { ReactNode } from 'react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader
} from '@/components/ui/card';
import { getErrorMessage } from '@/lib/api';
import { cn } from '@/lib/utils';

type Accent = 'blue' | 'teal' | 'coral';

const accentClasses: Record<
  Accent,
  {
    dot: string;
  }
> = {
  blue: {
    dot: 'bg-[var(--accent)]'
  },
  teal: {
    dot: 'bg-[var(--accent-secondary)]'
  },
  coral: {
    dot: 'bg-[var(--danger)]'
  }
};

export const subtlePanelClassName =
  'rounded-xl border border-border bg-muted/40 shadow-sm';
export const tilePanelClassName =
  'rounded-lg border border-border bg-background';
export const glassFieldsetClassName = 'glass-fieldset rounded-xl p-5';
export const successPanelClassName =
  'rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400';
export const warningPanelClassName =
  'rounded-xl border border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-400';
export const dangerPanelClassName =
  'rounded-xl border border-destructive/20 bg-destructive/10 text-destructive';

export function GlassTag({
  children,
  tone = 'neutral'
}: {
  children: ReactNode;
  tone?: 'neutral' | 'accent' | 'success' | 'warning';
}) {
  const tones = {
    neutral: 'text-[var(--foreground-soft)]',
    accent: 'border-primary/20 bg-primary/10 text-primary',
    success:
      'border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    warning:
      'border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-400'
  };

  return (
    <Badge
      variant="neutral"
      className={cn(
        'glass-tag border px-3 py-1.5 text-[11px] tracking-[0.12em]',
        tones[tone]
      )}
    >
      {children}
    </Badge>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  tags
}: {
  eyebrow: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  tags?: ReactNode;
}) {
  return (
    <section className="space-y-2 border-b border-border pb-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-3xl">
          <p className="eyebrow text-[11px] text-primary">{eyebrow}</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
            {title}
          </h1>
          {description ? (
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>

        {actions ? (
          <div className="flex flex-wrap items-center gap-3">{actions}</div>
        ) : null}
      </div>

      {tags ? <div className="flex flex-wrap gap-2.5">{tags}</div> : null}
    </section>
  );
}

export function SectionCard({
  children,
  className = ''
}: {
  children: ReactNode;
  className?: string;
}) {
  return <Card className={cn('surface-panel p-5', className)}>{children}</Card>;
}

export function SectionHeading({
  eyebrow,
  title,
  description
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <header>
      <p className="eyebrow text-[11px] text-primary">{eyebrow}</p>
      <h2 className="mt-2 text-xl font-semibold tracking-tight sm:text-2xl">
        {title}
      </h2>
      {description ? (
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          {description}
        </p>
      ) : null}
    </header>
  );
}

export function MetricCard({
  label,
  value,
  accent,
  hint
}: {
  label: string;
  value: string | number;
  accent: Accent;
  hint?: string;
}) {
  const accentStyle = accentClasses[accent];

  return (
    <Card className="bg-[var(--panel)]">
      <CardHeader className="pb-0">
        <div className="flex items-center gap-2">
          <span className={`h-2.5 w-2.5 rounded-full ${accentStyle.dot}`} />
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            {label}
          </p>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="flex items-end justify-between gap-4">
          <p className="text-[2.25rem] font-semibold leading-none tracking-tight">
            {value}
          </p>
          <div className="hidden h-9 w-9 rounded-full border border-border bg-muted lg:flex lg:items-center lg:justify-center">
            <span className={`h-2.5 w-2.5 rounded-full ${accentStyle.dot}`} />
          </div>
        </div>
        {hint ? (
          <CardDescription className="mt-3">{hint}</CardDescription>
        ) : null}
      </CardContent>
    </Card>
  );
}

export function InfoRow({
  label,
  value,
  mono = false
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div
      className={cn(
        tilePanelClassName,
        'flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:justify-between'
      )}
    >
      <span className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </span>
      <span
        className={`text-sm text-foreground ${
          mono ? 'font-mono break-all' : ''
        }`}
      >
        {value}
      </span>
    </div>
  );
}

export function StatusBadge({
  tone,
  children
}: {
  tone: 'free' | 'pro' | 'connected' | 'warning' | 'danger' | 'muted';
  children: ReactNode;
}) {
  const tones = {
    free: 'secondary',
    pro: 'accent',
    connected: 'success',
    warning: 'warning',
    danger: 'danger',
    muted: 'neutral'
  } as const;

  return <Badge variant={tones[tone]}>{children}</Badge>;
}

export function EmptyState({
  title,
  description,
  action
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <Card className="border-dashed border-[var(--line-strong)] bg-[var(--panel-muted)] px-5 py-8 text-center shadow-none">
      <p className="text-lg font-semibold">{title}</p>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
        {description}
      </p>
      {action ? <div className="mt-5">{action}</div> : null}
    </Card>
  );
}

export function ErrorCallout({
  title,
  error,
  className = ''
}: {
  title: string;
  error: unknown;
  className?: string;
}) {
  const message = getErrorMessage(error);

  return (
    <Alert
      role="alert"
      aria-live="assertive"
      variant="danger"
      className={cn('text-sm', className)}
    >
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}

export function LoadingPanel({ label }: { label: string }) {
  return (
    <Alert
      role="status"
      aria-live="polite"
      variant="default"
      className="bg-muted/40 px-5 py-6 text-muted-foreground"
    >
      <AlertDescription className="mt-0">{label}</AlertDescription>
    </Alert>
  );
}

export function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return (
    <p role="alert" className="mt-2 text-xs text-[var(--danger)]">
      {message}
    </p>
  );
}

export const primaryButtonClassName = buttonVariants({
  variant: 'default',
  size: 'default'
});

export const secondaryButtonClassName = buttonVariants({
  variant: 'secondary',
  size: 'default'
});
