import * as React from 'react';

import { cn } from '@/lib/utils';

const cardBaseClassName =
  'rounded-[1.1rem] border border-[var(--line)] bg-[var(--panel)] text-[var(--foreground)] shadow-[var(--shadow-soft)]';

export function Card({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card"
      className={cn(cardBaseClassName, className)}
      {...props}
    />
  );
}

export function CardHeader({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-header"
      className={cn('flex flex-col gap-2 p-5', className)}
      {...props}
    />
  );
}

export function CardTitle({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-title"
      className={cn(
        'text-[1.35rem] font-semibold tracking-[-0.03em] text-[var(--foreground)]',
        className
      )}
      {...props}
    />
  );
}

export function CardDescription({
  className,
  ...props
}: React.ComponentProps<'p'>) {
  return (
    <p
      data-slot="card-description"
      className={cn(
        'text-sm leading-6 text-[var(--muted-foreground)]',
        className
      )}
      {...props}
    />
  );
}

export function CardContent({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-content"
      className={cn('p-5 pt-0', className)}
      {...props}
    />
  );
}

export function CardFooter({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-footer"
      className={cn('flex items-center gap-3 p-5 pt-0', className)}
      {...props}
    />
  );
}
