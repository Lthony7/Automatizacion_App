-- ============================================================================
-- Rollback 001: Drop all tables and RLS policies
-- ============================================================================

BEGIN;

DROP POLICY IF EXISTS users_tenant_isolation    ON users;
DROP POLICY IF EXISTS projects_tenant_isolation ON projects;
DROP POLICY IF EXISTS content_tenant_isolation  ON content;
DROP POLICY IF EXISTS api_keys_tenant_isolation ON api_keys;
DROP POLICY IF EXISTS roles_tenant_isolation    ON roles;

ALTER TABLE users      DISABLE ROW LEVEL SECURITY;
ALTER TABLE projects   DISABLE ROW LEVEL SECURITY;
ALTER TABLE content    DISABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys   DISABLE ROW LEVEL SECURITY;
ALTER TABLE roles      DISABLE ROW LEVEL SECURITY;

ALTER TABLE users      NO FORCE ROW LEVEL SECURITY;
ALTER TABLE projects   NO FORCE ROW LEVEL SECURITY;
ALTER TABLE content    NO FORCE ROW LEVEL SECURITY;
ALTER TABLE api_keys   NO FORCE ROW LEVEL SECURITY;
ALTER TABLE roles      NO FORCE ROW LEVEL SECURITY;

DROP TABLE IF EXISTS content CASCADE;
DROP TABLE IF EXISTS api_keys CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS role_permissions CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS permissions CASCADE;
DROP TABLE IF EXISTS roles CASCADE;
DROP TABLE IF EXISTS tenants CASCADE;

COMMIT;
