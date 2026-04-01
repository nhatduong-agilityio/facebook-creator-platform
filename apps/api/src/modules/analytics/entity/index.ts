import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn
} from 'typeorm';

@Entity('post_metrics')
export class PostMetricEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  postId!: string;

  @Column({ type: 'integer', default: 0 })
  likes!: number;

  @Column({ type: 'integer', default: 0 })
  comments!: number;

  @Column({ type: 'integer', default: 0 })
  reach!: number;

  @Column({ type: 'integer', default: 0 })
  engagement!: number;

  @CreateDateColumn({ type: 'timestamptz' })
  fetchedAt!: Date;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;
}
