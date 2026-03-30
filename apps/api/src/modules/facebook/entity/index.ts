import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from 'typeorm';

@Entity('facebook_accounts')
export class FacebookAccountEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  userId!: string;

  @Column({ type: 'varchar', length: 255 })
  facebookUserId!: string;

  @Column({ type: 'varchar', length: 255 })
  pageId!: string;

  @Column({ type: 'varchar', length: 255 })
  pageName!: string;

  @Column({ type: 'text' })
  accessToken!: string;

  @Column({ type: 'timestamptz', nullable: true })
  tokenExpiresAt!: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
