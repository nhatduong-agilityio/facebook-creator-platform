// Types
import type { UserEntity } from '@/modules/users/entity';
import type { FastifyRequest } from 'fastify';

export type ClerkUserProfile = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
};

export type ClerkWebhookEventPayload = {
  type: string;
  data: {
    id?: string;
    email: string | null;
    firstName: string | null;
    lastName: string | null;
  };
};

export type AuthProfileHint = {
  clerkUserId: string;
  email: string | null;
  name: string | null;
};

export interface ClerkIdentityProviderPort {
  getUserProfile(clerkUserId: string): Promise<ClerkUserProfile>;
}

export interface ClerkWebhookVerifierPort {
  verifyWebhook(req: FastifyRequest): Promise<ClerkWebhookEventPayload>;
}

export interface AuthServicePort {
  getOrCreateUser(
    clerkUserId: string,
    profileHint?: AuthProfileHint
  ): Promise<UserEntity>;
  syncClerkWebhook(event: ClerkWebhookEventPayload): Promise<UserEntity | null>;
}
