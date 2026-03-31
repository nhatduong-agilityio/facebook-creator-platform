import type { Metadata } from 'next';

import { SettingsView } from '@/features/dashboard/components/settings-view';

export const metadata: Metadata = {
  title: 'Settings'
};

export default function DashboardSettingsPage() {
  return <SettingsView />;
}
