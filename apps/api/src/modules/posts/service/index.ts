// Shared
import { BaseService } from '@/shared/service';
import { POST_STATUSES } from '@/shared/constants/post';
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ValidationError
} from '@/shared/errors/errors';

// Types
import type {
  PostRepositoryPort,
  PostSchedulerPort,
  PostServicePort
} from '../ports';
import type { UserLookupPort } from '@/modules/users/ports';
import type { FacebookServicePort } from '@/modules/facebook/ports';
import type { PostEntity } from '../entity';
import type { UserEntity } from '@/modules/users/entity';
import type {
  CreatePostBodyDto,
  PostPlanContext,
  SchedulePostBodyDto,
  UpdatePostBodyDto
} from '../contracts';
import type { AuditLogWriterPort } from '@/modules/audit-logs/ports';
import {
  deleteStoredMediaIfOwned,
  persistUploadedMedia
} from '../media-storage';

export class PostService extends BaseService implements PostServicePort {
  constructor(
    private readonly userRepo: UserLookupPort,
    private readonly postRepo: PostRepositoryPort,
    private readonly facebookService: FacebookServicePort,
    private readonly auditLogRepo: AuditLogWriterPort,
    private readonly postScheduler: PostSchedulerPort
  ) {
    super();
  }

  async listPosts(userId: string): Promise<PostEntity[]> {
    const user = await this.requireUser(userId);
    return await this.postRepo.findAllByUserId(user.id);
  }

  async createPost(
    userId: string,
    input: CreatePostBodyDto,
    plan: PostPlanContext
  ): Promise<PostEntity> {
    const user = await this.requireUser(userId);

    if (plan.postLimit !== -1) {
      const totalPosts = await this.postRepo.countByUserId(user.id);

      if (totalPosts >= plan.postLimit) {
        throw new ForbiddenError(
          'Your current plan has reached the post limit'
        );
      }
    }

    const account = input.facebookAccountId
      ? await this.facebookService.resolveAccount(
          userId,
          input.facebookAccountId
        )
      : null;
    const mediaUrl = input.mediaUpload
      ? await persistUploadedMedia(input.mediaUpload)
      : input.mediaUrl?.trim() || null;

    const post = await this.postRepo.savePost({
      userId: user.id,
      facebookAccountId: account?.id ?? null,
      title: input.title?.trim() || null,
      content: input.content.trim(),
      mediaUrl,
      status: POST_STATUSES[0],
      scheduledAt: null,
      publishedAt: null,
      facebookPostId: null,
      lastError: null
    });

    // Create audit log entry for the post
    await this.auditLogRepo.createEntry({
      userId: user.id,
      action: 'post.created',
      entityType: 'post',
      entityId: post.id
    });

    return post;
  }

  async updatePost(
    userId: string,
    postId: string,
    input: UpdatePostBodyDto
  ): Promise<PostEntity> {
    const user = await this.requireUser(userId);
    const post = await this.requireOwnedPost(user.id, postId);

    if (post.status === POST_STATUSES[2]) {
      throw new ConflictError('Published posts cannot be updated');
    }

    const account =
      input.facebookAccountId === undefined
        ? post.facebookAccountId
        : input.facebookAccountId === null
          ? null
          : (
              await this.facebookService.resolveAccount(
                userId,
                input.facebookAccountId
              )
            ).id;
    const mediaUrl = await this.resolveUpdatedMediaUrl(post.mediaUrl, input);

    const updatePost = await this.postRepo.savePost({
      ...post,
      facebookAccountId: account,
      title:
        input.title === undefined ? post.title : input.title.trim() || null,
      content:
        input.content === undefined ? post.content : input.content.trim(),
      mediaUrl
    });

    // Create audit log entry for the post
    await this.auditLogRepo.createEntry({
      userId: user.id,
      action: 'post.updated',
      entityType: 'post',
      entityId: post.id
    });

    return updatePost;
  }

  async deletePost(userId: string, postId: string): Promise<void> {
    const user = await this.requireUser(userId);
    const post = await this.requireOwnedPost(user.id, postId);

    if (post.status === POST_STATUSES[2]) {
      throw new ConflictError('Published posts cannot be deleted');
    }

    await deleteStoredMediaIfOwned(post.mediaUrl);
    await this.postRepo.delete(post.id);

    // Create audit log entry for the post
    await this.auditLogRepo.createEntry({
      userId: user.id,
      action: 'post.deleted',
      entityType: 'post',
      entityId: post.id
    });
  }

