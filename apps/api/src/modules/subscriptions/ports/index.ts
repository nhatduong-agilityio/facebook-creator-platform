import type { SubscriptionEntity } from '../entity';

export interface SubscriptionRepositoryPort {
  findCurrentByUserId(userId: string): Promise<SubscriptionEntity | null>;
  findByStripeSubscriptionId(
    stripeSubscriptionId: string
  ): Promise<SubscriptionEntity | null>;
  saveSubscription(
    data: Partial<SubscriptionEntity> &
      Pick<SubscriptionEntity, 'userId' | 'planId'>
  ): Promise<SubscriptionEntity>;
}
