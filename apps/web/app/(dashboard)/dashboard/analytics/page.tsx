import type { Metadata } from 'next';

import { AnalyticsView } from '@/features/dashboard/components/analytics-view';

export const metadata: Metadata = {
  title: 'Analytics'
};

export default function DashboardAnalyticsPage() {
  return <AnalyticsView />;
}
