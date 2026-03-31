import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

export const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold transition-colors disabled:pointer-events-none disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] [&_svg]:pointer-events-none [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default:
          'bg-[var(--accent)] text-white hover:bg-[color:color-mix(in_srgb,var(--accent)_88%,white)]',
        secondary:
          'border border-[var(--line-strong)] bg-[var(--panel-strong)] text-[var(--foreground)] hover:border-[var(--accent)] hover:bg-[var(--panel-contrast)]',
        outline:
          'border border-[var(--line)] bg-transparent text-[var(--foreground)] hover:bg-[var(--panel-contrast)]',
        ghost: 'text-[var(--foreground)] hover:bg-[var(--panel-contrast)]',
        destructive:
          'surface-danger text-[var(--danger)] hover:border-[color:color-mix(in_srgb,var(--danger)_42%,transparent)]'
      },
      size: {
        default: 'h-11 px-4 py-2.5',
        sm: 'h-9 rounded-md px-3 text-xs',
        lg: 'h-12 rounded-xl px-5 text-sm',
        icon: 'h-10 w-10'
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'default'
    }
  }
);

export type ButtonProps = React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  };

export function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : 'button';

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}
