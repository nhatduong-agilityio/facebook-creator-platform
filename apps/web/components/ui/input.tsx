import * as React from 'react';

import { cn } from '@/lib/utils';

export const inputClassName =
  'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm outline-none transition placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50 aria-[invalid=true]:border-destructive aria-[invalid=true]:focus-visible:ring-destructive/20';

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
