import type { UserEntity } from '@/modules/users/entity';

export type AuthSessionDto = {
  id: string;
  clerkUserId: string;
  email: string;
  name?: string | null;
  role?: string | null;
  plan?: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type AuthWebhookResultDto = {
  type: string;
};

export function toAuthSessionDto(
  user: UserEntity,
  // TODO: Update to actual role and plan types in billing module when implemented
  role?: string,
  plan?: string
): AuthSessionDto {
  return {
    id: user.id,
    clerkUserId: user.clerkUserId,
    email: user.email,
    name: user.name,
    role,
    plan,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };
}
