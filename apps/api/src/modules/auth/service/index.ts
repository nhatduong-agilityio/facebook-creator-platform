// Shared
import { BaseService } from '@/shared/service';

// Types
import type { UserEntity } from '@/modules/users/entity';
import type {
  AuthServicePort,
  ClerkIdentityProviderPort,
  ClerkWebhookEventPayload
} from '../ports';
import type { UserClerkSyncPort } from '@/modules/users/ports';
import { ExternalServiceError } from '@/shared/errors/errors';

export class AuthService extends BaseService implements AuthServicePort {
  constructor(
    private readonly userRepo: UserClerkSyncPort,
    private readonly clerkProvider: ClerkIdentityProviderPort
  ) {
    super();
  }

  /**
   * Find or create a user by their Clerk user ID.
   *
   * If a user with the given Clerk user ID already exists, that user is returned.
   * If no matching user exists, a new user is created with a Clerk user ID,
   * email address, and full name.
   *
   * @param {string} clerkUserId - the Clerk user ID to find or create a user for
   * @returns {Promise<UserEntity>} - a promise that resolves to a user entity
   */
  async getOrCreateUser(clerkUserId: string): Promise<UserEntity> {
    const existing = await this.userRepo.findByClerkId(clerkUserId);
    let refreshedProfile: {
      clerkUserId: string;
      email: string;
      name: string | null;
    };

    try {
      const clerkUser = await this.clerkProvider.getUserProfile(clerkUserId);
      refreshedProfile = {
        clerkUserId: clerkUser.id,
        email: clerkUser.email,
        name: this.buildName(clerkUser.firstName, clerkUser.lastName)
      };

      if (
        !existing ||
        this.shouldRefreshExistingUser(existing, refreshedProfile)
      ) {
        return await this.syncClerkUser(refreshedProfile);
      }

      return existing;
    } catch (error) {
      if (existing && !existing.email.endsWith('@clerk.local')) {
        console.warn(
          '[Auth] Returning existing user because Clerk profile refresh failed.',
          error
        );
        return existing;
      }

      throw new ExternalServiceError(
        'Failed to synchronize the signed-in user with Clerk'
      );
    }
  }

  /**
   * Handles Clerk webhooks, which notify our server of changes to user records.
   * Clerk provides user data via the webhook event payload.
   *
   * @param {ClerkWebhookEventPayload} event - the Clerk webhook event payload
   * @returns {Promise<UserEntity | null>} - a promise that resolves to a user entity
   *  if the event is 'user.created' or 'user.updated', otherwise null
   */
  async syncClerkWebhook(
    event: ClerkWebhookEventPayload
  ): Promise<UserEntity | null> {
    switch (event.type) {
      case 'user.created':
      case 'user.updated':
        return event.data.id && event.data.email
          ? await this.syncClerkUser({
              clerkUserId: event.data.id,
              email: event.data.email,
              name: this.buildName(event.data.firstName, event.data.lastName)
            })
          : null;
      case 'user.deleted':
        if (event.data.id) {
          await this.userRepo.deleteByClerkId(event.data.id);
        }
        return null;

      default:
        return null;
    }
  }

  /**
   * Creates or updates a user record with the provided Clerk user ID and email.
   * If a user record with the provided Clerk user ID already exists, it is updated with the provided email and name.
   * If no user record with the provided Clerk user ID exists, a new user record is created with the provided Clerk user ID, email, and name.
   *
   * @param {Object} input - the input object with the Clerk user ID, email, and name
   * @param {string} input.clerkUserId - the Clerk user ID
   * @param {string} input.email - the email address
   * @param {string | null | undefined} input.name - the name (optional)
   *
   * @returns {Promise<UserEntity>} - a promise that resolves to a user entity if the user record was created or updated successfully
   */
  private async syncClerkUser(input: {
    clerkUserId: string;
    email: string;
    name: string | null;
  }): Promise<UserEntity> {
    return await this.userRepo.saveClerkUser(input);
  }

  /**
   * Builds a full name from the provided first and last names.
   * If either or both names are null or undefined, returns null.
   * If either name is empty, it is filtered out and the remaining name is returned.
   * If both names are provided, they are joined together with a space in between and the resulting string is trimmed.
   *
   * @param {string | null | undefined} firstName - the first name
   * @param {string | null | undefined} lastName - the last name
   * @returns {string | null} - the full name or null if either name is empty or null
   */
  private buildName(
    firstName: string | null | undefined,
    lastName: string | null | undefined
  ): string | null {
    const fullName =
      [firstName, lastName].filter(Boolean).join(' ').trim() || null;

    return fullName;
  }

  private shouldRefreshExistingUser(
    existing: UserEntity,
    nextProfile: {
      email: string;
      name: string | null;
    }
  ): boolean {
    const hasFallbackEmail = existing.email.endsWith('@clerk.local');
    const emailChanged = existing.email !== nextProfile.email;
    const existingName = existing.name?.trim() ?? '';
    const nextName = nextProfile.name?.trim() ?? '';
    const nameMissing = existingName.length === 0 && nextName.length > 0;
    const nameChanged =
      existingName.length > 0 &&
      nextName.length > 0 &&
      existingName !== nextName;

    return hasFallbackEmail || emailChanged || nameMissing || nameChanged;
  }
}
