# FASE 0: Multi-Tenancy Design

## Tenant Hierarchy (FASE 0)

```
Tenant
├── Users
├── Projects
│   └── Vertical (e.g., christian, automotive, fitness)
├── Settings
│   └── Installed Verticals
│       ├── christian (ChristianDomainProvider)
│       ├── automotive (AutomotiveDomainProvider)
│       └── fitness (FitnessDomainProvider - future)
└── Configuration
    └── Domain Engine settings
```

## Core Principles (FASE 0)

### 1. Tenant-Isolated Verticals
- Each tenant can install zero, one, or multiple verticals
- Vertical configurations are per-tenant
- No cross-tenant vertical leakage

### 2. Vertical-Agnostic Core
- Core modules (Auth, Users, Tenants, Projects, AI, Media, etc.) know nothing about specific verticals
- Core only knows about the **DomainProvider interface**
- Vertical behavior is resolved at runtime via the interface

### 3. Hierarchy Flow
```
User Authentication
    ↓ (tenant_id from JWT)
Tenant Context Established
    ↓ (query includes tenant_id)
Project Lookup (tenant-scoped)
    ↓ (project.vertical is set)
Domain Engine Resolution
    ↓ (use project.vertical to get DomainProvider)
Vertical-Specific Behavior
    ↓ (content generation, validation, templates, etc.)
Result with Vertical Identity
```

### 4. Installing Verticals Per Tenant

#### Via API
```http
POST /tenant/:id/verticals
{
  "name": "christian",
  "displayName": "Christian Content",
  "domainProvider": "ChristianDomainProvider",
  "isActive": true
}
```

#### Via Database (Prisma seed)
```prisma
// tenant_verticals table (added via migration)
name: String (unique per tenant)
displayName: String
domainProvider: String (class name or registry key)
isActive: Boolean
tenantId: UUID (FK)
```

#### Via Admin UI
- Tenant settings → Verticals → Install/Enable
- Select from available domain providers
- Configure per-project defaults

### 5. Tenant Isolation Guarantees

#### Query Scoping
All queries automatically include tenant_id filter:
- Content queries: `WHERE tenant_id = $tenantId`
- Project queries: `WHERE tenant_id = $tenantId`
- Vertical configs: `WHERE tenant_id = $tenantId`

#### API Enforcement
- Middleware extracts tenant_id from JWT
- All service methods require tenant context
- 403 if tenant context missing or mismatched

#### Data Separation
- Vertical implementations per tenant are separate instances
- Same vertical name across tenants = separate configurations
- No shared state between tenants for vertical configs

### 6. User Vertical Assignment

#### User ↔ Project ↔ Vertical
```
User 1 → Project A ( christian ) → Uses ChristianDomainProvider
User 1 → Project B ( automotive ) → Uses AutomotiveDomainProvider  
User 2 → Project C ( christian ) → Uses ChristianDomainProvider (different config)
```

#### Role-Based Vertical Access
- **admin**: Can install any vertical for tenant
- **editor**: Can create content in assigned vertical projects
- **viewer**: Can view content within their vertical projects
- **content_creator**: Can create content in supported verticals

### 7. FASE 0 vs FASE 1 Multi-Tenancy

#### FASE 0 (Current)
- ✓ Tenant hierarchy defined
- ✓ Vertical installation concept
- ✓ Core agnostic design
- ✓ Interface-based vertical resolution
- ✗ No database schema for tenant_verticals yet
- ✗ No API endpoints for vertical management
- ✗ No UI for vertical management
- ✗ No tenant vertical isolation tested

#### FASE 1 (Planned)
- ✓ Database migration for tenant_verticals
- ✓ API endpoints for vertical CRUD
- ✓ Admin UI vertical management
- ✓ Tenant vertical isolation validated
- ✓ Cross-tenant access prevention
- ✓ Vertical upgrade/downgrade paths

## FASE 0 Checklist

### Completed
- [x] Tenant hierarchy diagram defined
- [x] Core agnostic principle documented
- [x] Vertical installation process (no core mods)
- [x] Per-tenant vertical configuration
- [x] User-project-vertical assignment model
- [x] API concept for vertical registration
- [x] Multi-tenant isolation guarantees
- [x] Role-based vertical access model

### Pending FASE 1
- [ ] Create Prisma migration for tenant_verticals table
- [ ] Implement API endpoints: GET/POST/DELETE /tenant/:id/verticals
- [ ] Build admin UI vertical management pages
- [ ] Test vertical switching with tenant context
- [ ] Validate no cross-tenant vertical leakage
- [ ] Document vertical upgrade strategy