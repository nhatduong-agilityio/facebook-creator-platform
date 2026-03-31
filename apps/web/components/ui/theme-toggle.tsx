'use client';

import { useSyncExternalStore } from 'react';

import { SegmentedControl } from '@/components/ui/segmented-control';
import {
  useTheme,
  type ThemePreference
} from '@/components/providers/theme-provider';

const options: Array<{
  label: string;
  value: ThemePreference;
}> = [
  { label: 'Light', value: 'light' },
  { label: 'System', value: 'system' },
  { label: 'Dark', value: 'dark' }
];

const emptySubscribe = () => () => {};

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const { theme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  if (!mounted) {
    return (
      <div
        className={`theme-control ${compact ? 'theme-control-compact' : ''}`}
        aria-hidden="true"
      >
        {options.map(option => (
          <span key={option.value} className="theme-control-button">
            <span className="text-sm font-medium">{option.label}</span>
          </span>
        ))}
      </div>
    );
  }

  return (
    <SegmentedControl
      legend="Theme"
      options={options}
      value={theme}
      onChange={setTheme}
      containerClassName={`theme-control ${compact ? 'theme-control-compact' : ''}`}
      itemClassName="theme-control-button"
      activeClassName="theme-control-button-active"
      inactiveClassName=""
    />
  );
}
