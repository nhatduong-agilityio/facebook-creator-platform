import type {
  CreatePostBodyDto,
  PostPlanContext,
  SchedulePostBodyDto,
  UpdatePostBodyDto
} from '../contracts';
import type { PostEntity } from '../entity';

export interface PostRepositoryPort {
  findById(id: string): Promise<PostEntity | null>;
  findAllByUserId(userId: string): Promise<PostEntity[]>;
  findByIdForUser(id: string, userId: string): Promise<PostEntity | null>;
  countByUserId(userId: string): Promise<number>;
  countScheduledByUserId(
    userId: string,
    excludePostId?: string
  ): Promise<number>;
  findReadyToPublish(before: Date): Promise<PostEntity[]>;
  savePost(data: Partial<PostEntity>): Promise<PostEntity>;
  delete(id: string): Promise<boolean>;
}

export interface PostSchedulerPort {
  schedulePublish(postId: string, scheduledAt: Date): Promise<void>;
}

export interface PostServicePort {
  listPosts(userId: string): Promise<PostEntity[]>;
  createPost(
    userId: string,
    input: CreatePostBodyDto,
    plan: PostPlanContext
  ): Promise<PostEntity>;
  updatePost(
    userId: string,
    postId: string,
    input: UpdatePostBodyDto
  ): Promise<PostEntity>;
  deletePost(userId: string, postId: string): Promise<void>;
  publishPostNow(userId: string, postId: string): Promise<PostEntity>;
  schedulePost(
    userId: string,
    postId: string,
    scheduledAt: SchedulePostBodyDto['scheduledAt'],
    plan: PostPlanContext
  ): Promise<PostEntity>;
  publishQueuedPost(postId: string): Promise<PostEntity>;
  markPostFailed(postId: string, message: string): Promise<void>;
}
