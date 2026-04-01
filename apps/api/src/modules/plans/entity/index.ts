import { PlanCode } from '@/shared/types/billing';
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn
} from 'typeorm';

@Entity('plans')
export class PlanEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 20, unique: true })
  code!: PlanCode;

  @Column({ type: 'varchar', length: 50 })
  name!: string;

  @Column({ type: 'text' })
  description!: string;

  @Column({ type: 'integer', default: 0 })
  monthlyPrice!: number;

  @Column({ type: 'integer', default: 10 })
  postLimit!: number;

  @Column({ type: 'integer', default: 3 })
  scheduledLimit!: number;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @CreateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
