import * as React from 'react';

import { cn } from '@/lib/utils';

export const textareaClassName =
  'flex min-h-32 w-full rounded-lg border border-[var(--line-strong)] bg-[var(--panel-strong)] px-4 py-3 text-sm text-[var(--foreground)] outline-none transition placeholder:text-[var(--muted-foreground)] focus:border-[var(--accent)] focus-visible:ring-2 focus-visible:ring-[color:color-mix(in_srgb,var(--accent)_35%,transparent)] disabled:cursor-not-allowed disabled:opacity-50 resize-y aria-[invalid=true]:border-[color:color-mix(in_srgb,var(--danger)_44%,transparent)] aria-[invalid=true]:focus-visible:ring-[color:color-mix(in_srgb,var(--danger)_28%,transparent)]';

export type TextareaProps = React.ComponentProps<'textarea'> & {
  invalid?: boolean;
};

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, invalid = false, ...props }, ref) => {
    if (invalid) {
      return (
        <textarea
          ref={ref}
          data-slot="textarea"
          aria-invalid="true"
          className={cn(textareaClassName, className)}
          {...props}
        />
      );
    }

    return (
      <textarea
        ref={ref}
        data-slot="textarea"
        className={cn(textareaClassName, className)}
        {...props}
      />
    );
  }
);

Textarea.displayName = 'Textarea';
