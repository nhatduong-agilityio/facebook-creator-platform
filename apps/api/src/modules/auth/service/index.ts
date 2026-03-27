import { BaseService } from '@/shared/service';
import type { UserEntity } from '@/modules/users/entity';
import type { UserRepository } from '@/modules/users/repository';
import { clerkClient } from '@clerk/fastify';

export class AuthService extends BaseService {
  constructor(private readonly userRepo: UserRepository) {
    super();
  }

  /**
   * Retrieve a user by their Clerk ID, or create one if it doesn't exist.
   *
   * If the user exists, return the existing user entity.
   * If the user doesn't exist, create a new user entity with the following properties:
   *   - clerkUserId: the Clerk user ID passed as an argument
   *   - email: the email address associated with the Clerk user, or an empty string if none is found
   *   - name: the full name of the Clerk user, or an empty string if none is found
   *
   * @param {string} clerkUserId - the Clerk user ID to retrieve or create a user for
   * @returns {Promise<UserEntity>} - a promise that resolves to a user entity
   */
  async getOrCreateUser(clerkUserId: string): Promise<UserEntity> {
    // Find existing user by Clerk ID
    const existing = await this.userRepo.findByClerkId(clerkUserId);
    if (existing) return existing;

    // Fetch authoritative profile from Clerk
    const clerkUser = await clerkClient.users.getUser(clerkUserId);

    const email = clerkUser.emailAddresses[0]?.emailAddress ?? '';
    const name =
      [clerkUser.firstName, clerkUser.lastName]
        .filter(Boolean)
        .join(' ')
        .trim() || null;

    return this.userRepo.create({ clerkUserId, email, name });
  }
}
