import type { Metadata } from 'next';

import { OverviewView } from '@/features/dashboard/components/overview-view';

export const metadata: Metadata = {
  title: 'Dashboard'
};

export default function DashboardHomePage() {
  return <OverviewView />;
}
