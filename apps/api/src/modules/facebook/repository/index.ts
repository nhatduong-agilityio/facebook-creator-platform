// Shared
import { BaseRepository } from '@/shared/repository';

// Types
import { FacebookAccountEntity } from '../entity';
import type { FacebookAccountRepositoryPort } from '../ports';
import type { DataSource } from 'typeorm';

export class FacebookAccountRepository
  extends BaseRepository<FacebookAccountEntity>
  implements FacebookAccountRepositoryPort
{
  constructor(dataSource: DataSource) {
    super(dataSource, FacebookAccountEntity);
  }

  /**
   * Find all Facebook accounts associated with a user.
   * Returns an array of Facebook account entities ordered by creation date (ASC).
   * @param {string} userId - the user ID
   * @returns {Promise<FacebookAccountEntity[]>} - a promise that resolves to an array of Facebook account entities
   */
  async findAllByUserId(userId: string): Promise<FacebookAccountEntity[]> {
    return await this.repo.find({
      where: { userId },
      order: { createdAt: 'ASC' }
    });
  }

  /**
   * Find the default Facebook account for a user.
   * The default Facebook account is the one with the earliest creation date.
   * @param {string} userId - the user ID to find the default Facebook account for
   * @returns {Promise<FacebookAccountEntity | null>} - a promise that resolves to the default Facebook account entity or null if not found
   */
  async findDefaultByUserId(
    userId: string
  ): Promise<FacebookAccountEntity | null> {
    return await this.repo.findOne({
      where: { userId },
      order: { createdAt: 'ASC' }
    });
  }

  /**
   * Finds a Facebook account by ID and user ID.
   * @param {string} id - the Facebook account ID
   * @param {string} userId - the user ID
   * @returns {Promise<FacebookAccountEntity | null>} - a promise that resolves to the found Facebook account entity or null if not found
   */
  async findByIdForUser(
    id: string,
    userId: string
  ): Promise<FacebookAccountEntity | null> {
    return await this.repo.findOne({
      where: { id, userId }
    });
  }

  /**
   * Finds a Facebook account by page ID and user ID.
   * @param {string} pageId - the Facebook page ID
   * @param {string} userId - the user ID
   * @returns {Promise<FacebookAccountEntity | null>} - a promise that resolves to the found Facebook account entity or null if not found
   */
  async findByPageIdForUser(
    pageId: string,
    userId: string
  ): Promise<FacebookAccountEntity | null> {
    return await this.repo.findOne({
      where: { pageId, userId }
    });
  }

  /**
   * Upserts a Facebook connection.
   * @param {Object} data - the connection data
   * @param {string} data.userId - the user ID
   * @param {string} data.facebookUserId - the Facebook user ID
   * @param {string} data.pageId - the Facebook page ID
   * @param {string} data.pageName - the Facebook page name
   * @param {string} data.accessToken - the Facebook access token
   * @param {Date | null | undefined} data.tokenExpiresAt - the Facebook access token expiration date (optional)
   * @returns {Promise<FacebookAccountEntity>} - a promise that resolves to the created or updated Facebook account entity
   */
  async upsertConnection(data: {
    userId: string;
    facebookUserId: string;
    pageId: string;
    pageName: string;
    accessToken: string;
    tokenExpiresAt?: Date | null;
  }): Promise<FacebookAccountEntity> {
    const existing = await this.findByPageIdForUser(data.pageId, data.userId);

    if (existing) {
      await this.repo.update(existing.id, data);
      return (await this.findById(existing.id)) as FacebookAccountEntity;
    }

    return await this.repo.save(this.repo.create(data));
  }
}
