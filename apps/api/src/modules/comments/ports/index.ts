import type {
  CommentReplyResultDto,
  ReplyToPostThreadBodyDto
} from '../contracts';

export interface CommentsServicePort {
  replyToPostThread(
    internalUserId: string,
    input: ReplyToPostThreadBodyDto
  ): Promise<CommentReplyResultDto>;
}
