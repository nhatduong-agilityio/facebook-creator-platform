import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const alertVariants = cva(
  'relative w-full rounded-[1rem] border px-4 py-4 text-sm shadow-[var(--shadow-soft)]',
  {
    variants: {
      variant: {
        default:
          'border-[var(--line)] bg-[var(--panel-muted)] text-[var(--foreground)]',
        danger: 'surface-danger text-[var(--danger)]',
        success: 'surface-success text-[var(--success)]',
        warning: 'surface-warning text-[var(--warning)]'
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
