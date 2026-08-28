/*
 * Entity - ApiKey - Content Automation Platform FASE 2
 * Hashed API keys with permissions and rotation tracking.
 * NEVER store API keys in plain text - only the hash.
 * FASE 9.6: added TypeORM decorators so persistence actually works.
*/

import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Tenant } from './tenant.entity';

@Entity('api_keys')
export class ApiKey {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  hash!: string; // bcrypt/argon2 hash, NEVER plain text

  @Column({ length: 16 })
  prefix!: string; // for identification/logging (e.g., "sk_")

  @Column('simple-json')
  permissions: string[] = []; // granted permission codes (denormalized)

  @Column('uuid')
  tenantId!: string;

  @ManyToOne(() => Tenant, { nullable: false })
  tenant?: Tenant;

  @Column({ default: 'active' })
  status: 'active' | 'revoked' | 'expired' = 'active';

  @Column({ type: 'datetime', nullable: true })
  lastUsedAt?: Date;

  @Column({ type: 'datetime', nullable: true })
  revokedAt?: Date;

  @Column({ type: 'datetime', nullable: true })
  lastRotatedAt?: Date;

  @CreateDateColumn()
  createdAt!: Date;
}
