/*
 * Entity - User - Content Automation Platform FASE 2
 * User entity with RBAC and tenant isolation.
 * FASE 9.6: added TypeORM decorators so persistence actually works.
*/

import { Column, CreateDateColumn, Entity, Index, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Role } from './role.entity';
import { Tenant } from './tenant.entity';

@Entity('users')
@Index(['email', 'tenantId'])
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  email!: string;

  @Column()
  passwordHash!: string; // bcrypt/argon2 hash, never plain text

  @Column({ nullable: true })
  name?: string;

  @Column('uuid')
  tenantId!: string;

  @ManyToOne(() => Tenant, { nullable: false })
  tenant?: Tenant;

  @ManyToOne(() => Role, { nullable: false })
  role!: Role;

  @Column({ default: 'active' })
  status: 'active' | 'inactive' | 'suspended' = 'active';

  @Column({ default: false })
  emailVerified: boolean = false;

  @Column({ type: 'datetime', nullable: true })
  lastLoginAt?: Date;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
