/*
 * Entity - UserRole - Content Automation Platform FASE 2
 * Junction table for many-to-many User-Role relationship.
 * FASE 9.6: added TypeORM decorators so persistence actually works.
*/

import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('user_roles')
export class UserRole {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  userId!: string;

  @Column('uuid')
  roleId!: string;
}
