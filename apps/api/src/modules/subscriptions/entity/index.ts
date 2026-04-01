import { SUBSCRIPTION_STATUSES } from '@/shared/constants/subscription';
import { SubscriptionStatus } from '@/shared/types/subscription';
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn
} from 'typeorm';

@Entity('subscriptions')
export class SubscriptionEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  userId!: string;

  @Column({ type: 'uuid' })
  planId!: string;

  @Column({ type: 'varchar', length: 255, nullable: true, unique: true })
  stripeSubscriptionId!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  stripeCustomerId!: string | null;

  @Column({
    type: 'enum',
    enum: SUBSCRIPTION_STATUSES,
    default: SUBSCRIPTION_STATUSES[0]
  })
  status!: SubscriptionStatus;

  @CreateDateColumn({ type: 'timestamptz', nullable: true })
  currentPeriodEnd!: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @CreateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
