import type { Metadata } from 'next';

import { AccountsView } from '@/features/dashboard/components/accounts-view';

export const metadata: Metadata = {
  title: 'Accounts'
};

export default function DashboardAccountsPage() {
  return <AccountsView />;
}
