/*
 * Entity - Project - Content Automation Platform FASE 2
 * Content project within a tenant.
 * FASE 9.6: added TypeORM decorators so persistence actually works.
*/

import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Tenant } from './tenant.entity';

@Entity('projects')
export class Project {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ type: 'varchar', nullable: true })
  vertical?: 'christian' | 'automotive' | 'fitness' | null;

  @Column({ default: 'active' })
  status: 'active' | 'archived' = 'active';

  @Column('uuid')
  tenantId!: string;

  @ManyToOne(() => Tenant, { nullable: false })
  tenant?: Tenant;

  @Column('uuid')
  ownerId!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
