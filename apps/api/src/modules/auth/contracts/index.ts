import type { BillingPlanContext } from '@/modules/billing/contracts';
import type { UserEntity } from '@/modules/users/entity';

export type AuthSessionDto = {
  id: string;
  clerkUserId: string;
  email: string;
  name?: string | null;
  role?: BillingPlanContext['code'];
  plan?: BillingPlanContext;
  createdAt: Date;
  updatedAt: Date;
};

export type AuthWebhookResultDto = {
  type: string;
};

export function toAuthSessionDto(
  user: UserEntity,
  plan: BillingPlanContext
): AuthSessionDto {
  return {
    id: user.id,
    clerkUserId: user.clerkUserId,
    email: user.email,
    name: user.name,
    role: plan.code,
    plan,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };
}
