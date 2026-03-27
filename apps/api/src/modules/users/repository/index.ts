import type { DataSource } from 'typeorm';
import { BaseRepository } from '@/shared/repository';
import { UserEntity } from '../entity';

export class UserRepository extends BaseRepository<UserEntity> {
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
      select: ['id', 'clerkUserId', 'email', 'name', 'createdAt', 'updatedAt']
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
}
