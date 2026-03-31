import type { Metadata } from 'next';

import { CommentsView } from '@/features/dashboard/components/comments-view';

export const metadata: Metadata = {
  title: 'Comments'
};

export default function DashboardCommentsPage() {
  return <CommentsView />;
}
