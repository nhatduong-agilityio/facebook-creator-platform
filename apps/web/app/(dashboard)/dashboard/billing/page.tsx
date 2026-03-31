import type { Metadata } from 'next';

import { BillingView } from '@/features/dashboard/components/billing-view';

export const metadata: Metadata = {
  title: 'Billing'
};

export default function DashboardBillingPage() {
  return <BillingView />;
}
