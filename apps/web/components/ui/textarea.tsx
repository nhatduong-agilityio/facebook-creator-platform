import * as React from 'react';

import { cn } from '@/lib/utils';

export const textareaClassName =
  'flex min-h-32 w-full rounded-lg border border-input bg-background px-4 py-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50 resize-y aria-[invalid=true]:border-destructive aria-[invalid=true]:focus-visible:ring-destructive/20';

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
