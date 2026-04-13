import type { AnalyticsOverviewDto, AnalyticsPostDto } from '../contracts';
import type { PostMetricEntity } from '../entity';

export interface PostMetricRepositoryPort {
  createSnapshot(data: {
    postId: string;
    likes: number;
    comments: number;
    reach: number;
    engagement: number;
    fetchedAt: Date;
  }): Promise<PostMetricEntity>;
  findLatestByPostIds(
    postIds: string[]
  ): Promise<Map<string, PostMetricEntity>>;
}

export interface AnalyticsServicePort {
  getOverview(userId: string): Promise<AnalyticsOverviewDto>;
  getPostAnalytics(userId: string): Promise<AnalyticsPostDto[]>;
  refreshPostMetrics(postId: string): Promise<void>;
  refreshUserMetrics(userId: string): Promise<number>;
  refreshAllMetrics(): Promise<number>;
}
