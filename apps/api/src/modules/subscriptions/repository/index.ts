import { BaseRepository } from '@/shared/repository';

// Types
import { SubscriptionEntity } from '../entity';
import type { SubscriptionRepositoryPort } from '../ports';
import type { DataSource } from 'typeorm';

export class SubscriptionRepository
  extends BaseRepository<SubscriptionEntity>
  implements SubscriptionRepositoryPort
{
  constructor(dataSource: DataSource) {
    super(dataSource, SubscriptionEntity);
  }

  /**
   * Finds the current subscription for a user.
   * A current subscription is the one with the latest update date.
   * Returns null when not found — callers decide whether to throw NotFoundError.
   * @param {string} userId - the user ID
   * @returns {Promise<SubscriptionEntity | null>} - a promise that resolves to the found subscription entity or null if not found
   */
  async findCurrentByUserId(
    userId: string
  ): Promise<SubscriptionEntity | null> {
    return await this.repo.findOne({
      where: { userId },
      order: { updatedAt: 'DESC' }
    });
  }

  /**
   * Finds a subscription entity by its Stripe subscription ID.
   * Returns null when not found — callers decide whether to throw NotFoundError.
   * @param {string} stripeSubscriptionId - the Stripe subscription ID
   * @returns {Promise<SubscriptionEntity | null>} - a promise that resolves to the found subscription entity or null if not found
   */
  async findByStripeSubscriptionId(
    stripeSubscriptionId: string
  ): Promise<SubscriptionEntity | null> {
    return await this.repo.findOne({
      where: { stripeSubscriptionId }
    });
  }

  /**
   * Saves a subscription entity to the database.
   * Creates a new subscription if the id is not provided, otherwise updates the existing subscription.
   * @param {Partial<SubscriptionEntity> & Pick<SubscriptionEntity, 'userId' | 'planId'>} data - the subscription entity data to save
   * @returns {Promise<SubscriptionEntity>} - a promise that resolves to the saved subscription entity
   */
  async saveSubscription(
    data: Partial<SubscriptionEntity> &
      Pick<SubscriptionEntity, 'userId' | 'planId'>
  ): Promise<SubscriptionEntity> {
    const entity = this.repo.create(data);
    return await this.repo.save(entity);
  }
}
