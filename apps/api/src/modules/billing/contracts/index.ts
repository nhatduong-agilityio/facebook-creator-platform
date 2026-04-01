import type { PlanCode } from '@/shared/types/billing';
import type { SubscriptionStatus } from '@/shared/types/subscription';
import z from 'zod';

export const checkoutBodySchema = z.object({
  successUrl: z.url(),
  cancelUrl: z.url()
});

export type CheckoutBodyDto = z.infer<typeof checkoutBodySchema>;

export type BillingPlanContext = {
  code: PlanCode;
  name: string;
  isPro: boolean;
  postLimit: number;
  scheduledLimit: number;
  status: SubscriptionStatus;
  currentPeriodEnd: Date | null;
};

export type BillingSubscriptionSummaryDto = {
  plan: BillingPlanContext;
  stripeSubscriptionId: string | null;
};

export type BillingCheckoutSessionDto = {
  checkoutUrl: string;
  sessionId: string;
};

export type BillingWebhookResultDto = {
  eventType: string;
};
