'use client';

import { useSyncExternalStore } from 'react';
import { LaptopMinimal, Moon, SunMedium } from 'lucide-react';
import type { ReactNode } from 'react';

import { SegmentedControl } from '@/components/ui/segmented-control';
import {
  useTheme,
  type ThemePreference
} from '@/components/providers/theme-provider';

const options: Array<{
  label: ReactNode;
  value: ThemePreference;
  title: string;
}> = [
  {
    label: (
      <>
        <SunMedium className="h-4 w-4" />
        <span className="sr-only">Light</span>
      </>
    ),
    value: 'light',
    title: 'Light'
  },
  {
    label: (
      <>
        <LaptopMinimal className="h-4 w-4" />
        <span className="sr-only">System</span>
      </>
    ),
    value: 'system',
    title: 'System'
  },
  {
    label: (
      <>
        <Moon className="h-4 w-4" />
        <span className="sr-only">Dark</span>
      </>
    ),
    value: 'dark',
    title: 'Dark'
  }
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
            {option.label}
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
