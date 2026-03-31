// Types
import type { AuthServicePort } from '@/modules/auth/ports';
import type { PostServicePort } from '../ports';

// Controllers
import { PostController } from '../controller';

export function createPostModule(
  postService: PostServicePort,
  authService: AuthServicePort
  // TODO: Add billing service when implemented
): PostController {
  return new PostController(postService, authService);
}
