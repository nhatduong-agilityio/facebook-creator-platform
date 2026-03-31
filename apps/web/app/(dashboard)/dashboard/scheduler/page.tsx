import type { Metadata } from 'next';

import { SchedulerView } from '@/features/dashboard/components/scheduler-view';

export const metadata: Metadata = {
  title: 'Scheduler'
};

export default function DashboardSchedulerPage() {
  return <SchedulerView />;
}
