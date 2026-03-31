'use client';

import { forwardRef, type ComponentPropsWithoutRef } from 'react';

import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';
import { Textarea } from '@/components/ui/textarea';

type InputControlProps = ComponentPropsWithoutRef<'input'> & {
  invalid?: boolean;
};

type SelectControlProps = ComponentPropsWithoutRef<'select'> & {
  invalid?: boolean;
};

type TextAreaControlProps = ComponentPropsWithoutRef<'textarea'> & {
  invalid?: boolean;
};

export const InputControl = forwardRef<HTMLInputElement, InputControlProps>(
  ({ className, invalid = false, ...props }, ref) => {
    return (
      <Input ref={ref} className={className} invalid={invalid} {...props} />
    );
  }
);

InputControl.displayName = 'InputControl';

export const SelectControl = forwardRef<HTMLSelectElement, SelectControlProps>(
  ({ className, invalid = false, ...props }, ref) => {
    return (
      <NativeSelect
        ref={ref}
        className={className}
        invalid={invalid}
        {...props}
      />
    );
  }
);

SelectControl.displayName = 'SelectControl';

export const TextAreaControl = forwardRef<
  HTMLTextAreaElement,
  TextAreaControlProps
>(({ className, invalid = false, ...props }, ref) => {
  return (
    <Textarea ref={ref} className={className} invalid={invalid} {...props} />
  );
});

TextAreaControl.displayName = 'TextAreaControl';
