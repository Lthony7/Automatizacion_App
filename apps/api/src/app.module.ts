/*
 * App Module - Content Automation Platform
 * Wires feature modules and infrastructure.
 *
 * FASE 9.6: created missing root module so the NestJS application can bootstrap.
*/

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { TenantsModule } from './modules/tenants/tenants.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { RolesModule } from './modules/roles/roles.module';
import { PermissionsModule } from './modules/permissions/permissions.module';
import { ApiKeysModule } from './modules/api-keys/api-keys.module';
import { VerticalsModule } from './modules/verticals/verticals.module';
import { AIModule } from './modules/ai/ai.module';
import { ContentModule } from './modules/content/content.module';
import { StorageModule } from './infra/storage/storage.module';
import { AuditModule } from './infra/audit/audit.module';

@Module({
  imports: [
    // DB selection: tests/CI run against in-memory SQLite via DB_TYPE=sqlite;
    // production uses Postgres through DATABASE_URL. Schema changes only via
    // migrations (synchronize=false outside tests).
    ...(process.env.DB_TYPE === 'sqlite'
      ? [
          TypeOrmModule.forRoot({
            type: 'better-sqlite3' as any,
            database: ':memory:',
            autoLoadEntities: true,
            synchronize: true,
            retryAttempts: 2,
          }),
        ]
      : [
          TypeOrmModule.forRoot({
            type: 'postgres',
            url: process.env.DATABASE_URL,
            autoLoadEntities: true,
            synchronize: false, // never auto-mutate schema; use migrations
          }),
        ]),
    AuthModule,
    UsersModule,
    TenantsModule,
    ProjectsModule,
    RolesModule,
    PermissionsModule,
    ApiKeysModule,
    VerticalsModule,
    AIModule,
    ContentModule,
    StorageModule,
    AuditModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
