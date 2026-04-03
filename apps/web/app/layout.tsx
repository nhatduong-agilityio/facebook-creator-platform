import type { Metadata } from 'next';
import Script from 'next/script';

import { AppProviders } from '@/components/providers/app-providers';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Facebook Creator Platform',
    template: '%s | Facebook Creator Platform'
  },
  description: 'Facebook posts, analytics, and billing.',
  applicationName: 'Facebook Creator Platform'
};

const themeScript = `
  (() => {
    const storageKey = 'fcp-theme';
    const root = document.documentElement;
    const storedTheme = window.localStorage.getItem(storageKey);
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
    const theme =
      storedTheme === 'light' || storedTheme === 'dark'
        ? storedTheme
        : systemTheme;

    root.classList.toggle('dark', theme === 'dark');
    root.dataset.theme = theme;
    root.style.colorScheme = theme;
  })();
`;

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full">
        <a href="#main-content" className="skip-link">
          Skip to content
        </a>
        <Script id="theme-init" strategy="beforeInteractive">
          {themeScript}
        </Script>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
