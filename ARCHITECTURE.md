# Architecture Decision Record (ADRs)

> **Full ADR details:** See `docs/DECISIONS.md` for detailed ADRs with context, decision, and consequences.
> This file is a summary index. The canonical source of truth is `docs/DECISIONS.md`.

## ADR-001: Modular Monolith

**Status**: Accepted

**Context**: Starting as a modular monolith to minimize initial complexity and overhead.

**Decision**: The system begins as a modular monolith with well-defined boundaries between modules. Heavy modules (Video Engine, AI Engine, Publication Engine) can be extracted as separate microservices later if growth requires it.

**Consequences**:
- Simpler deployment and operation initially
- Easier refactoring than distributed microservices
- Future extraction possible when scaling needs justify it

## ADR-002: Multi-Tenant Architecture

**Status**: Accepted

**Context**: SaaS platform requiring tenant isolation.

**Decision**: Architecture prepared for Tenant > Project > User hierarchy. All queries respect tenant/project ownership. Cross-tenant access is prevented at the database and application level.

**Consequences**:
- Tenant IDs are required on all relevant queries
- Row-level security policies in PostgreSQL
- Separate schemas or data isolation strategies per tenant

## ADR-003: Domain Engine

**Status**: Accepted

**Context**: Core must never depend on specific vertical domains (Christian, Automotive, etc.).

**Decision**: Create a Domain Engine with generic interfaces (DomainProvider, DomainValidator, DomainContentType, DomainPromptProvider, DomainRuleProvider). Vertical-specific implementations are plugged in later.

**Consequences**:
- Core remains domain-agnostic
- Verticals implement their own providers
- No circular dependencies

## ADR-004: AI Provider Abstraction

**Status**: Accepted

**Context**: Avoid vendor lock-in for AI services.

**Decision**: Create AIService abstraction. All modules use AIService, not direct SDK calls (Gemini SDK, OpenAI SDK, Groq SDK). Initial provider: Gemini. Prepared for: Groq, OpenAI, and others.

**Consequences**:
- AI provider can be swapped without code changes to business logic
- Unified error handling and response formatting
- API key management through abstraction layer

## ADR-005: Video Engine

**Status**: Accepted

**Context**: Video generation is a heavy operation that should be independent.

**Decision**: Video Engine receives content, template, media, audio, subtitles and produces MP4 video (1080x1920, 30fps, H264, AAC). Completely independent of vertical.

**Consequences**:
- Input/output contract defined
- Can be scaled independently
- FFmpeg integration for rendering
- Template-based video generation

## ADR-006: Queue Architecture

**Status**: Accepted

**Context**: Background job processing for AI, rendering, publication.

**Decision**: Redis + BullMQ for job queueing. All background jobs are idempotent. Retry logic with exponential backoff.

**Consequences**:
- Reliable job processing
- Dead letter queue for failed jobs
- Job progress tracking

## ADR-007: Human Approval

**Status**: Accepted

**Context**: Critical state machine rule: only APPROVED can enter SCHEDULED.

**Decision**: Workflow enforces state transitions. No external module can skip the machine of states. Human-in-the-loop for approval/rejection.

**Consequences**:
- Guaranteed content quality
- Audit trail of approval decisions
- Prevention of premature publishing

## ADR-008: Social Publisher Abstraction

**Status**: Accepted

**Context**: Multiple social platforms with different APIs.

**Decision**: Create Publisher abstraction (YouTubePublisher, InstagramPublisher, FacebookPublisher). Content must be APPROVED before publication.

**Consequences**:
- Platform-specific logic isolated
- Consistent publication interface
- Prevention of unapproved content publishing

## ADR-009: Object Storage

**Status**: Accepted

**Context**: Video, audio, and image assets need storage.

**Decision**: S3-compatible object storage. Each asset registers: source, author, license, license_url, commercial_use, attribution_required.

**Consequences**:
- No unlicensed material used
- Commercial use tracking
- Attribution requirements enforced
- Cost tracking per asset

# Core Module Structure

- AUTH: JWT, refresh tokens, RBAC
- USERS: Profile management, authentication
- TENANTS: Tenant creation, settings, domain management
- PROJECTS: Project organization within tenants
- ROLES & PERMISSIONS: RBAC system
- API KEYS: Hash-based storage with permissions and rotation
- WORKFLOW: State machine orchestration
- AUDIT: Complete audit logging

# Module Structure

See each module's documentation for detailed entity-relationship and API specifications.