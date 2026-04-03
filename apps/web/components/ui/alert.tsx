import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const alertVariants = cva(
  'relative w-full rounded-xl border px-4 py-4 text-sm shadow-sm',
  {
    variants: {
      variant: {
        default: 'border-border bg-card text-card-foreground',
        danger: 'border-destructive/20 bg-destructive/10 text-destructive',
        success:
          'border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
        warning:
          'border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-400'
      }
    },
    defaultVariants: {
      variant: 'default'
    }
  }
);

export type AlertProps = React.ComponentProps<'div'> &
  VariantProps<typeof alertVariants>;

export function Alert({ className, variant, ...props }: AlertProps) {
  return (
    <div
      role="alert"
      data-slot="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    />
  );
}

export function AlertTitle({
  className,
  ...props
}: React.ComponentProps<'h5'>) {
  return (
    <h5
      data-slot="alert-title"
      className={cn('font-semibold tracking-[-0.02em]', className)}
      {...props}
    />
  );
}

export function AlertDescription({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="alert-description"
      className={cn('mt-2 leading-6', className)}
      {...props}
    />
  );
}
