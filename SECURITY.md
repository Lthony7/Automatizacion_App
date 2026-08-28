# Security Design

## Authentication

### JWT Implementation
- Access tokens: JWT with short expiry (15 minutes)
- Refresh tokens: Rotating refresh tokens with longer expiry (30 days)
- Token payload includes: user_id, tenant_id, role, permissions
- Token signing: HS256 with secret key from environment variables
- Token revocation via JTI (JWT ID) blacklist in Redis

### Refresh Token Flow
1. Access token expires
2. Client uses refresh token to get new access token
3. Old refresh token revoked, new one issued
4. Maximum refresh token usage before re-authentication

## Authorization

### RBAC Permission Matrix

| Resource          | Action    | OWNER | ADMIN | EDITOR | CONTENT_CREATOR | VIEWER |
|-------------------|-----------|:-----:|:-----:|:------:|:---------------:|:------:|
| tenants           | create    |  ✅   |  ✅*  |   ❌   |       ❌       |   ❌   |
| tenants           | read      |  ✅   |  ✅   |   ✅   |       ✅       |   ✅   |
| tenants           | update    |  ✅   |  ✅   |   ❌   |       ❌       |   ❌   |
| projects          | create    |  ✅   |  ✅   |   ✅   |       ✅       |   ❌   |
| projects          | read      |  ✅   |  ✅   |   ✅   |       ✅       |   ✅   |
| projects          | update    |  ✅   |  ✅   |   ✅   |       ❌       |   ❌   |
| projects          | delete    |  ✅   |  ✅   |   ❌   |       ❌       |   ❌   |
| content           | create    |  ✅   |  ✅   |   ✅   |       ✅       |   ❌   |
| content           | read      |  ✅   |  ✅   |   ✅   |       ✅       |   ✅   |
| content           | update    |  ✅   |  ✅   |   ✅   |    own only    |   ❌   |
| content           | approve   |  ✅   |  ✅   |   ❌   |       ❌       |   ❌   |
| content           | publish   |  ✅   |  ✅   |   ❌   |       ❌       |   ❌   |
| users             | create    |  ✅   |  ✅   |   ❌   |       ❌       |   ❌   |
| users             | read      |  ✅   |  ✅   |   ✅   |       ❌       |   ❌   |
| users             | update    |  ✅   |  ✅   |   ❌   |       ❌       |   ❌   |
| users             | assign_role | ✅ |  ✅   |   ❌   |       ❌       |   ❌   |
| roles             | create    |  ✅   |  ✅   |   ❌   |       ❌       |   ❌   |
| roles             | read      |  ✅   |  ✅   |   ✅   |       ✅       |   ✅   |
| api-keys          | create    |  ✅   |  ✅   |   ❌   |       ❌       |   ❌   |
| api-keys          | read      |  ✅   |  ✅   |   ❌   |       ❌       |   ❌   |
| api-keys          | revoke    |  ✅   |  ✅   |   ❌   |       ❌       |   ❌   |
| api-keys          | rotate    |  ✅   |  ✅   |   ❌   |       ❌       |   ❌   |
| workflows         | transition|  ✅   |  ✅   |   ✅†  |       ❌       |   ❌   |
| analytics         | read      |  ✅   |  ✅   |   ✅   |       ✅       |   ✅   |
| costs             | read      |  ✅   |  ✅   |   ❌   |       ❌       |   ❌   |
| costs             | update    |  ✅   |  ✅   |   ❌   |       ❌       |   ❌   |
| audit             | read      |  ✅   |  ✅   |   ❌   |       ❌       |   ❌   |

\* ADMIN can create tenants only if `TENANT_CREATION_ROLES` includes ADMIN (configurable).
† EDITOR can transition content through specific workflow states (draft→queued→generated→validated).

### Tenant Isolation
- Every query includes tenant_id filter
- Middleware validates tenant context from JWT
- Row-level security policies in PostgreSQL
- No cross-tenant data exposure via IDOR

## API Security

### API Keys
- Never stored in plain text (hashed with bcrypt/argon2)
- Hash + prefix for identification
- Permissions granted per key
- Status: active, revoked, expired
- last_used_at tracking for rotation
- revoked_at timestamp

### Rate Limiting
- Auth endpoints: 10 requests / 60s / IP (in-memory sliding window)
- API endpoints: 100 requests / 60s / IP
- Headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `Retry-After`
- Replace with Redis-backed limiter when scaling horizontally

### Input Validation
- Global ValidationPipe: whitelist + forbidNonWhitelisted + transform
- class-validator decorators on DTOs
- SQL injection prevention via TypeORM (parameterized queries)
- XSS prevention via Helmet CSP headers

### Headers (via Helmet)
- Content-Security-Policy: self-only, no inline scripts, frame-ancestors none
- X-Frame-Options: DENY (via CSP frame-ancestors)
- X-Content-Type-Options: nosniff
- Referrer-Policy: strict-origin-when-cross-origin
- HSTS: enabled in production
- X-DNS-Prefetch-Control: off

## Data Protection

### Secret Management
- API keys, database passwords, external service credentials via environment variables
- Never committed to repository
- Boot fails if secrets are missing or contain placeholder values
- CI scanning via gitleaks (prevents secret commits)

### Encryption
- At rest: PostgreSQL Transparent Data Encryption (TDE) or disk encryption
- In transit: TLS 1.3+ for all connections
- Sensitive fields encrypted: passwords, tokens, access keys

### Audit Logging
- All critical operations logged (create, update, delete, state transitions, approvals)
- Audit entries: user_id, tenant_id, action, resource_id, timestamp, ip_address
- Immutable audit log (append-only)
- GDPR/privacy compliance considerations

## Multi-Tenant Security

### Tenant Context
- Tenant ID extracted from JWT or derived from authenticated user
- Middleware enforces tenant context on all requests
- Tenant isolation at application and database level

### IDOR Prevention
- Every resource lookup validates ownership: resource.tenant_id == user.tenant_id
- No direct resource IDs in URLs without tenant context
- Repository pattern with tenant scoping

### Isolation Strategies
- Per-tenant database schemas (configurable)
- Row-level security (RLS) policies
- Application-level tenant filtering as primary defense

## Security Checklist

- [x] JWT implementation with refresh tokens (FASE 1-2)
- [x] RBAC with granular permissions (FASE 2, matrix above)
- [x] API key management (hashed, permissions, rotation) (FASE 2)
- [x] Rate limiting per endpoint (auth: 10/60s, API: 100/60s) (FASE 9.6)
- [x] Input validation (ValidationPipe + class-validator) (FASE 7)
- [x] Security headers (Helmet + CSP) (FASE 9.6)
- [x] CSP configuration (self-only, no inline scripts) (FASE 9.6)
- [x] Secret management (env vars, boot validation) (FASE 9.6)
- [x] Secret scanning in CI (gitleaks) (FASE 9.6)
- [x] Audit logging for critical operations (FASE 16)
- [x] Tenant isolation (middleware + RLS) (FASE 3)
- [x] IDOR prevention strategies (FASE 3)
- [x] Encryption at rest and in transit (production)
