'use client';

import type { ReactNode } from 'react';

import type { DashboardNavigationIcon } from '@/data/dashboard-navigation';

const iconMap: Record<DashboardNavigationIcon, ReactNode> = {
  overview: (
    <path
      d="M4 5.5A1.5 1.5 0 0 1 5.5 4h4A1.5 1.5 0 0 1 11 5.5v4A1.5 1.5 0 0 1 9.5 11h-4A1.5 1.5 0 0 1 4 9.5zm9 0A1.5 1.5 0 0 1 14.5 4h4A1.5 1.5 0 0 1 20 5.5v2A1.5 1.5 0 0 1 18.5 9h-4A1.5 1.5 0 0 1 13 7.5zm0 7A1.5 1.5 0 0 1 14.5 11h4A1.5 1.5 0 0 1 20 12.5v6a1.5 1.5 0 0 1-1.5 1.5h-4a1.5 1.5 0 0 1-1.5-1.5zm-9 0A1.5 1.5 0 0 1 5.5 11h4A1.5 1.5 0 0 1 11 12.5v2A1.5 1.5 0 0 1 9.5 16h-4A1.5 1.5 0 0 1 4 14.5z"
      fill="currentColor"
    />
  ),
  posts: (
    <path
      d="M6 4.75A1.75 1.75 0 0 1 7.75 3h8.5A1.75 1.75 0 0 1 18 4.75V21l-5-2.5L8 21V4.75A.75.75 0 0 0 7.25 4h-.5A.75.75 0 0 0 6 4.75m4 2.75h4.5m-4.5 4h4.5m-4.5 4h3"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.75"
    />
  ),
  scheduler: (
    <path
      d="M7 3.5v2m10-2v2M5.5 7h13A1.5 1.5 0 0 1 20 8.5v10a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18.5v-10A1.5 1.5 0 0 1 5.5 7m0 4h13M8 14h3m4 0h1"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.75"
    />
  ),
  analytics: (
    <path
      d="M5 18.5h14M7.5 16V9.5m4 6.5V6.5m4 9.5v-4"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.75"
    />
  ),
  comments: (
    <path
      d="M6 6.75A1.75 1.75 0 0 1 7.75 5h8.5A1.75 1.75 0 0 1 18 6.75v5.5A1.75 1.75 0 0 1 16.25 14H11l-3.75 3v-3H7.75A1.75 1.75 0 0 1 6 12.25zm3 2.75h6m-6 3h4"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.75"
    />
  ),
  accounts: (
    <path
      d="M12 12a3.5 3.5 0 1 0-3.5-3.5A3.5 3.5 0 0 0 12 12m-6 8a6 6 0 0 1 12 0m2.5-10.25a2.75 2.75 0 1 0-2.75-2.75 2.75 2.75 0 0 0 2.75 2.75"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.75"
    />
  ),
  billing: (
    <path
      d="M4 8.5h16m-14.5-3h13A1.5 1.5 0 0 1 20 7v10a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 17V7A1.5 1.5 0 0 1 5.5 5.5m7 8.5h4"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.75"
    />
  ),
  settings: (
    <path
      d="M12 9.25A2.75 2.75 0 1 0 14.75 12 2.75 2.75 0 0 0 12 9.25m7.5 2.75-.96-.34a7.7 7.7 0 0 0-.5-1.2l.47-.89a1 1 0 0 0-.18-1.2l-1.13-1.13a1 1 0 0 0-1.2-.18l-.89.47a7.7 7.7 0 0 0-1.2-.5L13.5 4.5a1 1 0 0 0-1-.75h-1a1 1 0 0 0-1 .75l-.34.96a7.7 7.7 0 0 0-1.2.5l-.89-.47a1 1 0 0 0-1.2.18L5.74 6.8a1 1 0 0 0-.18 1.2l.47.89a7.7 7.7 0 0 0-.5 1.2l-.96.34a1 1 0 0 0-.75 1v1a1 1 0 0 0 .75 1l.96.34a7.7 7.7 0 0 0 .5 1.2l-.47.89a1 1 0 0 0 .18 1.2l1.13 1.13a1 1 0 0 0 1.2.18l.89-.47a7.7 7.7 0 0 0 1.2.5l.34.96a1 1 0 0 0 1 .75h1a1 1 0 0 0 1-.75l.34-.96a7.7 7.7 0 0 0 1.2-.5l.89.47a1 1 0 0 0 1.2-.18l1.13-1.13a1 1 0 0 0 .18-1.2l-.47-.89a7.7 7.7 0 0 0 .5-1.2l.96-.34a1 1 0 0 0 .75-1v-1a1 1 0 0 0-.75-1"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
    />
  )
};

export function DashboardIcon({ icon }: { icon: DashboardNavigationIcon }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-5 w-5 shrink-0 text-primary"
    >
      {iconMap[icon]}
    </svg>
  );
}
