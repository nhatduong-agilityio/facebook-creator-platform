import z from 'zod';

export const replyToPostThreadBodySchema = z.object({
  postId: z.uuid(),
  message: z.string().trim().min(1).max(2000)
});

export type ReplyToPostThreadBodyDto = z.infer<
  typeof replyToPostThreadBodySchema
>;

export type CommentReplyResultDto = {
  postId: string;
  commentId: string;
};
