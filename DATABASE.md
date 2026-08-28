# Database Design

## Overview

**ORM: TypeORM** (apps/api) — all persistence goes through TypeORM entities + repositories.
**Prisma** (packages/database) is retained as schema reference/documentation only — not used in runtime.

PostgreSQL for production, SQLite (better-sqlite3) for tests. All tables include created_at, updated_at timestamps. Tenant isolation via tenant_id column on relevant tables.

## Key Tables

### tenants
- id (UUID, PK — PrimaryGeneratedColumn)
- name (String, unique)
- plan (Enum: free, pro, enterprise)
- status (Enum: active, suspended, deleted)
- trial_ends_at (Timestamp, nullable)
- created_at, updated_at

### projects
- id (UUID, PK)
- name (String)
- tenant_id (UUID, FK -> tenants)
- owner_id (UUID, FK -> users — NOT NULL)
- vertical (Enum: christian, automotive, fitness, etc., nullable)
- status (Enum: active, archived)
- created_at, updated_at

### users
- id (UUID, PK)
- email (String, unique)
- password_hash (String — bcrypt, never plain text)
- name (String)
- tenant_id (UUID, FK -> tenants)
- role (Enum: admin, editor, viewer, etc.)
- status (Enum: active, inactive, suspended)
- email_verified (Boolean)
- last_login_at (Timestamp, nullable)
- created_at, updated_at

### roles
- id (UUID, PK)
- name (String, unique within tenant — OWNER, ADMIN, EDITOR, VIEWER)
- description (Text, nullable)
- tenant_id (UUID, FK -> tenants)
- created_at

### permissions
- id (UUID, PK)
- code (String, unique — e.g., "content:create", "video:render")
- name (String)
- description (Text, nullable)
- tenant_id (UUID, FK -> tenants, nullable for global)
- created_at

### api_keys
- id (UUID, PK)
- hash (String, unique — bcrypt/argon2, NEVER stored in plain text)
- prefix (String, for logging/identification — e.g., "sk_")
- permissions (JSON, list of granted permissions)
- status (Enum: active, revoked, expired)
- last_used_at (Timestamp, nullable)
- revoked_at (Timestamp, nullable)
- tenant_id (UUID, FK -> tenants)
- created_at, last_rotated_at

### content
- id (UUID, PK)
- title (String)
- description (Text, nullable)
- script (Text, nullable)
- content_type (Enum: prayer, verse, reflection, story, etc.)
- status (Enum: draft, queued, generated, validated, approved, scheduled, publishing, published, failed, cancelled)
- vertical (Enum: christian, automotive, etc., nullable)
- tenant_id (UUID, FK -> tenants)
- project_id (UUID, FK -> projects, nullable)
- user_id (UUID, FK -> users, nullable — creator/owner)
- ai_provider (Enum: gemini, openai, groq, nullable)
- ai_model (String, nullable)
- cost_ai (Decimal, default 0)
- cost_tts (Decimal, default 0)
- cost_rendering (Decimal, default 0)
- metadata (JSON, flexible additional fields)
- published_at (Timestamp, nullable)
- published_on (String — youtube, instagram, facebook, nullable)
- created_at, updated_at

### approvals
- id (UUID, PK)
- content_id (UUID, FK -> content)
- status (Enum: approved, rejected, warning)
- reviewer_id (UUID, FK -> users, nullable)
- reviewed_at (Timestamp, nullable)
- comments (Text, nullable)
- tenant_id (UUID, FK -> tenants)

### media
- id (UUID, PK)
- content_id (UUID, FK -> content, unique)
- source (Enum: ai_generated, upload, external, unsplash, pexels, etc.)
- url (String — storage path)
- author (String, nullable)
- license (Enum: copyright, creative_commercial, creative_attribution, public_domain, etc.)
- license_url (String, nullable)
- commercial_use (Boolean, default false)
- attribution_required (Boolean, default false)
- width (Integer, nullable)
- height (Integer, nullable)
- duration (Float, nullable — seconds for video/audio)
- format (String, nullable)
- transcoded (Boolean, default false)
- created_at, updated_at

### audio
- id (UUID, PK)
- media_id (UUID, FK -> media, unique)
- tts_provider (Enum: google, elevenlabs, local, nullable)
- tts_voice (String, nullable)
- tts_language (String, nullable)
- audio_url (String — storage path)
- duration (Float, seconds)
- quality (Enum: low, medium, high)
- cost (Decimal, default 0)
- created_at, updated_at

### subtitles
- id (UUID, PK)
- media_id (UUID, FK -> media, unique)
- language (String — e.g., "en", "es")
- text (Text — subtitle content)
- file_url (String, nullable — SRT/VTT file path)
- created_at, updated_at

### templates
- id (UUID, PK)
- name (String)
- description (Text, nullable)
- vertical (Enum: christian, automotive, etc., nullable)
- type (Enum: video, audio, image, text, mixed)
- template_data (JSON — structure depends on type)
- thumbnail_url (String, nullable)
- is_public (Boolean, default false)
- usage_count (Integer, default 0)
- cost_template (Decimal, default 0)
- created_at, updated_at

### social_accounts
- id (UUID, PK)
- user_id (UUID, FK -> users)
- platform (Enum: youtube, instagram, facebook, twitter, tiktok, linkedin)
- provider_account_id (String — platform-specific ID)
- access_token (Text, encrypted)
- refresh_token (Text, encrypted)
- expires_at (Timestamp, nullable)
- status (Enum: connected, disconnected, error)
- tenant_id (UUID, FK -> tenants)
- created_at, updated_at

### publisher_attempts
- id (UUID, PK)
- content_id (UUID, FK -> content)
- platform (Enum: youtube, instagram, facebook, etc.)
- status (Enum: success, failed, partial)
- response_data (JSON, platform response)
- error_message (Text, nullable)
- attempted_at (Timestamp)
- tenant_id (UUID, FK -> tenants)

### analytics
- id (UUID, PK)
- content_id (UUID, FK -> content)
- platform (Enum: youtube, instagram, facebook, etc., nullable)
- metric_type (Enum: views, likes, comments, shares, followers, watch_time, retention, publication_time)
- metric_value (Integer/Float)
- recorded_at (Timestamp, default now)
- tenant_id (UUID, FK -> tenants)

### cost_registries
- id (UUID, PK)
- description (String — e.g., "AI generation per video")
- category (Enum: ai, tts, storage, rendering, api_usage)
- amount (Decimal)
- reference_type (Enum: content, project, tenant, user, nullable)
- reference_id (UUID, nullable)
- metadata (JSON, nullable)
- created_at

### state_transitions
- id (UUID, PK)
- from_state (Enum: all valid states)
- to_state (Enum: all valid states)
- allowed (Boolean, default true)
- reason (Text, nullable)
- role_required (String, nullable)
- created_at

## Indexes

- Composite indexes on (tenant_id, project_id) for frequent queries
- Index on content.status for workflow queries
- Index on content.vertical for vertical filtering
- Index on api_keys.hash for lookup
- Index on media.license for compliance queries
- Partial indexes for active tenants only where appropriate

## TypeORM Highlights

- All FK relationships include onDelete: 'Restrict' or 'SetNull'
- Tenant_id is optional on some tables for super-admin/general use
- Entities use PrimaryGeneratedColumn('uuid') for auto-generated IDs
- JSON columns for flexible metadata (ai_provider, permissions, template_data)
- synchronize: true for tests (SQLite in-memory), synchronize: false for production (use migrations)
