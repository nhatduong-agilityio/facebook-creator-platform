import type { UserEntity } from '../entity';

export type SaveClerkUserInput = {
  clerkUserId: string;
  email: string;
  name?: string | null;
};

export interface UserLookupPort {
  findById(id: string): Promise<UserEntity | null>;
  findByClerkId(clerkUserId: string): Promise<UserEntity | null>;
}

export interface UserClerkSyncPort extends UserLookupPort {
  saveClerkUser(data: SaveClerkUserInput): Promise<UserEntity>;
  deleteByClerkId(clerkUserId: string): Promise<boolean>;
}

// TODO: Add interface for billing info updates, e.g. updateStripeCustomerId(userId: string, stripeCustomerId: string): Promise<void>

export type UserRepositoryPort = UserClerkSyncPort;
