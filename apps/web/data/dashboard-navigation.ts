import type { Route } from 'next';

export type DashboardNavigationItem = {
  href: Route;
  label: string;
  shortLabel: string;
  description: string;
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
    description: 'Account, plan, and activity summary.',
    icon: 'overview'
  },
  {
    href: '/dashboard/posts',
    label: 'Posts',
    shortLabel: 'Posts',
    description: 'Create, preview, and manage content.',
    icon: 'posts'
  },
  {
    href: '/dashboard/scheduler',
    label: 'Scheduler',
    shortLabel: 'Scheduler',
    description: 'Plan content in weekly and monthly views.',
    icon: 'scheduler'
  },
  {
    href: '/dashboard/analytics',
    label: 'Analytics',
    shortLabel: 'Analytics',
    description: 'Review growth, reach, and top performers.',
    icon: 'analytics'
  },
  {
    href: '/dashboard/comments',
    label: 'Comments',
    shortLabel: 'Comments',
    description: 'See comment activity in one inbox.',
    icon: 'comments'
  },
  {
    href: '/dashboard/accounts',
    label: 'Accounts',
    shortLabel: 'Accounts',
    description: 'Connect Facebook pages.',
    icon: 'accounts'
  },
  {
    href: '/dashboard/billing',
    label: 'Billing',
    shortLabel: 'Billing',
    description: 'Review plans and upgrade.',
    icon: 'billing'
  },
  {
    href: '/dashboard/settings',
    label: 'Settings',
    shortLabel: 'Settings',
    description: 'Review workspace defaults and account access.',
    icon: 'settings'
  }
];
