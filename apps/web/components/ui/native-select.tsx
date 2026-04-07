import * as React from 'react';

import { cn } from '@/lib/utils';

const nativeSelectClassName =
  'flex h-11 w-full appearance-none rounded-lg border border-input bg-background px-4 py-2.5 pr-10 text-sm text-foreground outline-none transition focus-visible:ring-2 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50 aria-[invalid=true]:border-destructive aria-[invalid=true]:focus-visible:ring-destructive/20';

export type NativeSelectProps = React.ComponentProps<'select'> & {
  invalid?: boolean;
};

export const NativeSelect = React.forwardRef<
  HTMLSelectElement,
  NativeSelectProps
>(({ className, invalid = false, ...props }, ref) => {
  return (
    <div className="relative">
      {invalid ? (
        <select
          ref={ref}
          data-slot="select"
          aria-invalid="true"
          className={cn(nativeSelectClassName, className)}
          {...props}
        />
      ) : (
        <select
          ref={ref}
          data-slot="select"
          className={cn(nativeSelectClassName, className)}
          {...props}
        />
      )}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-xs text-muted-foreground"
      >
        ▼
      </span>
    </div>
  );
});

NativeSelect.displayName = 'NativeSelect';
