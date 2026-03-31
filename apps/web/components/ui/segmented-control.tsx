'use client';

import { useId } from 'react';

type SegmentedControlOption<T extends string> = {
  label: string;
  value: T;
  title?: string;
};

export function SegmentedControl<T extends string>({
  legend,
  options,
  value,
  onChange,
  containerClassName = 'flex flex-wrap rounded-lg border border-[var(--line)] bg-[var(--panel-strong)] p-1',
  itemClassName = 'inline-flex rounded-md px-3 py-2 text-sm font-medium transition peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[var(--accent)]',
  activeClassName = 'bg-[var(--accent-soft)] text-[var(--accent-deep)]',
  inactiveClassName = 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
}: {
  legend: string;
  options: Array<SegmentedControlOption<T>>;
  value: T;
  onChange: (nextValue: T) => void;
  containerClassName?: string;
  itemClassName?: string;
  activeClassName?: string;
  inactiveClassName?: string;
}) {
  const groupName = useId();

  return (
    <fieldset className={containerClassName}>
      <legend className="sr-only">{legend}</legend>
      {options.map(option => {
        const checked = value === option.value;

        return (
          <label key={option.value} className="block cursor-pointer">
            <input
              type="radio"
              name={groupName}
              value={option.value}
              checked={checked}
              onChange={() => {
                onChange(option.value);
              }}
              className="sr-only peer"
            />
            <span
              title={option.title}
              className={`${itemClassName} ${
                checked ? activeClassName : inactiveClassName
              }`}
            >
              {option.label}
            </span>
          </label>
        );
      })}
    </fieldset>
  );
}
