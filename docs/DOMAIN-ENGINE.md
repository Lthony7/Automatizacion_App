# FASE 0: Domain Engine

## Objective

Design the Domain Engine to keep the Core completely agnostic of any niche (Christian, Automotive, Fitness, etc.). The Core works with generic interfaces, and verticals are plugged in as implementations.

## Core vs Domain

### CORE (Never depends on verticals)
- Auth, Users, Tenants, Projects, AI, Media, Audio, Video, Workflow, Scheduler, Publication, Analytics, Costs
- No Bible, Christian, Automotive, or domain-specific logic
- Only generic interfaces and abstractions
- Installing a new vertical **does NOT modify** any core module

### DOMAIN (Plug-in implementations)
- DomainProvider, DomainValidator, DomainContentTypeProvider, DomainPromptProvider, DomainRuleProvider, DomainTemplateProvider, DomainKnowledgeProvider
- ChristianDomainProvider, AutomotiveDomainProvider, etc.
- Vertical-specific logic, prompts, rules, validators, templates

## How to Install a New Vertical (Without Modifying Core)

### Step 1: Create Domain Interfaces Implementation
Create files implementing the 7 interfaces. No core changes required.

### Step 2: Register in Tenant Configuration
Add the vertical to tenant settings. Core auto-discovers via interface.

### Step 3: Assign to Projects/Users
Users/projects reference the vertical by name/code. Domain Engine routes requests.

### Step 4: Core Uses Interfaces
All core modules call through the interface, never concrete vertical classes.

### Interfaces (Conceptual - TypeScript)

```typescript
// DomainProvider - Root interface for all domain behavior
interface DomainProvider {
  getContentTypes(): ContentType[];
  getValidator(): DomainValidator;
  getPromptProvider(): DomainPromptProvider;
  getRuleProvider(): DomainRuleProvider;
  getTemplateProvider(): DomainTemplateProvider;
  getKnowledgeProvider(): DomainKnowledgeProvider;
}

// DomainValidator - Validate content against domain rules
interface DomainValidator {
  validate(content: any): 'VALID' | 'WARNING' | 'INVALID';
  getWarnings(content: any): string[];
  getErrors(content: any): string[];
}

// DomainContentTypeProvider - Define valid content types per vertical
interface DomainContentTypeProvider {
  getContentTypes(): ContentType[];
  getTypeMetadata(type: ContentType): TypeMetadata;
  isValidType(type: string): boolean;
}

// DomainPromptProvider - Versioned prompts associated with tenant/project/vertical
interface DomainPromptProvider {
  getPrompts(type: ContentType, version?: string): Prompt[];
  getPrompt(type: ContentType, variableValues: Record<string, string>): string;
  listVersions(type: ContentType): VersionInfo[];
}

// DomainRuleProvider - Workflow and business rules per vertical
interface DomainRuleProvider {
  canTransition(content: Content, from: State, to: State, user: User): boolean;
  getApprovalRequirements(content: Content): ApprovalRequirement[];
  getCostFactors(content: Content): CostFactor[];
  getPublicationRequirements(content: Content): PublicationRequirement[];
}

// DomainTemplateProvider - Template management per vertical
interface DomainTemplateProvider {
  getTemplates(type: ContentType): Template[];
  getTemplate(type: ContentType, variant?: string): Template;
  listTemplateVariants(type: ContentType, variant: string): string[];
  validateTemplate(template: any): 'VALID' | 'INVALID';
}

// DomainKnowledgeProvider - Domain-specific knowledge base
interface DomainKnowledgeProvider {
  getVerse(reference: string): Verse | null;
  getBiblicalReference(text: string): BiblicalReference | null;
  getTechnicalSpec(term: string): TechnicalSpec | null;
  searchKnowledge(query: string, type: KnowledgeType): KnowledgeEntry[];
}
```

## Christian Domain (Example Implementation)

### BibleGuard
Validates biblical content accuracy:
- Checks verse references are valid
- Validates quotation accuracy
- Ensures theological consistency
- Marks content with biblical confidence score

```typescript
class BibleGuard implements DomainValidator {
  validate(content: any): 'VALID' | 'WARNING' | 'INVALID' {
    // Check for valid biblical references
    // Verify quotes match source
    // Theological consistency checks
    return result;
  }
  
  getWarnings(content: any): string[] {
    // Return warnings about potential issues
    return [];
  }
  
  getErrors(content: any): string[] {
    // Return errors that make content invalid
    return [];
  }
}
```

### ChristianContentTypes
Defines all valid content types for Christian vertical:

