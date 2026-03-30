// Types
import type { AuthServicePort } from '@/modules/auth/ports';
import type { FacebookServicePort } from '../ports';

// Controllers
import { FacebookController } from '../controller';

export function createFacebookModule(
  facebookService: FacebookServicePort,
  authService: AuthServicePort
): FacebookController {
  return new FacebookController(facebookService, authService);
}
