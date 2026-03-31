// Shared
import { BaseRepository } from '@/shared/repository';

// Types
import type { DataSource } from 'typeorm';
import { PostEntity } from '../entity';
import type { PostRepositoryPort } from '../ports';

export class PostRepository
  extends BaseRepository<PostEntity>
  implements PostRepositoryPort
{
  constructor(dataSource: DataSource) {
    super(dataSource, PostEntity);
  }

  /**
   * Find all posts associated with a user.
   * Returns an array of post entities ordered by creation date (DESC).
   * @param {string} userId - the user ID
   * @returns {Promise<PostEntity[]>} - a promise that resolves to an array of post entities
   */
  async findAllByUserId(userId: string): Promise<PostEntity[]> {
    return await this.repo.find({
      where: { userId },
      order: { createdAt: 'DESC' }
    });
  }

  /**
   * Finds a post by ID and user ID.
   * Returns null when not found — callers decide whether to throw NotFoundError.
   * @param {string} id - the post ID
   * @param {string} userId - the user ID
   * @returns {Promise<PostEntity | null>} - a promise that resolves to the found post entity or null if not found
   */
  async findByIdForUser(
    id: string,
    userId: string
  ): Promise<PostEntity | null> {
    return await this.repo.findOne({
      where: { id, userId }
    });
  }

  /**
   * Counts the number of posts associated with a user.
   * @param {string} userId - the user ID
   * @returns {Promise<number>} - a promise that resolves to the number of posts associated with the user
   */
  async countByUserId(userId: string): Promise<number> {
    return await this.repo.count({
      where: { userId }
    });
  }

  /**
   * Counts the number of scheduled posts associated with a user.
   * If excludePostId is provided, it will be excluded from the count.
   * @param {string} userId - the user ID
   * @param {string | undefined} excludePostId - the ID of the post to exclude from the count
   * @returns {Promise<number>} - a promise that resolves to the number of scheduled posts associated with the user
   */
  async countScheduledByUserId(
    userId: string,
    excludePostId?: string
  ): Promise<number> {
    const queryBuilder = this.repo
      .createQueryBuilder('post')
      .where('post.userId = :userId', { userId })
      .andWhere('post.status = :status', { status: 'scheduled' });

    if (excludePostId) {
      queryBuilder.andWhere('post.id != :excludePostId', { excludePostId });
    }

    return await queryBuilder.getCount();
  }

  /**
   * Finds all scheduled posts associated with a user that are ready to be published.
   * Posts are considered ready to be published when their scheduled date is before the given date.
   * @param {Date} before - the date to check against
   * @returns {Promise<PostEntity[]>} - a promise that resolves to an array of post entities
   */
  async findReadyToPublish(before: Date): Promise<PostEntity[]> {
    return await this.repo
      .find({
        where: {
          status: 'scheduled'
        }
      })
      .then(posts =>
        posts.filter(
          post =>
            post.scheduledAt !== null &&
            post.scheduledAt.getTime() < before.getTime()
        )
      );
  }

  /**
   * Saves a post entity to the database.
   * Creates a new post if the id is not provided, otherwise updates the existing post.
   * @param {Partial<PostEntity>} data - the post entity data to save
   * @returns {Promise<PostEntity>} - a promise that resolves to the saved post entity
   */
  async savePost(data: Partial<PostEntity>): Promise<PostEntity> {
    const entity = this.repo.create(data);
    return await this.repo.save(entity);
  }
}
