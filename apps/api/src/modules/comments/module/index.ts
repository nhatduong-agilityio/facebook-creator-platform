import type { AuthServicePort } from '@/modules/auth/ports';
import type { CommentsServicePort } from '../ports';
import { CommentsController } from '../controller';

export function createCommentsModule(
  commentsService: CommentsServicePort,
  authService: AuthServicePort
): CommentsController {
  return new CommentsController(commentsService, authService);
}
