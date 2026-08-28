# Multi-Tenancy Architecture

## Hierarchy

```
Tenant
├── Users
├── Projects
│   ├── Vertical
│   ├── Content
│   ├── Templates
│   ├── Social Accounts
│   └── Analytics
└── Settings
```

## Tenant Concepts

### What is a Tenant?
A tenant represents an independent customer/organization using the platform. Each tenant has:
- Isolated data (rows, schemas, or configuration)
- Custom branding and settings
- Own users with specific roles
- Own projects and content
- Billing plan and quotas

### Tenant Isolation Strategies

1. **Schema-based isolation**: Each tenant has its own PostgreSQL schema
2. **Row-level isolation**: All tables have tenant_id, filtered via application code + RLS
3. **Configuration-based**: Single schema, but all queries filter by tenant_id

**Current approach**: Row-level isolation with tenant_id on relevant tables. Configurable to switch to schema-based later.

## Project Structure Within Tenant

Each tenant can have multiple projects:

```
Project
├── Vertical (e.g., christian, automotive, fitness)
├── Content (content items for this project)
├── Templates (reusable video/text templates)
├── Social Accounts (connected social media profiles)
└── Analytics (performance data for this project's content)
```

### Projects Table
- belongs_to a tenant
- has a vertical (optional - nullable for generic projects)
- can be archived or active
- quota limits per plan

## Users Within Tenant

### User Roles Per Tenant
- **admin**: Full access, manage tenant, users, projects, settings
- **editor**: Create, edit, approve content within projects
- **viewer**: Read-only access to content and analytics
- **content_creator**: Create content ideas and drafts

### User-Project Relationships
- Users can be assigned to specific projects
- Permissions checked per-project within tenant context
- Project creators automatically get admin role

## Vertical Installation

### Plugin-Based Vertical Support
- Verticals are installed as configuration + modules per tenant
- Core domain engine remains agnostic
- Each vertical provides:
  - DomainProvider (content types, prompts, rules, validators)
  - ContentTypes enum
  - Prompts configuration
  - Templates configuration
  - Rules configuration

### Adding a New Vertical
1. Create vertical configuration in tenant_settings
2. Register DomainProvider implementation
3. Add content types, prompts, templates
4. Configure validators and rules
5. Enable for users/projects as needed

## Tenant Settings

Per-tenant configuration:
- plan (free, pro, enterprise)
- allowed_verticals (list of installed verticals)
- quotas (content per month, videos per day, storage)
- enabled_features (ai, tts, rendering, analytics, etc.)
- branding (colors, logo, domain)
- integration settings (API keys, webhooks)

## Tenant Migration

When moving between plans or restructuring:
- Data export/import utilities
- Schema migration support
- Downtime considerations
- Backward compatibility

## Tenant API Endpoints

All API endpoints include tenant_id scoping:
- GET /content?tenant_id=...
- POST /projects (body includes tenant_id or derived from user)
- GET /analytics?tenant_id=...
- Webhooks include tenant context

## Security Implications

- Tenant ID derived from authentication context
- Missing/invalid tenant ID = 403 Forbidden
- Tenant hopping (changing tenant_id) = 403 Forbidden + audit alert
- Cross-tenant operation logging and alerting
- Super-admin can cross tenants with full audit trail