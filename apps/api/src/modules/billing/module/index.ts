import type { AuthServicePort } from '@/modules/auth/ports';
import type { BillingServicePort } from '../ports';
import { BillingController } from '../controller';

export function createBillingModule(
  billingService: BillingServicePort,
  authService: AuthServicePort
): BillingController {
  return new BillingController(billingService, authService);
}
