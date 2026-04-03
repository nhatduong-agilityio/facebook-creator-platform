import z from 'zod';

// Types
import type { PostStatus } from '@/shared/types/post';
import type { PostEntity } from '../entity';

export const mediaUploadSchema = z.object({
  fileName: z.string().trim().min(1).max(255),
  mimeType: z
    .string()
    .trim()
    .regex(/^(image|video)\//, 'Only image and video uploads are supported'),
  base64Data: z.string().trim().min(1)
});

export const createPostBodySchema = z
  .object({
    title: z.string().trim().max(255).optional(),
    content: z.string().trim().min(1),
    mediaUrl: z.url().optional(),
    mediaUpload: mediaUploadSchema.optional(),
    facebookAccountId: z.uuid().optional()
  })
  .refine(value => !(value.mediaUrl && value.mediaUpload), {
    message: 'Provide either a media URL or an uploaded file, not both'
  });

export const updatePostBodySchema = z
  .object({
    title: z.string().trim().max(255).optional(),
    content: z.string().trim().min(1).optional(),
    mediaUrl: z.url().nullable().optional(),
    mediaUpload: mediaUploadSchema.optional(),
    facebookAccountId: z.uuid().nullable().optional()
  })
  .refine(value => !(value.mediaUrl && value.mediaUpload), {
    message: 'Provide either a media URL or an uploaded file, not both'
  });

export const schedulePostBodySchema = z.object({
  scheduledAt: z.coerce.date()
});

export const postParamsSchema = z.object({
  id: z.uuid()
});

export const postMediaParamsSchema = z.object({
  fileName: z
    .string()
    .trim()
    .regex(/^[a-zA-Z0-9-]+\.[a-zA-Z0-9]+$/)
});

export type CreatePostBodyDto = z.infer<typeof createPostBodySchema>;
export type UpdatePostBodyDto = z.infer<typeof updatePostBodySchema>;
export type SchedulePostBodyDto = z.infer<typeof schedulePostBodySchema>;
export type PostParamsDto = z.infer<typeof postParamsSchema>;
export type PostMediaParamsDto = z.infer<typeof postMediaParamsSchema>;
export type MediaUploadDto = z.infer<typeof mediaUploadSchema>;

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
