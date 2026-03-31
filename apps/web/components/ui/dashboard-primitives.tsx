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
  'rounded-[1rem] border border-[var(--line)] bg-[var(--panel-muted)] shadow-[var(--shadow-soft)]';
export const tilePanelClassName =
  'rounded-[0.9rem] border border-[var(--line)] bg-[var(--panel-contrast)]';
export const glassFieldsetClassName = 'glass-fieldset rounded-[1rem] p-5';
export const successPanelClassName =
  'rounded-[1rem] surface-success text-[var(--success)]';
export const warningPanelClassName =
  'rounded-[1rem] surface-warning text-[var(--warning)]';
export const dangerPanelClassName =
  'rounded-[1rem] surface-danger text-[var(--danger)]';

export function GlassTag({
  children,
  tone = 'neutral'
}: {
  children: ReactNode;
  tone?: 'neutral' | 'accent' | 'success' | 'warning';
}) {
  const tones = {
    neutral: 'text-[var(--foreground-soft)]',
    accent:
      'border-[color:color-mix(in_srgb,var(--accent)_26%,transparent)] bg-[var(--accent-soft)] text-[var(--accent-deep)]',
    success:
      'border-[color:color-mix(in_srgb,var(--success)_26%,transparent)] bg-[var(--success-soft)] text-[var(--success)]',
    warning:
      'border-[color:color-mix(in_srgb,var(--warning)_26%,transparent)] bg-[var(--warning-soft)] text-[var(--warning)]'
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
  description: string;
  actions?: ReactNode;
  tags?: ReactNode;
}) {
  return (
    <section className="space-y-3 border-b border-[var(--line)] pb-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-3xl">
          <p className="eyebrow text-[11px] text-[var(--accent-secondary)]">
            {eyebrow}
          </p>
          <h1 className="mt-2 text-[1.75rem] font-semibold tracking-[-0.045em] sm:text-[2rem]">
            {title}
          </h1>
          <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)] sm:text-[15px]">
            {description}
          </p>
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
  description: string;
}) {
  return (
    <header>
      <p className="eyebrow text-[11px] text-[var(--accent-secondary)]">
        {eyebrow}
      </p>
      <h2 className="mt-2 text-[1.35rem] font-semibold tracking-[-0.03em]">
        {title}
      </h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted-foreground)]">
        {description}
      </p>
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
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--muted-foreground)]">
            {label}
          </p>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="flex items-end justify-between gap-4">
          <p className="text-[2.5rem] font-semibold leading-none tracking-[-0.06em]">
            {value}
          </p>
          <div className="hidden h-9 w-9 rounded-full border border-[var(--line)] bg-[var(--panel-contrast)] lg:flex lg:items-center lg:justify-center">
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
      <span className="text-xs uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
        {label}
      </span>
      <span
        className={`text-sm text-[var(--foreground)] ${
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
      <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-[var(--muted-foreground)]">
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
      className="bg-[var(--panel-muted)] px-5 py-6 text-[var(--muted-foreground)]"
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
