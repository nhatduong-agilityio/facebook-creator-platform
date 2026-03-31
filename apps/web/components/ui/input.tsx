import * as React from 'react';

import { cn } from '@/lib/utils';

export const inputClassName =
  'flex h-11 w-full rounded-lg border border-[var(--line-strong)] bg-[var(--panel-strong)] px-4 py-2.5 text-sm text-[var(--foreground)] outline-none transition placeholder:text-[var(--muted-foreground)] focus:border-[var(--accent)] focus-visible:ring-2 focus-visible:ring-[color:color-mix(in_srgb,var(--accent)_35%,transparent)] disabled:cursor-not-allowed disabled:opacity-50 aria-[invalid=true]:border-[color:color-mix(in_srgb,var(--danger)_44%,transparent)] aria-[invalid=true]:focus-visible:ring-[color:color-mix(in_srgb,var(--danger)_28%,transparent)]';

export type InputProps = React.ComponentProps<'input'> & {
  invalid?: boolean;
};

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, invalid = false, ...props }, ref) => {
    if (invalid) {
      return (
        <input
          ref={ref}
          data-slot="input"
          aria-invalid="true"
          className={cn(inputClassName, className)}
          {...props}
        />
      );
    }

    return (
      <input
        ref={ref}
        data-slot="input"
        className={cn(inputClassName, className)}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';
