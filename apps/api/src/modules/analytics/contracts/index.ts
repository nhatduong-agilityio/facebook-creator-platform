import type { PostStatus } from '@/shared/types/post';

export type AnalyticsOverviewDto = {
  totalPosts: number;
  scheduledPosts: number;
  publishedPosts: number;
  totalLikes: number;
  totalComments: number;
  totalReach: number;
  totalEngagement: number;
};

export type AnalyticsPostDto = {
  id: string;
  title: string | null;
  status: PostStatus;
  scheduledAt: Date | null;
  publishedAt: Date | null;
  facebookPostId: string | null;
  metrics: {
    likes: number;
    comments: number;
    reach: number;
    engagement: number;
    fetchedAt: Date | null;
  };
};