```typescript
enum ChristianContentType {
  PRAYER = 'prayer',
  VERSE = 'verse',
  REFLECTION = 'reflection',
  STORY = 'story',
  CHARACTER = 'character',
  PARABLE = 'parable',
  TEACHING = 'teaching',
  CURIOUSITY = 'curiosity',
  TESTIMONY = 'testimony',
  BLESSING = 'blessing'
}
```

### ChristianRules
Workflow rules specific to Christian content:

```typescript
class ChristianRules implements DomainRuleProvider {
  canTransition(content: Content, from: State, to: State, user: User): boolean {
    // Christian-specific transition rules
    // e.g., prayer content requires extra validation
    return true/false;
  }
  
  getApprovalRequirements(content: Content): ApprovalRequirement[] {
    return [
      { role: 'pastor', minWeight: 0.8 },
      { role: 'editor', minWeight: 0.6 }
    ];
  }
  
  getCostFactors(content: Content): CostFactor[] {
    return [
      { factor: 'ai_generation', baseCost: 0.02 },
      { factor: 'tts_generation', baseCost: 0.01 }
    ];
  }
  
  getPublicationRequirements(content: Content): PublicationRequirement[] {
    return [
      { type: 'bible_verse_must_be_accurate', required: true },
      { type: 'prayer_must_have_cta', required: true }
    ];
  }
}
```

### ChristianPrompts
Versioned prompts associated with tenant/project/vertical:

```
Prompts stored in DB with metadata:
- content_type: prayer/verse/story/etc.
- version: "1.0.0", "1.1.0", etc.
- tenant_id: optional
- project_id: optional  
- vertical: "christian"
- title: prompt title
- prompt_template: the actual prompt text
- variables: variable placeholders {theme}, {duration}, etc.
- is_default: true for default prompts
```

Christian prompts example:
```
Title: "Morning Prayer Prompt"
Prompt: "Genera una oración matutina para {día_de_semana} con tema {tema_principal}. Incluye alabanza, petición y agradecimiento. Mantén un tono {tono} y extensión {duracion_minutos} minutos."
Variables: {día_de_semana, tema_principal, tono, duracion_minutos}
```

### ChristianTemplates
Template system for Christian content:

```
Template types:
- prayer_template: layout for prayer videos (title, prayer text, verse background)
- verse_template: layout for verse videos (reference, text, decorative elements)
- story_template: layout for biblical story videos (characters, scenes, narrative)

Each template has:
- Layout configuration (9:16 vertical layout)
- Font choices and sizes appropriate for religious content
- Color schemes (traditional Christian colors, appropriate imagery)
- Animation transitions
- Placeholder positions for content data
- Branding options (cross, dove, etc. - configurable per congregation)
```

### ChristianDomainProvider
Combines all Christian interfaces:

```typescript
class ChristianDomainProvider implements DomainProvider {
  constructor() {
    this.validator = new BibleGuard();
    this.contentTypes = new ChristianContentTypeProvider();
    this.promptProvider = new ChristianPromptProvider();
    this.ruleProvider = new ChristianRules();
    this.templateProvider = new ChristianTemplateProvider();
    this.knowledgeProvider = new ChristianKnowledgeProvider();
  }
  
  getContentTypes(): ContentType[] { return this.contentTypes.getContentTypes(); }
  getValidator(): DomainValidator { return this.validator; }
  getPromptProvider(): DomainPromptProvider { return this.promptProvider; }
  getRuleProvider(): DomainRuleProvider { return this.ruleProvider; }
  getTemplateProvider(): DomainTemplateProvider { return this.templateProvider; }
  getKnowledgeProvider(): DomainKnowledgeProvider { return this.knowledgeProvider; }
}
```

## Automotive Domain (Example - Minimal)

### AutomotiveGuard
Interface only, demonstration of concept:

```typescript
class AutomotiveGuard implements DomainValidator {
  validate(content: any): 'VALID' | 'WARNING' | 'INVALID' {
    // Automotive-specific validation logic
    // Check for valid maintenance procedures
    // Verify technical accuracy
    return 'VALID'; // Simplified for demonstration
  }
  
  getWarnings(content: any): string[] {
    return [];
  }
  
  getErrors(content: any): string[] {
    return [];
  }
}
```

### AutomotiveContentTypes

```typescript
enum AutomotiveContentType {
  MAINTENANCE = 'maintenance',
  DIAGNOSIS = 'diagnosis',
  TIPS = 'tips',
  FAILURES = 'failures',
  ENGINE = 'engine',
  OIL = 'oil',
  BRAKES = 'brakes',
  TIRES = 'tires',
  ELECTRICITY = 'electricidad',
  RECOMMENDATION = 'recomendacion'
}
```

