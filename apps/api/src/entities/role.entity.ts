/*
 * Entity - Role - Content Automation Platform FASE 2
 * RBAC role entity with permission assignments.
 * FASE 9.6: added TypeORM decorators so persistence actually works.
*/

import { Column, CreateDateColumn, Entity, ManyToMany, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Permission } from './permission.entity';
import { Tenant } from './tenant.entity';

@Entity('roles')
export class Role {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column({ nullable: true })
  description?: string;

  @Column('uuid')
  tenantId!: string;

  @ManyToOne(() => Tenant, { nullable: false })
  tenant?: Tenant;

  @ManyToMany(() => Permission, { cascade: true })
  permissions?: Permission[];

  @CreateDateColumn()
  createdAt!: Date;
}
