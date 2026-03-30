import type { DataSource } from 'typeorm';
import { BaseRepository } from '@/shared/repository';
import { UserEntity } from '../entity';
import type { SaveClerkUserInput, UserRepositoryPort } from '../ports';

export class UserRepository
  extends BaseRepository<UserEntity>
  implements UserRepositoryPort
{
  constructor(dataSource: DataSource) {
    super(dataSource, UserEntity);
  }

  /**
   * Find a user by Clerk's user ID.
   * Used in findOrCreate during GET /auth/me to sync Clerk identity with DB.
   */
  async findByClerkId(clerkUserId: string): Promise<UserEntity | null> {
    return await this.repo.findOne({
      where: { clerkUserId },
      select: [
        'id',
        'clerkUserId',
        'email',
        'name',
        'stripeCustomerId',
        'createdAt',
        'updatedAt'
      ]
    });
  }

  /**
   * Create and persist a new user record.
   * Called on first login when no matching clerkUserId exists.
   */
  async create(data: {
    clerkUserId: string;
    email: string;
    name?: string | null;
  }): Promise<UserEntity> {
    const user = this.repo.create(data);
    return await this.repo.save(user);
  }

  async saveClerkUser(data: SaveClerkUserInput): Promise<UserEntity> {
    const existing = await this.findByClerkId(data.clerkUserId);

    if (!existing) {
      return await this.create(data);
    }

    existing.email = data.email;
    existing.name = data.name ?? null;

    return await this.repo.save(existing);
  }

  async deleteByClerkId(clerkUserId: string): Promise<boolean> {
    const result = await this.repo.delete({ clerkUserId });

    return (result.affected ?? 0) > 0;
  }

  // TODO: Add method for billing info updates, e.g. updateStripeCustomerId(userId: string, stripeCustomerId: string): Promise<void>
}
