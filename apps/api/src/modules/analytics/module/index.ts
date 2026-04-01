// Types
import type { AuthServicePort } from '@/modules/auth/ports';
import type { AnalyticsServicePort } from '../ports';
import type { BillingServicePort } from '@/modules/billing/ports';

// Controllers
import { AnalyticsController } from '../controller';

export function createAnalyticsModule(
  analyticsService: AnalyticsServicePort,
  billingService: BillingServicePort,
  authService: AuthServicePort
): AnalyticsController {
  return new AnalyticsController(analyticsService, billingService, authService);
}
