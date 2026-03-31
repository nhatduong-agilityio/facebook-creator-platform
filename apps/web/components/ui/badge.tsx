import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-md border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em]',
  {
    variants: {
      variant: {
        neutral:
          'border-[var(--line)] bg-[var(--panel-contrast)] text-[var(--muted-foreground)]',
        accent:
          'border-[color:color-mix(in_srgb,var(--accent)_24%,transparent)] bg-[var(--accent-soft)] text-[var(--accent-deep)]',
        secondary:
          'border-[color:color-mix(in_srgb,var(--accent-secondary)_24%,transparent)] bg-[var(--accent-secondary-soft)] text-[var(--accent-secondary)]',
        success:
          'border-[color:color-mix(in_srgb,var(--success)_24%,transparent)] bg-[var(--success-soft)] text-[var(--success)]',
        warning:
          'border-[color:color-mix(in_srgb,var(--warning)_24%,transparent)] bg-[var(--warning-soft)] text-[var(--warning)]',
        danger:
          'border-[color:color-mix(in_srgb,var(--danger)_24%,transparent)] bg-[var(--danger-soft)] text-[var(--danger)]'
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