### AutomotiveRules
```typescript
class AutomotiveRules implements DomainRuleProvider {
  canTransition(content: Content, from: State, to: State, user: User): boolean {
    // Automotive transition rules
    return true; // Simplified
  }
  
  getApprovalRequirements(content: Content): ApprovalRequirement[] {
    return [{ role: 'mechanic', minWeight: 0.7 }];
  }
  
  getCostFactors(content: Content): CostFactor[] {
    return [{ factor: 'ai_generation', baseCost: 0.03 }];
  }
  
  getPublicationRequirements(content: Content): PublicationRequirement[] {
    return [{ type: 'technical_accuracy', required: true }];
  }
}
```

### AutomotivePrompts
Versioned prompts for automotive content (similar structure to Christian prompts but with automotive themes):

```
Title: "Consejo de Mantenimiento Prompt"
Prompt: "Genera un consejo de mantenimiento para {tipo_de_vehiculo} con problema {problema}. Incluye causa posible, solución recomendada y prevención. Mantén un tono {tono} y nivel de experiencia {nivel_experiencia}."
Variables: {tipo_de_vehiculo, problema, tono, nivel_experiencia}
```

### AutomotiveDomainProvider
Combines all automotive interfaces (minimal implementation for demonstration).

## Vertical Installation - No Core Modifications Required

### What Does NOT Change When Installing a New Vertical

| Module | Changes Required |
|--------|-----------------|
| **Auth** | None - authentication/authorization is vertical-agnostic |
| **Users** | None - users can belong to any vertical project |
| **Tenants** | None - vertical is tenant configuration, not schema change |
| **Projects** | None - projects have vertical field (nullable), no schema change |
| **AI** | None - AIService abstraction handles provider switching |
| **Media** | None - media metadata is generic (source, author, license) |
| **Audio** | None - TTS abstraction, voice selection is configurable |
| **Video** | None - Video Engine receives template, not vertical-specific logic |
| **Workflow** | None - state machine is generic, rules come from DomainRuleProvider |
| **Scheduler** | None - scheduling is content-state based, not vertical specific |
| **Publication** | None - Publisher abstraction, content must be APPROVED regardless of vertical |
| **Analytics** | None - metrics are generic (views, likes, comments, etc.) |
| **Costs** | None - cost categories are generic (ai, tts, storage, rendering, api_usage) |

### What DOES Change (Plug-in Only)

1. **New files** implementing the 7 interfaces
2. **Tenant configuration** - register the vertical
3. **Project assignment** - assign vertical to projects
4. **User onboarding** - users select/are assigned vertical projects
5. **Database seed data** - prompts, templates, rules for the vertical
6. **Optional: UI strings** - vertical-specific labels and descriptions

### Installation Commands (Conceptual)

```bash
# 1. Create vertical implementation package
npm install content-automation-domain-automotive

# 2. Register in tenant settings (admin UI or API)
POST /tenant/:id/verticals
{
  "name": "automotive",
  "displayName": "Automotive",
  "domainProvider": "AutomotiveDomainProvider",
  "enabled": true
}

# 3. Create project with vertical
POST /tenant/:id/projects
{
  "name": "Auto Tips",
  "vertical": "automotive",
  "description": "Consejos de mantenimiento automotriz"
}

# 4. Start using the vertical
# - Content creation uses automotive content types
# - Prompts are loaded from automotive domain
# - Validation uses automotive guard
# - Templates are automotive templates
```

## Multi-Tenant Considerations

### Per-Tenant Vertical Installation
- Each tenant can install different verticals
- Tenant A: Christian + Automotive
- Tenant B: Only Fitness
- Tenant C: Only Christian

### Vertical Isolation
- Prompts, templates, rules are scoped per tenant
- Same vertical can have different prompts per tenant
- Tenant-specific knowledge base entries

### Cross-Tenant Vertical Sharing
- Some verticals can be marked as "global" (available to all tenants)
- Global verticals have shared prompt/template repositories
- Per-tenant overrides possible

## FASE 0 Checklist

### Completed
- [x] Domain Engine conceptual interfaces (7 interfaces defined)
- [x] Christian domain implementation (BibleGuard, ContentTypes, Rules, Prompts, Templates, Knowledge)
- [x] Automotive domain implementation (Guard, ContentTypes, Rules, Prompts - minimal)
- [x] Vertical installation process (no core modifications)
- [x] Multi-tenant vertical support
- [x] Core vs Domain separation documented
- [x] ADR-003: Domain Engine architectural decision

### Ready for FASE 1
- [ ] Implement TypeScript interfaces in src/core/interfaces/domain.ts
- [ ] Create DomainProvider base implementations
- [ ] Integrate Domain Engine into NestJS modules
- [ ] Create database migrations for prompt/template storage
- [ ] Build Christian vertical full implementation
- [ ] Build Automotive vertical complete implementation (beyond minimal)
- [ ] Test vertical switching in multi-tenant setup