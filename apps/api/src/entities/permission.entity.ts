/*
 * Entity - Permission - Content Automation Platform FASE 2
 * Granular permission codes for RBAC.
 * FASE 9.6: added TypeORM decorators so persistence actually works.
*/

import { Column, CreateDateColumn, Entity, Index, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Tenant } from './tenant.entity';

@Entity('permissions')
@Index(['code', 'tenantId'])
export class Permission {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  code!: string; // e.g., "content:create", "content:approve", "project:manage"

  @Column()
  name!: string; // human-readable name

  @Column('uuid')
  tenantId!: string;

  @ManyToOne(() => Tenant, { nullable: false })
  tenant?: Tenant;

  @CreateDateColumn()
  createdAt!: Date;
}
