/* eslint-disable @typescript-eslint/unbound-method */
import { mock, type MockProxy } from 'jest-mock-extended';

import type { AuditLogWriterPort } from '@/modules/audit-logs/ports';
import type { FacebookServicePort } from '@/modules/facebook/ports';
import type { PostRepositoryPort } from '@/modules/posts/ports';
import { CommentsService } from '@/modules/comments/service';
import { makeFacebookAccount, makePost } from '@/__tests__/helpers/fixtures';
import { NotFoundError, ValidationError } from '@/shared/errors/errors';

describe('CommentsService', () => {
  let postRepo: MockProxy<PostRepositoryPort>;
  let facebookService: MockProxy<FacebookServicePort>;
  let auditLogRepo: MockProxy<AuditLogWriterPort>;
  let service: CommentsService;

  beforeEach(() => {
    postRepo = mock<PostRepositoryPort>();
    facebookService = mock<FacebookServicePort>();
    auditLogRepo = mock<AuditLogWriterPort>();
    service = new CommentsService(postRepo, facebookService, auditLogRepo);
  });

  it('throws when the post does not exist', async () => {
    postRepo.findByIdForUser.mockResolvedValue(null);

    await expect(
      service.replyToPostThread('user-internal-1', {
        postId: 'post-1',
        message: 'Thanks!'
      })
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it('throws when the post is not published to Facebook', async () => {
    postRepo.findByIdForUser.mockResolvedValue(
      makePost({ facebookPostId: null, status: 'draft' })
    );

    await expect(
      service.replyToPostThread('user-internal-1', {
        postId: 'post-1',
        message: 'Thanks!'
      })
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it('replies to the post thread and writes an audit log', async () => {
    const post = makePost({
      status: 'published',
      facebookPostId: 'fb-post-1'
    });
    postRepo.findByIdForUser.mockResolvedValue(post);
    facebookService.resolveAccountForInternalUser.mockResolvedValue(
      makeFacebookAccount()
    );
    facebookService.commentOnPost.mockResolvedValue({
      commentId: 'fb-comment-1'
    });

    const result = await service.replyToPostThread('user-internal-1', {
      postId: post.id,
      message: 'Thanks!'
    });

    expect(result).toEqual({
      postId: post.id,
      commentId: 'fb-comment-1'
    });
    expect(auditLogRepo.createEntry).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'facebook.post.comment.replied',
        entityId: post.id
      })
    );
  });
});
