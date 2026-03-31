import * as React from 'react';

import { cn } from '@/lib/utils';

const nativeSelectClassName =
  'flex h-11 w-full appearance-none rounded-lg border border-[var(--line-strong)] bg-[var(--panel-strong)] px-4 py-2.5 pr-10 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--accent)] focus-visible:ring-2 focus-visible:ring-[color:color-mix(in_srgb,var(--accent)_35%,transparent)] disabled:cursor-not-allowed disabled:opacity-50 aria-[invalid=true]:border-[color:color-mix(in_srgb,var(--danger)_44%,transparent)] aria-[invalid=true]:focus-visible:ring-[color:color-mix(in_srgb,var(--danger)_28%,transparent)]';

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
        className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-xs text-[var(--muted-foreground)]"
      >
        ▼
      </span>
    </div>
  );
});

NativeSelect.displayName = 'NativeSelect';
