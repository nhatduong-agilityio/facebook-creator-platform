import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-[0.08em]',
  {
    variants: {
      variant: {
        neutral: 'border-border bg-muted text-muted-foreground',
        accent: 'border-primary/20 bg-primary/10 text-primary',
        secondary:
          'border-transparent bg-[var(--accent-secondary-soft)] text-[var(--accent-secondary)]',
        success:
          'border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
        warning:
          'border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-400',
        danger: 'border-destructive/20 bg-destructive/10 text-destructive'
      }
    },
    defaultVariants: {
      variant: 'neutral'
    }
  }
);

export type BadgeProps = React.ComponentProps<'span'> &
  VariantProps<typeof badgeVariants>;

export function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}
