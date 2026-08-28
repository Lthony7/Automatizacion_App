# FASE 0: Architectural Decisions (ADRs)

## ADR-003: Domain Engine (FASE 0)

### Title
Domain Engine with conceptual interfaces for vertical plug-in architecture.

### Status
Accepted - FASE 0 implementation

### Context
The Content Automation Platform needs to support multiple content verticals (Christian, Automotive, Fitness, etc.) without the Core domain being coupled to any specific niche. The Core must remain completely agnostic of Bible, Christian, Automotive, or any domain-specific logic.

### Decision
Create a **Domain Engine** with 7 conceptual interfaces that verticals implement. The Core modules (Auth, Users, Tenants, Projects, AI, Media, Audio, Video, Workflow, Scheduler, Publication, Analytics, Costs) depend only on these interfaces, never on concrete vertical implementations.

**Seven Interfaces:**
1. **DomainProvider** - Root interface combining all others
2. **DomainValidator** - Content validation per vertical
3. **DomainContentTypeProvider** - Valid content types per vertical
4. **DomainPromptProvider** - Versioned prompts (tenant/project/vertical/version)
5. **DomainRuleProvider** - Workflow and business rules per vertical
6. **DomainTemplateProvider** - Templates per vertical
7. **DomainKnowledgeProvider** - Domain-specific knowledge base

### Consequences

#### Positive
- Core never depends on Christian, Automotive, or any vertical
- New verticals can be added without touching Core code
- Core modules remain testable without vertical dependencies
- Horizontal scaling: add verticals without impacting existing ones
- Multi-tenant: different tenants can have different verticals installed

#### Negative/Challenges
- Initial learning curve for interface-based design
- Need for vertical installation process documentation
- Interface evolution requires coordination (breaking changes rare)
- More upfront design time vs. monolithic approach

### Alternatives Considered and Rejected

| Alternative | Reason for Rejection |
|-------------|---------------------|
| **Direct domain calls in Core** | Violates core principle, creates circular dependencies, prevents vertical addition without Core modifications |
| **Inheritance-based approach** | Tight coupling, Core would need to know about all vertical subclasses, harder to add new verticals |
| **Plugin system with callbacks** | More complex, requires Core to know plugin API, harder to standardize across verticals |
| **Separate microservices per vertical** | Over-engineering for FASE 0, defeats modular monolith purpose, higher ops overhead |

### Implementation Details (FASE 0)

#### Interface Definitions (TypeScript Conceptual)

```typescript
// src/core/interfaces/domain.ts

export interface ContentType {
  id: string;
  name: string;
  displayName: string;
  description: string;
  vertical: string;
}

export interface ValidationResult {
  status: 'VALID' | 'WARNING' | 'INVALID';
  errors: string[];
  warnings: string[];
}

export interface Prompt {
  id: string;
  contentType: string;
  version: string;
  title: string;
  template: string;
  variables: string[];
  isDefault: boolean;
  tenantId?: string;
  projectId?: string;
}

export interface StateTransitionRule {
  from: string;
  to: string;
  allowed: boolean;
  reason?: string;
  roleRequired?: string;
}

// The 7 core interfaces

export interface DomainProvider {
  getContentTypes(): Promise<ContentType[]>;
  getValidator(): DomainValidator;
  getPromptProvider(): DomainPromptProvider;
  getRuleProvider(): DomainRuleProvider;
  getTemplateProvider(): DomainTemplateProvider;
  getKnowledgeProvider(): DomainKnowledgeProvider;
}

export interface DomainValidator {
  validate(content: any): Promise<ValidationResult>;
  getErrors(content: any): Promise<string[]>;
  getWarnings(content: any): Promise<string[]>;
}

export interface DomainContentTypeProvider {
  getContentTypes(): Promise<ContentType[]>;
  isValidType(type: string): boolean;
  getTypeMetadata(type: string): any;
}

export interface DomainPromptProvider {
  getPrompts(contentType: string, version?: string): Promise<Prompt[]>;
  getPrompt(contentType: string, variables: Record<string, string>): Promise<string>;
  listVersions(contentType: string): Promise<{version: string; releasedAt: Date}[]>;
}

export interface DomainRuleProvider {
  canTransition(content: any, from: string, to: string, user: any): Promise<boolean>;
  getApprovalRequirements(content: any): Promise<{role: string; minWeight: number}[]>;
  getCostFactors(content: any): Promise<{factor: string; baseCost: number}[]>;
  getPublicationRequirements(content: any): Promise<{type: string; required: boolean}[]>;
}

export interface DomainTemplateProvider {
  getTemplates(contentType: string): Promise<any[]>;
  getTemplate(contentType: string, variant?: string): Promise<any>;
  validateTemplate(template: any): Promise<'VALID' | 'INVALID'>;
}

export interface DomainKnowledgeProvider {
  search(query: string, type?: string): Promise<any[]>;
  getVerse(reference: string): Promise<any>;
  getTechnicalTerm(term: string): Promise<any>;
}
```

