import z from 'zod';

// Types
import type { PostStatus } from '@/shared/types/post';
import type { PostEntity } from '../entity';

export const createPostBodySchema = z.object({
  title: z.string().trim().max(255).optional(),
  content: z.string().trim().min(1),
  mediaUrl: z.url().optional(),
  facebookAccountId: z.uuid().optional()
});

export const updatePostBodySchema = z.object({
  title: z.string().trim().max(255).optional(),
  content: z.string().trim().min(1).optional(),
  mediaUrl: z.url().nullable().optional(),
  facebookAccountId: z.uuid().nullable().optional()
});

export const schedulePostBodySchema = z.object({
  scheduledAt: z.coerce.date()
});

export const postParamsSchema = z.object({
  id: z.uuid()
});

export type CreatePostBodyDto = z.infer<typeof createPostBodySchema>;
export type UpdatePostBodyDto = z.infer<typeof updatePostBodySchema>;
export type SchedulePostBodyDto = z.infer<typeof schedulePostBodySchema>;
export type PostParamsDto = z.infer<typeof postParamsSchema>;

export type PostDto = {
  id: string;
  userId: string;
  facebookAccountId: string | null;
  title: string | null;
  content: string;
  mediaUrl: string | null;
  status: PostStatus;
  scheduledAt: Date | null;
  publishedAt: Date | null;
  facebookPostId: string | null;
  lastError: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type PostPlanContext = {
  isPro: boolean;
  postLimit: number;
  scheduledLimit: number;
};

export function toPostDto(post: PostEntity): PostDto {
  return {
    id: post.id,
    userId: post.userId,
    facebookAccountId: post.facebookAccountId,
    title: post.title,
    content: post.content,
    mediaUrl: post.mediaUrl,
    status: post.status,
    scheduledAt: post.scheduledAt,
    publishedAt: post.publishedAt,
    facebookPostId: post.facebookPostId,
    lastError: post.lastError,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt
  };
}
