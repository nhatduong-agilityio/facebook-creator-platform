// Types
import type { AuthServicePort } from '@/modules/auth/ports';
import type { AnalyticsServicePort } from '../ports';

// Controllers
import { AnalyticsController } from '../controller';

export function createAnalyticsModule(
  analyticsService: AnalyticsServicePort,
  authService: AuthServicePort
  // TODO: Adding the billing service when implement billing module
): AnalyticsController {
  return new AnalyticsController(analyticsService, authService);
}