#### Vertical Installation Process (No Core Modifications)

**Step 1: Create Vertical Package**
```bash
# Create new directory: packages/christian-domain/
# Implement the 7 interfaces
# Export ChristianDomainProvider class
```

**Step 2: Register Vertical (Tenant Configuration)**
```http
POST /tenant/:id/verticals
Authorization: Bearer <admin-jwt>

{
  "name": "christian",
  "displayName": "Christian Content",
  "domainProvider": "ChristianDomainProvider",
  "isActive": true,
  "defaultProject": true
}
```

**Step 3: Create Project with Vertical**
```http
POST /tenant/:id/projects
Authorization: Bearer <admin-jwt>

{
  "name": "Mañanas Bendecidas",
  "vertical": "christian",
  "description": "Contenido de oraciones matutinas",
  "isActive": true
}
```

**Step 4: Core Uses Interface (Automatic)**
When content is created in a project with vertical="christian":
1. Tenant context extracted from JWT
2. Project looked up → project.vertical = "christian"
3. Domain Engine resolves: getProvider("christian") → ChristianDomainProvider
4. All calls route through the interface:
   - Validation → BibleGuard
   - Prompts → ChristianPrompts
   - Rules → ChristianRules
   - Templates → ChristianTemplates
   - Knowledge → Bible knowledge base

**Step 5: Switch Vertical**
- Change project.vertical from "christian" to "automotive"
- All subsequent operations use AutomotiveDomainProvider
- No code changes, no restart, no Core modification

