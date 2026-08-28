# Architectural Decisions (ADRs & Additional Decisions)

## ADR-001: Modular Monolith
- Status: Accepted
- Decision: Start as modular monolith, extract microservices later when scaling requires it
- Consequences: Simpler ops initially, future extraction path

## ADR-002: Multi-Tenant Architecture
- Status: Accepted
- Decision: Row-level isolation with tenant_id on relevant tables, configurable schema-based later
- Consequences: All queries must include tenant_context, prevents IDOR

## ADR-003: Domain Engine
- Status: Accepted
- Decision: Core interfaces (DomainProvider, DomainValidator, DomainContentType, DomainPromptProvider, DomainRuleProvider)
- Consequences: Vertical implementations plug in later, no core domain coupling

## ADR-004: AI Provider Abstraction
- Status: Accepted
- Decision: AIService abstraction, initial provider: Gemini, prepared for Groq/OpenAI/Local
- Consequences: Provider swap without business logic changes, unified cost tracking

## ADR-005: Video Engine
- Status: Accepted
- Decision: FFmpeg-based, 1080x1920 30fps H264/AAC MP4, independent of vertical
- Consequences: Input contract (content, template, media, audio, subtitles), output MP4

## ADR-006: Queue Architecture
- Status: Accepted
- Decision: Redis + BullMQ, all jobs idempotent, retry with exponential backoff
- Consequences: Reliable background processing, DLQ for failures

## ADR-007: Human Approval
- Status: Accepted
- Decision: State machine enforces: APPROVED→SCHEDULED→PUBLISHING→PUBLISHED
- Consequences: No skipping, audit trail, human-in-the-loop quality gate

## ADR-008: Social Publisher Abstraction
- Status: Accepted
- Decision: Publisher interface, implementations: YouTube, Instagram, Facebook
- Consequence: Content must be APPROVED before publication

## ADR-009: Object Storage
- Status: Accepted
- Decision: S3-compatible, each asset registers metadata (source, author, license, etc.)
- Consequences: Licensed material only, commercial use tracking, attribution enforcement

## Additional Decisions

### DD-001: State Machine Critical Rules
- Only APPROVED can enter SCHEDULED
- Only SCHEDULED can enter PUBLISHING
- Only PUBLISHING can enter PUBLISHED
- No external module can skip the machine
- Enforced by Workflow service, validated on every transition

### DD-002: No Hardcoded Secrets
- API keys never in plain text
- Hash with bcrypt/argon2
- Store only hash + prefix + permissions + status + timestamps

### DD-003: Prompt Versioning
- Prompts stored in DB with: tenant, project, vertical, content_type, version
- Never hardcoded in services
- Resolution order: project → tenant → default

### DD-004: TTS Abstraction
- TTSProvider interface (not provider SDK directly)
- Initial: Google TTS, prepared: ElevenLabs, Local TTS
- Never acoplar dominio a proveedor específico

### DD-005: Video Format Standard
- Initial: 1080x1920, 30fps, H264, AAC, MP4
- Video Engine independent of vertical
- Receives: content, template, media, audio, subtitles
- Produces: video

### DD-006: Multi-Tenant Hierarchy
- Tenant > Projects > Vertical > Content > Templates > Social Accounts > Analytics
- Each level belongs to tenant above
- Queries respect ownership at each level

### DD-007: API Key Lifecycle
- hash (bcrypt/argon2, never plain text)
- prefix (for identification/logging)
- permissions (granted codes)
- status (active/revoked/expired)
- last_used_at (tracking)
- revoked_at (when revoked)
- created_at, last_rotated_at

### DD-008: Content States Criticality
- DRAFT: Initial creation, no AI yet
- QUEUED: Waiting in queue for processing
- GENERATING: AI/TTS/Rendering in progress
- VALIDATED: Passed domain validation
- APPROVED: Human approval granted
- SCHEDULED: Queued for publication (state rule: APPROVED→SCHEDULED)
- PUBLISHING: API call to platform in progress
- PUBLISHED: Successfully on platform
- FAILED: Operation failed (max retries exceeded)
- CANCELLED: Manually cancelled

### DD-009: Cost Tracking Granularity
- cost_registries table tracks every cost item
- Categories: ai, tts, storage, rendering, api_usage
- Aggregates: cost_per_video, daily_cost, monthly_cost
- Per-tenant, per-project, per-vertical breakdowns

### DD-010: Observability Stack
- Structured logging (JSON format, winston/pino)
- Health checks (/health endpoint)
- Metrics (Prometheus format, /metrics endpoint)
- Sentry-ready (error tracking)
- CSP-ready configuration

### DD-011: Testing Strategy
- Every module: unit + integration tests
- System: E2E tests with Playwright
- Minimum 80% coverage per module
- Critical flows have E2E coverage
- Special focus: tenant isolation, RBAC, workflow, AI abstraction, video rendering, publication

### DD-012: No Circular Dependencies
- Core never depends on vertical domains
- Providers depend on abstractions, not concretions
- Modules communicate via well-defined interfaces
- Import order respecting dependency graph

### DD-013: Input Validation
- Zod schemas for all API inputs
- Whitelist validation for enum fields
- Prisma prevents SQL injection (parameterized)
- XSS prevention on user-generated content display

### DD-014: Audit Logging
- All critical operations logged
- Fields: user_id, tenant_id, action, resource_id, timestamp, ip_address
- Immutable append-only log
- Super-admin actions also audited

### DD-015: Migration Strategy
- All schema modifications via Prisma migration
- Never destructive (DROP tables, delete data in migrations)
- Rolling deployments with data preservation
- Seed data for new fields optional/conditional

### DD-016: Feature Completion
- No functionality declared complete without tests
- Feature requires: unit tests, integration tests, documentation
- ADR written for significant architectural decisions
- Code review required for all changes

### DD-017: Error Handling Philosophy
- Errors logged with full context (tenant, content, user)
- User-facing messages generic (no stack traces)
- Internal logging has full detail
- Retries for transient failures, manual for permanent
- Circuit breakers for external API calls

### DD-018: Graceful Degradation
- If AI provider fails, use fallback or show error state
- If TTS fails, use fallback voice or text-only output
- If publication fails, retry or mark as PUBLISH_FAILED
- If video rendering fails, mark as FAILED, manual intervention
- Never crash entire system on single failure

### DD-019: Retry & Idempotency
- All background jobs idempotent (same input = same output)
- Retry with exponential backoff (1min, 5min, 15min)
- Max 3 retries per job type
- Dead letter queue for permanently failed jobs
- Job data includes: content_id, tenant_id, project_id, parameters

### DD-020: CSP (Content Security Policy) Ready
- Configuration prepared for CSP implementation
- Nonce-based for inline scripts where needed
- Report-URI for violation monitoring
- Ready for production deployment when ready