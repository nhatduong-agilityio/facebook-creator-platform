import type { Route } from 'next';

export type DashboardNavigationItem = {
  href: Route;
  label: string;
  shortLabel: string;
  icon: DashboardNavigationIcon;
};

export type DashboardNavigationIcon =
  | 'overview'
  | 'posts'
  | 'scheduler'
  | 'analytics'
  | 'comments'
  | 'accounts'
  | 'billing'
  | 'settings';

export const dashboardNavigation: DashboardNavigationItem[] = [
  {
    href: '/dashboard',
    label: 'Overview',
    shortLabel: 'Overview',
    icon: 'overview'
  },
  {
    href: '/dashboard/posts',
    label: 'Posts',
    shortLabel: 'Posts',
    icon: 'posts'
  },
  {
    href: '/dashboard/scheduler',
    label: 'Scheduler',
    shortLabel: 'Scheduler',
    icon: 'scheduler'
  },
  {
    href: '/dashboard/analytics',
    label: 'Analytics',
    shortLabel: 'Analytics',
    icon: 'analytics'
  },
  {
    href: '/dashboard/comments',
    label: 'Comments',
    shortLabel: 'Comments',
    icon: 'comments'
  },
  {
    href: '/dashboard/accounts',
    label: 'Accounts',
    shortLabel: 'Accounts',
    icon: 'accounts'
  },
  {
    href: '/dashboard/billing',
    label: 'Billing',
    shortLabel: 'Billing',
    icon: 'billing'
  },
  {
    href: '/dashboard/settings',
    label: 'Settings',
    shortLabel: 'Settings',
    icon: 'settings'
  }
];