### ADR-003 Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    CONTENT AUTOMATION PLATFORM                  │
│                                                                 │
│  +------------------+    +---------------------+              │
│  |      CORE        |    |   DOMAIN ENGINE     |              │
│  | (Never depends   |    | (7 interfaces only)│              │
│  |  on verticals)  |    +---------------------+              │
│  |                  |           |    |    |    |    |              │
│  |  Auth            |           |    v    v    v    v              │
│  |  Users           |    DomainProvider    DomainValidator│
│  |  Tenants          +-->            +-----+-----+-----+     │
│  |  Projects  <--   |            |           |           │
│  |  vertical=×      |            DomainContentTypeProvider│
│  +--------+----------+            +-----+-----+-----+     │
│          |                              |     |           │
│  Interface calls (runtime)          Interface implementations│
│          |                              |     |           │
│  +--------v----------+              +-----v-----v-----+  │
│  |   Vertical A      |              | Vertical A    │  │
│  |   (Christian)     |              | BibleGuard    │  │
│  +--------+-----------+              +-----+---------+  │
│          |                                   |             │
│          |                                   |             │
│  +--------v-----------+              +-----v---------+  │
│  |   Vertical B      |              | Vertical B    │  │
│  |   (Automotive)    |              | AutomotiveGuard││
│  +--------------------+              +---------------+  │
│                                                                 │
│  Consequence: Core can be deployed once, verticals added anytime │
│  without Core changes, database migrations, or downtime.       │
└─────────────────────────────────────────────────────────────────┘
```

### Compliance with Rules

| Rule | ADR-003 Compliance |
|------|-------------------|
| 1. No circular dependencies | ✓ Interfaces defined in core, implementations in vertical packages |
| 2. No secretos hardcodeados | ✓ Vertical configs come from tenant settings, not code |
| 3. No lógica de dominio en controllers | ✓ Domain Engine provides rules, controllers use interface |
| 4. No acceso directo indiscriminado a tablas de otros módulos | ✓ All access goes through Domain Engine interfaces |
| 5. No publicación sin APPROVED | ✓ Workflow state machine independent of vertical |
| 6. No referencias bíblicas inventadas | ✓ BibleGuard validates biblical accuracy |
| 7. No proveedores externos directamente en el dominio | ✓ AIService abstraction separate from Domain Engine |
| 8. No contenido multimedia sin metadata de licencia | ✓ Media metadata generic, license tracked separately |
| 9. Todo background job debe ser idempotente | ✓ State machine + Domain Engine don't affect idempotency |
| 10. Toda operación crítica debe ser auditable | ✓ Domain Engine operations can be audited via workflow |
| 11. Toda modificación de schema debe utilizar migration | ✓ Vertical additions don't require Core schema changes |
| 12. No destruir datos mediante migrations | ✓ Vertical additions are additive (new interfaces, new tables optional) |
| 13. Todo feature nuevo requiere tests | ✓ Each vertical needs unit/integration/E2E tests |
| 14. Toda API externa debe estar abstraída | ✓ Domain Engine joins AIService abstraction pattern |
| 15. No sobrearquitecturar con microservicios prematuramente | ✓ Modular monolith + vertical plug-ins, not microservices |
| 16. Mantener documentación sincronizada | ✓ This ADR and DOMAIN-ENGINE.md documentation |
| 17. Nunca declarar una funcionalidad terminada sin probarla | ✓ Vertical implementations require tests |

### FASE 0 Success Criteria

- [x] 7 interfaces defined in src/core/interfaces/domain.ts (or equivalent)
- [x] ChristianDomainProvider conceptual implementation created (docs/DOMAIN-ENGINE.md)
- [x] AutomotiveDomainProvider conceptual implementation created (docs/DOMAIN-ENGINE.md)
- [x] Vertical installation process documented (no Core modifications)
- [x] Core vs Domain separation proven (Core agnostic of niche)
- [x] Multi-tenant vertical support conceptualized
- [x] ADR-003 written and documented
- [x] Interface contracts stable for FASE 1 implementation

### Migration Path from FASE 0 to FASE 1

| FASE 0 | FASE 1 |
|--------|--------|
| Interfaces are conceptual/documentation | Interfaces implemented as TypeScript classes |
| Vertical installation documented | Vertical packages published (npm/internal) |
| No database changes for verticals | Prisma migration adds: tenant_verticals, vertical_prompts, vertical_templates tables |
| Interface contracts in ADR | Interface contracts in code + API documentation |
| Manual vertical switching | Automated vertical resolution via project.vertical |
| Conceptual only | Tested vertical switching in E2E |

### ADR-003 Approval

This ADR was accepted during FASE 0 design phase. It establishes the Domain Engine as the mechanism for vertical plug-in architecture without Core domain coupling.

**Accepted by:** Principal Software Architect  
**Date:** FASE 0 design completion  
**Related ADRs:** ADR-001 (Modular Monolith), ADR-002 (Multi-Tenant), ADR-004 (AI Provider Abstraction)  
**Superseded by:** FASE 1 implementation of interfaces (will keep same interface contracts)  
**Status:** Active - FASE 0 design complete, FASE 1 implementation begins