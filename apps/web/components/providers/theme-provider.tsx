'use client';

import {
  createContext,
  startTransition,
  useContext,
  useEffect,
  useMemo,
  useState
} from 'react';

export type ThemePreference = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

type ThemeContextValue = {
  theme: ThemePreference;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: ThemePreference) => void;
};

const STORAGE_KEY = 'fcp-theme';
const ThemeContext = createContext<ThemeContextValue | null>(null);

function getStoredTheme(): ThemePreference {
  if (typeof window === 'undefined') {
    return 'system';
  }

  const theme = window.localStorage.getItem(STORAGE_KEY);

  return theme === 'light' || theme === 'dark' || theme === 'system'
    ? theme
    : 'system';
}

function resolveTheme(theme: ThemePreference): ResolvedTheme {
  if (theme === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  }

  return theme;
}

function applyResolvedTheme(theme: ResolvedTheme) {
  document.documentElement.classList.toggle('dark', theme === 'dark');
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
}

export function ThemeProvider({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [theme, setThemeState] = useState<ThemePreference>(() => {
    return typeof window === 'undefined' ? 'system' : getStoredTheme();
  });
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>(() => {
    if (typeof window === 'undefined') {
      return 'light';
    }

    return resolveTheme('system');
  });
  const resolvedTheme = theme === 'system' ? systemTheme : theme;

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleThemeChange = () => {
      setSystemTheme(mediaQuery.matches ? 'dark' : 'light');
    };

    mediaQuery.addEventListener('change', handleThemeChange);

    return () => {
      mediaQuery.removeEventListener('change', handleThemeChange);
    };
  }, []);

  useEffect(() => {
    applyResolvedTheme(resolvedTheme);
  }, [resolvedTheme]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      resolvedTheme,
      setTheme: (nextTheme: ThemePreference) => {
        window.localStorage.setItem(STORAGE_KEY, nextTheme);

        startTransition(() => {
          setThemeState(nextTheme);
        });
      }
    }),
    [resolvedTheme, theme]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error('useTheme must be used inside ThemeProvider.');
  }

  return context;
}
