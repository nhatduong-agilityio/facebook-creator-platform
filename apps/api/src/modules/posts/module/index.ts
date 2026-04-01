// Types
import type { AuthServicePort } from '@/modules/auth/ports';
import type { BillingServicePort } from '@/modules/billing/ports';
import type { PostServicePort } from '../ports';

// Controllers
import { PostController } from '../controller';

export function createPostModule(
  postService: PostServicePort,
  billingService: BillingServicePort,
  authService: AuthServicePort
): PostController {
  return new PostController(postService, billingService, authService);
}
