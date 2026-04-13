/* eslint-disable @typescript-eslint/unbound-method */
import { mock, type MockProxy } from 'jest-mock-extended';

import type { AuditLogWriterPort } from '@/modules/audit-logs/ports';
import type { PostMetricRepositoryPort } from '@/modules/analytics/ports';
import { AnalyticsService } from '@/modules/analytics/service';
import type {
  FacebookAccountRepositoryPort,
  FacebookServicePort
} from '@/modules/facebook/ports';
import type { PostRepositoryPort } from '@/modules/posts/ports';
import type { UserLookupPort } from '@/modules/users/ports';
import {
  makeFacebookAccount,
  makeMetric,
  makePost,
  makeUser
} from '@/__tests__/helpers/fixtures';

describe('AnalyticsService', () => {
  let userRepo: MockProxy<UserLookupPort>;
  let postRepo: MockProxy<PostRepositoryPort>;
  let postMetricRepo: MockProxy<PostMetricRepositoryPort>;
  let facebookAccountRepo: MockProxy<FacebookAccountRepositoryPort>;
  let facebookService: MockProxy<FacebookServicePort>;
  let auditLogRepo: MockProxy<AuditLogWriterPort>;
  let service: AnalyticsService;

  beforeEach(() => {
    userRepo = mock<UserLookupPort>();
    postRepo = mock<PostRepositoryPort>();
    postMetricRepo = mock<PostMetricRepositoryPort>();
    facebookAccountRepo = mock<FacebookAccountRepositoryPort>();
    facebookService = mock<FacebookServicePort>();
    auditLogRepo = mock<AuditLogWriterPort>();
    service = new AnalyticsService(
      userRepo,
      postRepo,
      postMetricRepo,
      facebookAccountRepo,
      facebookService,
      auditLogRepo
    );
  });

  it('aggregates overview metrics from posts and snapshots', async () => {
    const user = makeUser();
    const draft = makePost({ id: 'post-1', status: 'draft' });
    const published = makePost({
      id: 'post-2',
      status: 'published',
      facebookPostId: 'fb-post-2'
    });
    userRepo.findByClerkId.mockResolvedValue(user);
    postRepo.findAllByUserId.mockResolvedValue([draft, published]);
    postMetricRepo.findLatestByPostIds.mockResolvedValue(
      new Map([
        [
          'post-2',
          makeMetric({
            postId: 'post-2',
            likes: 4,
            comments: 3,
            reach: 20,
            engagement: 27
          })
        ]
      ])
    );

    const result = await service.getOverview(user.clerkUserId);

    expect(result).toEqual({
      totalPosts: 2,
      scheduledPosts: 0,
      publishedPosts: 1,
      totalLikes: 4,
      totalComments: 3,
      totalReach: 20,
      totalEngagement: 27
    });
  });

  it('refreshes published post metrics and stores a snapshot', async () => {
    const post = makePost({
      id: 'post-1',
      status: 'published',
      facebookPostId: 'fb-post-1'
    });
    postRepo.findById.mockResolvedValue(post);
    facebookAccountRepo.findByIdForUser.mockResolvedValue(
      makeFacebookAccount()
    );
    facebookService.fetchPostMetrics.mockResolvedValue({
      likes: 5,
      comments: 2,
      reach: 30,
      engagement: 37
    });
    postMetricRepo.createSnapshot.mockResolvedValue(makeMetric());

    await service.refreshPostMetrics(post.id);

    expect(postMetricRepo.createSnapshot).toHaveBeenCalledWith(
      expect.objectContaining({
        postId: post.id,
        likes: 5,
        comments: 2,
        reach: 30,
        engagement: 37
      })
    );
    expect(auditLogRepo.createEntry).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'analytics.metrics.synced',
        entityId: post.id
      })
    );
  });

  it('refreshes stale post metrics before returning post analytics', async () => {
    const user = makeUser();
    const post = makePost({
      id: 'post-1',
      status: 'published',
      facebookPostId: 'fb-post-1'
    });
    userRepo.findByClerkId.mockResolvedValue(user);
    postRepo.findAllByUserId.mockResolvedValue([post]);
    postMetricRepo.findLatestByPostIds
      .mockResolvedValueOnce(new Map())
      .mockResolvedValueOnce(
        new Map([['post-1', makeMetric({ postId: 'post-1' })]])
      );
    const refreshSpy = jest
      .spyOn(service, 'refreshPostMetrics')
      .mockResolvedValue(undefined);

    const result = await service.getPostAnalytics(user.clerkUserId);

    expect(refreshSpy).toHaveBeenCalledWith('post-1');
    expect(result).toHaveLength(1);
    expect(result[0]?.metrics.likes).toBe(3);
  });

  it('refreshes metrics for all users on periodic sync', async () => {
    userRepo.listAllClerkIds.mockResolvedValue([
      'clerk-user-1',
      'clerk-user-2'
    ]);
    const refreshSpy = jest
      .spyOn(service, 'refreshUserMetrics')
      .mockResolvedValueOnce(2)
      .mockResolvedValueOnce(1);

    const refreshedPosts = await service.refreshAllMetrics();

    expect(refreshSpy).toHaveBeenCalledTimes(2);
    expect(refreshSpy).toHaveBeenNthCalledWith(1, 'clerk-user-1');
    expect(refreshSpy).toHaveBeenNthCalledWith(2, 'clerk-user-2');
    expect(refreshedPosts).toBe(3);
  });
});