  async publishPostNow(userId: string, postId: string): Promise<PostEntity> {
    const user = await this.requireUser(userId);
    const post = await this.requireOwnedPost(user.id, postId);
    const publishedPost = await this.publishStoredPost(post);

    // Create audit log entry for the post
    await this.auditLogRepo.createEntry({
      userId: user.id,
      action: 'post.published',
      entityType: 'post',
      entityId: publishedPost.id,
      metadata: {
        facebookPostId: publishedPost.facebookPostId
      }
    });

    return publishedPost;
  }

  async schedulePost(
    userId: string,
    postId: string,
    scheduledAt: SchedulePostBodyDto['scheduledAt'],
    plan: PostPlanContext
  ): Promise<PostEntity> {
    const user = await this.requireUser(userId);
    const post = await this.requireOwnedPost(user.id, postId);

    if (post.status === POST_STATUSES[2]) {
      throw new ConflictError('Published posts cannot be scheduled');
    }

    if (scheduledAt.getTime() <= Date.now()) {
      throw new ValidationError(
        'Scheduled date must be in the future timestamp'
      );
    }

    if (plan.scheduledLimit !== -1) {
      const scheduledCount = await this.postRepo.countScheduledByUserId(
        user.id,
        post.id
      );

      if (scheduledCount >= plan.scheduledLimit) {
        throw new ForbiddenError(
          'Your current plan has reached the scheduled post limit'
        );
      }
    }

    const account = await this.facebookService.resolveAccount(
      userId,
      post.facebookAccountId
    );

    const scheduledPost = await this.postRepo.savePost({
      ...post,
      facebookAccountId: account.id,
      status: POST_STATUSES[1],
      scheduledAt,
      lastError: null
    });

    await this.postScheduler.schedulePublish(scheduledPost.id, scheduledAt);

    // Create audit log entry for the post
    await this.auditLogRepo.createEntry({
      userId: user.id,
      action: 'post.scheduled',
      entityType: 'post',
      entityId: scheduledPost.id,
      metadata: {
        scheduledAt: scheduledAt.toISOString()
      }
    });

    return scheduledPost;
  }

  async publishQueuedPost(postId: string): Promise<PostEntity> {
    const post = await this.postRepo.findById(postId);

    if (!post) {
      throw new NotFoundError('Post not found');
    }

    if (post.status === POST_STATUSES[2]) {
      return post;
    }

    const publishedPost = await this.publishStoredPost(post);

    // Create audit log entry for the post
    await this.auditLogRepo.createEntry({
      userId: publishedPost.userId,
      action: 'post.published',
      entityType: 'post',
      entityId: publishedPost.id,
      metadata: {
        facebookPostId: publishedPost.facebookPostId
      }
    });

    return publishedPost;
  }

  async markPostFailed(postId: string, message: string): Promise<void> {
    const post = await this.postRepo.findById(postId);

    if (!post) {
      return;
    }

    await this.postRepo.savePost({
      ...post,
      status: POST_STATUSES[3],
      lastError: message
    });
  }

  private async publishStoredPost(post: PostEntity): Promise<PostEntity> {
    const account = await this.facebookService.resolveAccountForInternalUser(
      post.userId,
      post.facebookAccountId
    );

    const publishResult = await this.facebookService.publishPost(account, {
      title: post.title,
      content: post.content,
      mediaUrl: post.mediaUrl
    });

    return await this.postRepo.savePost({
      ...post,
      facebookAccountId: account.id,
      status: POST_STATUSES[2],
      scheduledAt: null,
      publishedAt: new Date(),
      facebookPostId: publishResult.facebookPostId,
      lastError: null
    });
  }

  private async requireOwnedPost(
    userId: string,
    postId: string
  ): Promise<PostEntity> {
    const post = await this.postRepo.findByIdForUser(postId, userId);

    if (!post) {
      throw new NotFoundError('Post not found');
    }

    return post;
  }

  private async requireUser(clerkUserId: string): Promise<UserEntity> {
    const user = await this.userRepo.findByClerkId(clerkUserId);

    if (!user) {
      throw new NotFoundError('User profile not found');
    }

    return user;
  }

  private async resolveUpdatedMediaUrl(
    currentMediaUrl: string | null,
    input: UpdatePostBodyDto
  ): Promise<string | null> {
    if (input.mediaUpload) {
      const storedMediaUrl = await persistUploadedMedia(input.mediaUpload);

      if (currentMediaUrl && currentMediaUrl !== storedMediaUrl) {
        await deleteStoredMediaIfOwned(currentMediaUrl);
      }

      return storedMediaUrl;
    }

    if (input.mediaUrl === undefined) {
      return currentMediaUrl;
    }

    const nextMediaUrl = input.mediaUrl?.trim() || null;

    if (currentMediaUrl && currentMediaUrl !== nextMediaUrl) {
      await deleteStoredMediaIfOwned(currentMediaUrl);
    }

    return nextMediaUrl;
  }
}
