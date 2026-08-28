# Domain Engine

## Purpose

The Domain Engine ensures the Core never depends on specific vertical domains (Christian, Automotive, Fitness, etc.). It provides generic interfaces that verticals implement.

## Core Interfaces

### DomainProvider
Generic interface for domain-specific behavior:
- getContentTypes(): ContentType[]
- getPrompts(contentType: ContentType): PromptConfig
- getRules(contentType: ContentType): RuleConfig
- validate(content: any): ValidationResult

### DomainValidator
Content validation at domain level:
- validateDomainSpecificRules(content): WARNING/VALID/INVALID
- checkBiblicalAccuracy (for Christian): BibleGuard
- checkTechnicalAccuracy (for Automotive): AutomotiveGuard
- Generic validation: schema, required fields, format

### DomainContentType
Enumeration of content types per vertical:
- christian: prayer, verse, reflection, story, character, parable, teaching, curiosity
- automotive: maintenance, diagnosis, tips, failures, engine, oil, brakes, tires, electricity
- (other verticals add their own types)

### DomainPromptProvider
Prompts versioned and associated with:
- tenant
- project
- vertical
- content_type
- version

Prompts are NOT hardcoded in services. They are stored in database and loaded at runtime.

### DomainRuleProvider
Domain-specific rules for:
- Workflow state transitions
- Validation rules
- Publication requirements
- Cost calculations

## Vertical Implementations (Plug-in Style)

### Christian Domain
- **ChristianDomainProvider**: Implements DomainProvider
- **BibleGuard**: Validates biblical references, quotes, accuracy
- **ChristianContentTypes**: Enum of Christian content types
- **ChristianPrompts**: Versioned prompts for prayer, verse, story, etc.
- **ChristianTemplates**: Templates for video, audio, text output
- **ChristianRules**: Workflow rules, validation rules

### Automotive Domain
- **Only interfaces, seed/demo configuration and examples** (per requirements)
- **AutomotiveGuard**: Interface only, not full implementation
- **AutomotiveContentTypes**: Interface only
- **AutomotivePrompts**: Interface only, seed data

### Adding a New Vertical
1. Create DomainProvider implementation
2. Define ContentTypes enum
3. Version and store prompts in DB
4. Create RuleProvider
5. Create Validator (BibleGuard, AutomotiveGuard, etc.)
6. Register in tenant configuration
7. Assign to projects/users

## Prompt Versioning

Prompts stored with metadata:
- id (UUID, PK)
- content_type (Enum)
- version (String, e.g., "1.0.0")
- tenant_id (UUID, FK)
- project_id (UUID, FK, nullable)
- vertical (Enum, nullable)
- title (String)
- prompt_template (Text)
- variables (JSON - variable placeholders)
- is_default (Boolean)
- created_at, updated_at

Prompt resolution order:
1. Project-specific prompt (if project configured)
2. Tenant-specific prompt (if tenant configured)
3. Default prompt (vertical-specific)

## Rule Evaluation

Rules evaluated during workflow:
- State transition rules (only APPROVED -> SCHEDULED, etc.)
- Validation rules before each state
- Publication eligibility rules
- Cost calculation rules
- Vertical-specific constraints

All rules are configured per vertical, not hardcoded in core.