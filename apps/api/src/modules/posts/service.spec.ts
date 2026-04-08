/* eslint-disable @typescript-eslint/unbound-method */
import { mock, type MockProxy } from 'jest-mock-extended';

jest.mock('@/modules/posts/media-storage', () => ({
  persistUploadedMedia: jest.fn(),
  deleteStoredMediaIfOwned: jest.fn()
}));

jest.mock('@/modules/jobs/queues/metrics-queue', () => ({
  enqueueMetricsJob: jest.fn().mockReturnValue(undefined)
}));

import type { AuditLogWriterPort } from '@/modules/audit-logs/ports';
import type { FacebookServicePort } from '@/modules/facebook/ports';
import type {
  PostRepositoryPort,
  PostSchedulerPort
} from '@/modules/posts/ports';
import { PostService } from '@/modules/posts/service';
import type { UserLookupPort } from '@/modules/users/ports';
import {
  deleteStoredMediaIfOwned,
  persistUploadedMedia
} from '@/modules/posts/media-storage';
import { enqueueMetricsJob } from '@/modules/jobs/queues/metrics-queue';
import {
  makeFacebookAccount,
  makePost,
  makeUser
} from '@/__tests__/helpers/fixtures';
import {
  ConflictError,
  ForbiddenError,
  ValidationError
} from '@/shared/errors/errors';

describe('PostService', () => {
  let userRepo: MockProxy<UserLookupPort>;
  let postRepo: MockProxy<PostRepositoryPort>;
  let facebookService: MockProxy<FacebookServicePort>;
  let auditLogRepo: MockProxy<AuditLogWriterPort>;
  let postScheduler: MockProxy<PostSchedulerPort>;
  let service: PostService;

  beforeEach(() => {
    userRepo = mock<UserLookupPort>();
    postRepo = mock<PostRepositoryPort>();
    facebookService = mock<FacebookServicePort>();
    auditLogRepo = mock<AuditLogWriterPort>();
    postScheduler = mock<PostSchedulerPort>();

    service = new PostService(
      userRepo,
      postRepo,
      facebookService,
      auditLogRepo,
      postScheduler
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('enforces the plan post limit on create', async () => {
    const user = makeUser();
    userRepo.findByClerkId.mockResolvedValue(user);
    postRepo.countByUserId.mockResolvedValue(10);

    await expect(
      service.createPost(
        user.clerkUserId,
        { title: 'Launch', content: 'Hello world' },
        { isPro: false, postLimit: 10, scheduledLimit: 3 }
      )
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('creates a post with uploaded media', async () => {
    const user = makeUser();
    const savedPost = makePost({
      mediaUrl: 'http://localhost:3000/media/file.png'
    });
    userRepo.findByClerkId.mockResolvedValue(user);
    postRepo.countByUserId.mockResolvedValue(0);
    (persistUploadedMedia as jest.Mock).mockResolvedValue(
      'http://localhost:3000/media/file.png'
    );
    postRepo.savePost.mockResolvedValue(savedPost);

    const result = await service.createPost(
      user.clerkUserId,
      {
        title: 'Launch',
        content: 'Hello world',
        mediaUpload: {
          fileName: 'file.png',
          mimeType: 'image/png',
          base64Data: 'Zm9v'
        }
      },
      { isPro: false, postLimit: 10, scheduledLimit: 3 }
    );

    expect(persistUploadedMedia).toHaveBeenCalled();
    expect(result).toBe(savedPost);
  });

  it('rejects scheduling in the past', async () => {
    const user = makeUser();
    userRepo.findByClerkId.mockResolvedValue(user);
    postRepo.findByIdForUser.mockResolvedValue(makePost());

    await expect(
      service.schedulePost(
        user.clerkUserId,
        'post-1',
        new Date(Date.now() - 1000),
        { isPro: false, postLimit: 10, scheduledLimit: 3 }
      )
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it('schedules a post and queues the scheduler job', async () => {
    const user = makeUser();
    const post = makePost({
      status: 'draft',
      facebookAccountId: 'facebook-account-1'
    });
    const scheduledAt = new Date(Date.now() + 60_000);
    userRepo.findByClerkId.mockResolvedValue(user);
    postRepo.findByIdForUser.mockResolvedValue(post);
    postRepo.countScheduledByUserId.mockResolvedValue(0);
    facebookService.resolveAccount.mockResolvedValue(makeFacebookAccount());
    postRepo.savePost.mockResolvedValue(
      makePost({ status: 'scheduled', scheduledAt })
    );

    const result = await service.schedulePost(
      user.clerkUserId,
      post.id,
      scheduledAt,
      { isPro: false, postLimit: 10, scheduledLimit: 3 }
    );

    expect(postScheduler.schedulePublish).toHaveBeenCalledWith(
      post.id,
      scheduledAt
    );
    expect(result.status).toBe('scheduled');
  });

  it('publishes a post and enqueues a metrics refresh', async () => {
    const user = makeUser();
    const post = makePost({
      id: 'post-1',
      status: 'draft',
      facebookAccountId: 'facebook-account-1'
    });
    userRepo.findByClerkId.mockResolvedValue(user);
    postRepo.findByIdForUser.mockResolvedValue(post);
    facebookService.resolveAccountForInternalUser.mockResolvedValue(
      makeFacebookAccount()
    );
    facebookService.publishPost.mockResolvedValue({
      facebookPostId: 'fb-post-1'
    });
    postRepo.savePost.mockResolvedValue(
      makePost({
        id: 'post-1',
        status: 'published',
        facebookPostId: 'fb-post-1',
        publishedAt: new Date()
      })
    );

    const result = await service.publishPostNow(user.clerkUserId, post.id);

    expect(result.status).toBe('published');
    expect(enqueueMetricsJob).toHaveBeenCalledWith({ postId: post.id });
  });

  it('does not republish an already published queued post', async () => {
    const post = makePost({
      id: 'post-1',
      status: 'published',
      facebookPostId: 'fb-post-1'
    });
    postRepo.findById.mockResolvedValue(post);

    const result = await service.publishQueuedPost(post.id);

    expect(result).toBe(post);
    expect(facebookService.publishPost).not.toHaveBeenCalled();
  });

  it('prevents deleting published posts', async () => {
    const user = makeUser();
    userRepo.findByClerkId.mockResolvedValue(user);
    postRepo.findByIdForUser.mockResolvedValue(
      makePost({ status: 'published' })
    );

    await expect(
      service.deletePost(user.clerkUserId, 'post-1')
    ).rejects.toBeInstanceOf(ConflictError);
    expect(deleteStoredMediaIfOwned).not.toHaveBeenCalled();
  });
});
