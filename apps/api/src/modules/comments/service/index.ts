import type { FacebookServicePort } from '@/modules/facebook/ports';
import type { AuditLogWriterPort } from '@/modules/audit-logs/ports';
import type { PostRepositoryPort } from '@/modules/posts/ports';
import { NotFoundError, ValidationError } from '@/shared/errors/errors';
import { BaseService } from '@/shared/service';
import type {
  CommentReplyResultDto,
  ReplyToPostThreadBodyDto
} from '../contracts';
import type { CommentsServicePort } from '../ports';

export class CommentsService
  extends BaseService
  implements CommentsServicePort
{
  constructor(
    private readonly postRepo: PostRepositoryPort,
    private readonly facebookService: FacebookServicePort,
    private readonly auditLogRepo: AuditLogWriterPort
  ) {
    super();
  }

  async replyToPostThread(
    internalUserId: string,
    input: ReplyToPostThreadBodyDto
  ): Promise<CommentReplyResultDto> {
    const post = await this.postRepo.findByIdForUser(
      input.postId,
      internalUserId
    );

    if (!post) {
      throw new NotFoundError('Post not found');
    }

    if (!post.facebookPostId) {
      throw new ValidationError(
        'Only published Facebook posts can receive replies from the dashboard'
      );
    }

    const account = await this.facebookService.resolveAccountForInternalUser(
      internalUserId,
      post.facebookAccountId
    );
    const reply = await this.facebookService.commentOnPost(
      account,
      post.facebookPostId,
      input.message
    );

    await this.auditLogRepo.createEntry({
      userId: internalUserId,
      action: 'facebook.post.comment.replied',
      entityType: 'post',
      entityId: post.id,
      metadata: {
        commentId: reply.commentId,
        facebookPostId: post.facebookPostId
      }
    });

    return {
      postId: post.id,
      commentId: reply.commentId
    };
  }
}
