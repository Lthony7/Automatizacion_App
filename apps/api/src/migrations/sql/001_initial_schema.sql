-- ============================================================================
-- Migration 001: Initial Schema + Row-Level Security
-- Content Automation Platform — FASE 9.6
--
-- Run: psql -U postgres -d content_automation -f 001_initial_schema.sql
-- Rollback: psql -U postgres -d content_automation -f 001_initial_schema_rollback.sql
-- ============================================================================

BEGIN;

-- ── Tables ───────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS tenants (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(255) NOT NULL UNIQUE,
  plan        VARCHAR(20)  NOT NULL DEFAULT 'free',
  status      VARCHAR(20)  NOT NULL DEFAULT 'active',
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS roles (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(50)  NOT NULL,
  description TEXT,
  tenant_id   UUID         NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, name)
);

CREATE TABLE IF NOT EXISTS permissions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code        VARCHAR(100) NOT NULL UNIQUE,
  name        VARCHAR(255) NOT NULL,
  description TEXT,
  tenant_id   UUID         REFERENCES tenants(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS role_permissions (
  role_id       UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email           VARCHAR(255) NOT NULL,
  password_hash   VARCHAR(255) NOT NULL,
  name            VARCHAR(255),
  tenant_id       UUID         NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  role_id         UUID         NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
  status          VARCHAR(20)  NOT NULL DEFAULT 'active',
  email_verified  BOOLEAN      NOT NULL DEFAULT false,
  last_login_at   TIMESTAMPTZ,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, email)
);

CREATE TABLE IF NOT EXISTS projects (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(255) NOT NULL,
  description TEXT,
  vertical    VARCHAR(50),
  status      VARCHAR(20)  NOT NULL DEFAULT 'active',
  tenant_id   UUID         NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  owner_id    UUID         NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS api_keys (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hash             VARCHAR(255) NOT NULL,
  prefix           VARCHAR(16)  NOT NULL,
  permissions      JSONB        NOT NULL DEFAULT '[]',
  tenant_id        UUID         NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  status           VARCHAR(20)  NOT NULL DEFAULT 'active',
  last_used_at     TIMESTAMPTZ,
  revoked_at       TIMESTAMPTZ,
  last_rotated_at  TIMESTAMPTZ,
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS content (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hook            VARCHAR(255),
  title           VARCHAR(500) NOT NULL,
  script          TEXT,
  description     TEXT,
  cta             VARCHAR(500),
  hashtags        JSONB        DEFAULT '[]',
  references      JSONB,
  content_type    VARCHAR(100) NOT NULL,
  status          VARCHAR(30)  NOT NULL DEFAULT 'draft',
  vertical        VARCHAR(50),
  tenant_id       UUID         NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  project_id      UUID         REFERENCES projects(id) ON DELETE SET NULL,
  campaign_id     UUID,
  user_id         UUID         REFERENCES users(id) ON DELETE SET NULL,
  ai_provider     VARCHAR(50),
  ai_model        VARCHAR(100),
  cost_ai         NUMERIC(12,4) NOT NULL DEFAULT 0,
  cost_tts        NUMERIC(12,4) NOT NULL DEFAULT 0,
  cost_rendering  NUMERIC(12,4) NOT NULL DEFAULT 0,
  metadata        JSONB,
  published_at    TIMESTAMPTZ,
  published_on    VARCHAR(50),
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- ── Indexes ──────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_users_tenant      ON users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_users_email       ON users(email);
CREATE INDEX IF NOT EXISTS idx_projects_tenant   ON projects(tenant_id);
CREATE INDEX IF NOT EXISTS idx_content_tenant    ON content(tenant_id);
CREATE INDEX IF NOT EXISTS idx_content_status    ON content(status);
CREATE INDEX IF NOT EXISTS idx_content_vertical  ON content(vertical);
CREATE INDEX IF NOT EXISTS idx_content_project   ON content(project_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_hash     ON api_keys(hash);
CREATE INDEX IF NOT EXISTS idx_api_keys_tenant   ON api_keys(tenant_id);
CREATE INDEX IF NOT EXISTS idx_roles_tenant      ON roles(tenant_id);

-- ── Row-Level Security ───────────────────────────────────────────────────────
-- Requires: ALTER SYSTEM SET row_security = on; (default in PG 15+)
--
-- Strategy: session variable `app.current_tenant_id` set by the API middleware
-- on every request. Each RLS policy checks this variable against the row's
-- tenant_id column, enforcing isolation at the database level.

-- Enable RLS on all tenant-scoped tables
ALTER TABLE users      ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects   ENABLE ROW LEVEL SECURITY;
ALTER TABLE content    ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys   ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles      ENABLE ROW LEVEL SECURITY;

-- Force RLS even for table owners (defense in depth)
ALTER TABLE users      FORCE ROW LEVEL SECURITY;
ALTER TABLE projects   FORCE ROW LEVEL SECURITY;
ALTER TABLE content    FORCE ROW LEVEL SECURITY;
ALTER TABLE api_keys   FORCE ROW LEVEL SECURITY;
ALTER TABLE roles      FORCE ROW LEVEL SECURITY;

-- ── RLS Policies ─────────────────────────────────────────────────────────────
-- Each policy: allow if the session tenant matches the row's tenant_id.
-- Super-admin bypass via `app.is_super_admin` flag (for cross-tenant ops).

-- USERS: tenant isolation
CREATE POLICY users_tenant_isolation ON users
  USING (tenant_id::text = current_setting('app.current_tenant_id', true))
  WITH CHECK (tenant_id::text = current_setting('app.current_tenant_id', true));

-- PROJECTS: tenant isolation
CREATE POLICY projects_tenant_isolation ON projects
  USING (tenant_id::text = current_setting('app.current_tenant_id', true))
  WITH CHECK (tenant_id::text = current_setting('app.current_tenant_id', true));

-- CONTENT: tenant isolation
CREATE POLICY content_tenant_isolation ON content
  USING (tenant_id::text = current_setting('app.current_tenant_id', true))
  WITH CHECK (tenant_id::text = current_setting('app.current_tenant_id', true));

-- API_KEYS: tenant isolation
CREATE POLICY api_keys_tenant_isolation ON api_keys
  USING (tenant_id::text = current_setting('app.current_tenant_id', true))
  WITH CHECK (tenant_id::text = current_setting('app.current_tenant_id', true));

-- ROLES: tenant isolation
CREATE POLICY roles_tenant_isolation ON roles
  USING (tenant_id::text = current_setting('app.current_tenant_id', true))
  WITH CHECK (tenant_id::text = current_setting('app.current_tenant_id', true));

-- ── Permissions (no RLS — permissions are global, scoped at application level) ──
-- Permissions table does NOT have RLS because permission codes are shared
-- across tenants. Tenant scoping for permissions is enforced at the API layer.

COMMIT;
