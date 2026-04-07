import type { UserEntity } from '@/modules/users/entity';

export type AuthSessionDto = {
  id: string;
  clerkUserId: string;
  email: string;
  name?: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type AuthWebhookResultDto = {
  type: string;
};

export function toAuthSessionDto(user: UserEntity): AuthSessionDto {
  return {
    id: user.id,
    clerkUserId: user.clerkUserId,
    email: user.email,
    name: user.name,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };
}
