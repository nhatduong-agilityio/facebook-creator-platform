// Shared
import { BaseRepository } from '@/shared/repository';

// Types
import { PostMetricEntity } from '../entity';
import type { PostMetricRepositoryPort } from '../ports';
import { type DataSource, In } from 'typeorm';

export class PostMetricRepository
  extends BaseRepository<PostMetricEntity>
  implements PostMetricRepositoryPort
{
  constructor(dataSource: DataSource) {
    super(dataSource, PostMetricEntity);
  }

  /**
   * Creates a new post metric snapshot from the given data.
   * @param {object} data - an object containing the post ID, likes, comments, reach, engagement, and fetched at date
   * @returns {Promise<PostMetricEntity>} - a promise that resolves to the created post metric entity
   */
  async createSnapshot(data: {
    postId: string;
    likes: number;
    comments: number;
    reach: number;
    engagement: number;
    fetchedAt: Date;
  }): Promise<PostMetricEntity> {
    return await this.repo.save(this.repo.create(data));
  }

  /**
   * Finds the latest post metric for each post ID in the given array.
   * Returns a map where the key is the post ID and the value is the latest post metric.
   * If the given array is empty, an empty map is returned.
   * @param {string[]} postIds - an array of post IDs
   * @returns {Promise<Map<string, PostMetricEntity>>} - a promise that resolves to a map of post metrics
   */
  async findLatestByPostIds(
    postIds: string[]
  ): Promise<Map<string, PostMetricEntity>> {
    if (postIds.length === 0) {
      return new Map();
    }

    const metrics = await this.repo.find({
      where: {
        postId: In(postIds)
      },
      order: {
        fetchedAt: 'DESC',
        createdAt: 'DESC'
      }
    });

    const latest = new Map<string, PostMetricEntity>();

    for (const metric of metrics) {
      if (!latest.has(metric.postId)) {
        latest.set(metric.postId, metric);
      }
    }

    return latest;
  }
}
