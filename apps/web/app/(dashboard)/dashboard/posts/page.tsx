import type { Metadata } from 'next';

import { PostsView } from '@/features/dashboard/components/posts-view';

export const metadata: Metadata = {
  title: 'Posts'
};

export default function DashboardPostsPage() {
  return <PostsView />;
}
