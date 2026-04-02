// Shared
import { BaseService } from '@/shared/service';
import { NotFoundError } from '@/shared/errors/errors';
import { POST_STATUSES } from '@/shared/constants/post';

// Types
import type { AnalyticsServicePort, PostMetricRepositoryPort } from '../ports';
import type { UserLookupPort } from '@/modules/users/ports';
import type { PostRepositoryPort } from '@/modules/posts/ports';
import type {
  FacebookAccountRepositoryPort,
  FacebookServicePort
} from '@/modules/facebook/ports';
import type { AuditLogWriterPort } from '@/modules/audit-logs/ports';
import type { AnalyticsOverviewDto, AnalyticsPostDto } from '../contracts';
import type { UserEntity } from '@/modules/users/entity';

export class AnalyticsService
  extends BaseService
  implements AnalyticsServicePort
{
  constructor(
    private readonly userRepo: UserLookupPort,
    private readonly postRepo: PostRepositoryPort,
    private readonly postMetricRepo: PostMetricRepositoryPort,
    private readonly facebookAccountRepo: FacebookAccountRepositoryPort,
    private readonly facebookService: FacebookServicePort,
    private readonly auditLogRepo: AuditLogWriterPort
  ) {
    super();
  }

  /**
   * Retrieves an overview of the user's analytics.
   * @param {string} userId - the ID of the user
   * @returns {Promise<AnalyticsOverviewDto>} - a promise that resolves to an overview of the user's analytics
   */
  async getOverview(userId: string): Promise<AnalyticsOverviewDto> {
    const user = await this.requireUser(userId);
    const posts = await this.postRepo.findAllByUserId(user.id);
    const latestMetrics = await this.postMetricRepo.findLatestByPostIds(
      posts.map(post => post.id)
    );

    return posts.reduce(
      (summary, post) => {
        const metrics = latestMetrics.get(post.id);

        summary.totalPosts += 1;
        if (post.status === POST_STATUSES[1]) {
          summary.scheduledPosts += 1;
        }
        if (post.status === POST_STATUSES[2]) {
          summary.publishedPosts += 1;
        }
        summary.totalLikes += metrics?.likes ?? 0;
        summary.totalComments += metrics?.comments ?? 0;
        summary.totalReach += metrics?.reach ?? 0;
        summary.totalEngagement += metrics?.engagement ?? 0;

        return summary;
      },
      {
        totalPosts: 0,
        scheduledPosts: 0,
        publishedPosts: 0,
        totalLikes: 0,
        totalComments: 0,
        totalReach: 0,
        totalEngagement: 0
      }
    );
  }

  /**
   * Retrieves an array of analytics for the user's posts.
   * The analytics include the post's title, status, scheduled date, published date, and Facebook post ID.
   * The metrics include the post's likes, comments, reach, engagement, and the date the metrics were last fetched.
   * @param {string} userId - the ID of the user
   * @returns {Promise<AnalyticsPostDto[]>} - a promise that resolves to an array of analytics for the user's posts
   */
  async getPostAnalytics(userId: string): Promise<AnalyticsPostDto[]> {
    const user = await this.requireUser(userId);
    const posts = await this.postRepo.findAllByUserId(user.id);
    const latestMetrics = await this.postMetricRepo.findLatestByPostIds(
      posts.map(post => post.id)
    );

    return posts.map(post => {
      const metrics = latestMetrics.get(post.id);

      return {
        id: post.id,
        title: post.title,
        status: post.status,
        scheduledAt: post.scheduledAt,
        publishedAt: post.publishedAt,
        facebookPostId: post.facebookPostId,
        metrics: {
          likes: metrics?.likes ?? 0,
          comments: metrics?.comments ?? 0,
          reach: metrics?.reach ?? 0,
          engagement: metrics?.engagement ?? 0,
          fetchedAt: metrics?.fetchedAt ?? null
        }
      };
    });
  }

  /**
   * Refreshes the metrics for a published post.
   * The metrics include the post's likes, comments, reach, engagement, and the date the metrics were last fetched.
   * If the post is not found or does not have a Facebook post ID, a NotFoundError is thrown.
   * If the Facebook account associated with the post is not found, a NotFoundError is thrown.
   * @throws {NotFoundError} - if the post or Facebook account is not found
   * @param {string} postId - the ID of the post to refresh
   */
  async refreshPostMetrics(postId: string): Promise<void> {
    const post = await this.postRepo.findById(postId);

    if (!post || !post.facebookPostId || !post.facebookAccountId) {
      throw new NotFoundError('Published post not found for metrics sync');
    }

    const account = await this.facebookAccountRepo.findByIdForUser(
      post.facebookAccountId,
      post.userId
    );

    if (!account) {
      throw new NotFoundError('Facebook account not found for metrics sync');
    }

    const metrics = await this.facebookService.fetchPostMetrics(
      account,
      post.facebookPostId
    );

    await this.postMetricRepo.createSnapshot({
      postId: post.id,
      likes: metrics.likes,
      comments: metrics.comments,
      reach: metrics.reach,
      engagement: metrics.engagement,
      fetchedAt: new Date()
    });

    await this.auditLogRepo.createEntry({
      userId: post.userId,
      action: 'analytics.metrics.synced',
      entityType: 'post_metric',
      entityId: post.id
    });
  }

  /**
   * Refreshes the metrics for all published posts associated with a user.
   * Returns the number of published posts that were refreshed.
   * @param {string} userId - the user ID
   * @returns {Promise<number>} - a promise that resolves to the number of published posts that were refreshed
   */
  async refreshUserMetrics(userId: string): Promise<number> {
    const user = await this.requireUser(userId);
    const posts = await this.postRepo.findAllByUserId(user.id);
    const publishedPosts = posts.filter(
      post => post.status === POST_STATUSES[2] && post.facebookPostId
    );

    for (const post of publishedPosts) {
      await this.refreshPostMetrics(post.id);
    }

    return publishedPosts.length;
  }

  private async requireUser(clerkUserId: string): Promise<UserEntity> {
    const user = await this.userRepo.findByClerkId(clerkUserId);

    if (!user) {
      throw new NotFoundError('User not found');
    }

    return user;
  }
}
