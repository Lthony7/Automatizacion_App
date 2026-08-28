/*
 * Entity - Content - Content Automation Platform FASE 2
 * Content item with state machine and tenant/project scoping.
 * FASE 9.6: added TypeORM decorators so persistence actually works.
*/

import { Column, CreateDateColumn, Entity, Index, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { User } from './user.entity';
import { Tenant } from './tenant.entity';

@Entity('content')
@Index(['tenantId'])
export class Content {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ nullable: true })
  declare hook?: string;

  @Column()
  title!: string;

  @Column({ type: 'text', nullable: true })
  declare script?: string;

  @Column({ type: 'text', nullable: true })
  declare description?: string;

  @Column({ nullable: true })
  declare cta?: string;

  @Column('simple-json', { nullable: true })
  declare hashtags?: string[];

  @Column('simple-json', { nullable: true })
  declare references?: string[];

  @Column()
  contentType!: 'prayer' | 'verse' | 'reflection' | 'story' | string;

  @Column({ default: 'draft' })
  status: 'draft' | 'queued' | 'generated' | 'validated' | 'approved' | 'scheduled' | 'publishing' | 'published' | 'failed' | 'cancelled' = 'draft';

  @Column({ type: 'varchar', nullable: true })
  declare vertical?: 'christian' | 'automotive' | 'fitness' | null;

  @Column('uuid')
  tenantId!: string;

  @ManyToOne(() => Tenant, { nullable: false })
  tenant?: Tenant;

  @Column('uuid', { nullable: true })
  declare projectId?: string;

  @Column('uuid', { nullable: true })
  declare campaignId?: string;

  @Column('uuid', { nullable: true })
  declare userId?: string;

  @ManyToOne(() => User, { nullable: true })
  owner?: User;

  @Column({ type: 'varchar', nullable: true })
  declare aiProvider?: 'gemini' | 'openai' | 'groq' | null;

  @Column({ nullable: true })
  declare aiModel?: string;

  @Column({ type: 'decimal', default: 0 })
  costAi: number = 0;

  @Column({ type: 'decimal', default: 0 })
  costTts: number = 0;

  @Column({ type: 'decimal', default: 0 })
  costRendering: number = 0;

  @Column('simple-json', { nullable: true })
  declare metadata?: any;

  @Column({ type: 'datetime', nullable: true })
  declare publishedAt?: Date;

  @Column({ type: 'varchar', nullable: true })
  declare publishedOn?: 'youtube' | 'instagram' | 'facebook' | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
