/*
 * Entity - Tenant - Content Automation Platform FASE 2
 * Multi-tenant foundation entity.
 * FASE 9.6: added TypeORM decorators so persistence actually works.
*/

import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('tenants')
export class Tenant {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column({ default: 'free' })
  plan: 'free' | 'pro' | 'enterprise' = 'free';

  @Column({ default: 'active' })
  status: 'active' | 'suspended' | 'deleted' = 'active';

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
