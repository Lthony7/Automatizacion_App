# Testing Strategy

## Testing Philosophy

Every module must have:
- Unit tests
- Integration tests
- E2E tests (system-level)

Special focus on:
- Tenant isolation
- RBAC permissions
- API Keys management
- Workflow state machine
- Domain validation
- AI provider abstraction
- Video rendering
- Publication
- Idempotency
- Retries

## Test Structure

### 1. Unit Tests

Each module has unit tests covering:
- Service logic (without database)
- Repository/DAO methods (with mock DB)
- Interceptor/guard functionality
- Validator implementations
- Provider abstractions (mocked)

**Example unit test per module:**
- auth.module: JWT generation/validation, token refresh
- users.module: CRUD, password hashing, role assignment
- tenants.module: CRUD, plan management, settings
- content.module: state transitions, validation, cost calculation
- domain-engine.module: provider switching, prompt resolution

### 2. Integration Tests

Test module interactions:
- End-to-end workflow (content creation → approval → publication)
- Database transactions and rollbacks
- Queue job processing (BullMQ integration)
- External service mocking (AI providers, social APIs)
- State machine transitions
- Multi-tenant isolation in queries

**Example integration test scenarios:**
- Create content → AI generate → validate → approve → publish
- API Key creation → use in authenticated request → rotation
- State transition validation at each step
- Tenant A cannot access tenant B's content

### 3. E2E Tests (Playwright)

Full system tests:
- User registration → login → content creation → workflow → publication
- Tenant onboarding and isolation
- RBAC enforcement (user roles)
- API Key flow (create, use, rotate, revoke)
- Complete content pipeline from idea to published
- Video rendering end-to-end (with mocked FFmpeg)
- Publication to mock social accounts

**E2E Test Suites:**
- `e2e/auth.auth-spec.ts` - authentication flow
- `e2e/content.content-spec.ts` - content lifecycle
- `e2e/tenant.tenant-spec.ts` - tenant isolation
- `e2e/publisher.publisher-spec.ts` - social publication
- `e2e/workflow.workflow-spec.ts` - state machine

## Module-Specific Testing

### AUTH Module
- [ ] JWT access token generation and validation
- [ ] JWT refresh token rotation
- [ ] Password hashing (bcrypt/argon2)
- [ ] RBAC permission checks
- [ ] API Key creation with permissions
- [ ] API Key hash verification
- [ ] Rate limiting per tenant/key

### USERS Module
- [ ] User CRUD operations
- [ ] Email verification flow
- [ ] Profile update validation
- [ ] Role assignment and revocation
- [ ] Last login tracking

### TENANTS Module
- [ ] Tenant creation with plan
- [ ] Tenant switching/isolations
- [ ] Plan upgrade/downgrade
- [ ] Tenant settings management
- [ ] Super-admin cross-tenant operations (audited)

### CONTENT Module
- [ ] Content creation from draft
- [ ] State machine transitions (all rules)
- [ ] Domain validation (Christian/Automotive guards)
- [ ] AI provider integration (mocked)
- [ ] Cost calculation per content
- [ ] Approval workflow
- [ ] Rejection and retry flow

### DOMAIN ENGINE Module
- [ ] DomainProvider interface implementation
- [ ] Prompt versioning and resolution
- [ ] Rule evaluation per vertical
- [ ] Validator switching (BibleGuard, AutomotiveGuard)
- [ ] Content type detection
- [ ] Prompt A/B testing

### AI MODULE
- [ ] AIService abstraction interface
- [ ] Gemini provider (mocked)
- [ ] OpenAI provider (mocked)
- [ ] Groq provider (mocked)
- [ ] Provider failover logic
- [ ] Cost calculation from token usage
- [ ] Prompt resolution (tenant/project/vertical)

### VIDEO MODULE
- [ ] Video render job queue processing
- [ ] FFmpeg command generation
- [ ] Idempotent render execution
- [ ] Error handling and retries
- [ ] Subtitle integration
- [ ] Template application

### PUBLICATION Module
- [ ] Publisher abstraction (YouTube, Instagram, Facebook)
- [ ] API Key management for platforms
- [ ] Publication state machine
- [ ] Failed retry logic
- [ ] Analytics initialization post-publication
- [ ] Multi-tenant publication isolation

### QUEUE MODULE (BullMQ)
- [ ] Job creation and processing
- [ ] Retry logic with exponential backoff
- [ ] Dead letter queue handling
- [ ] Job progress tracking
- [ ] Idempotency per job type
- [ ] Priority scheduling

### WORKFLOW Module
- [ ] State transition validation
- [ ] Rule engine evaluation
- [ ] Event emission on transitions
- [ ] Audit log creation
- [ ] Manual intervention flows

### COST MANAGEMENT Module
- [ ] Cost registry creation
- [ ] Daily/ monthly aggregation
- [ ] Budget alert triggers
- [ ] Cost report generation
- [ ] Budget override auditing

## Test Data & Factories

### Test Factories (per module)
- `createUser()` - default user with role
- `createTenant()` - default tenant with plan
- `createContent()` - content in DRAFT state
- `createApiKey()` - key with specific permissions
- `createPublisher()` - configured publisher for platform

### Factory Dependencies
- Factories can override defaults
- Tenant-aware factories (create within tenant context)
- Role-based factory configurations
- State-aware content factories

## CI/CD Integration

### GitHub Actions (or similar)
- Unit tests on every PR
- Integration tests on merge to develop
- E2E tests on merge to main
- Coverage threshold: 80% minimum per module
- Lint and typecheck on every commit

### Test Commands
```bash
# Unit tests
npm run test:unit

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e

# All tests
npm run test

# Lint
npm run lint

# Typecheck
npm run typecheck
```

## Special Testing Areas

### Tenant Isolation Tests
- Create content as tenant A, verify tenant B cannot see it
- API Key from tenant A works only for tenant A
- Queries always include tenant_id filter
- Edge cases: null tenant_id, super-admin bypass (audited)

### RBAC Tests
- Editor can create content but not approve
- Admin can approve and publish
- Viewer can only read
- Permission denial returns 403
- Role inheritance (if any)

### API Key Tests
- Hash verification (never plain text)
- Permission-based access control
- Rotation without service interruption
- Revocation immediate effect
- Last_used_at tracking

### Workflow Tests
- ALL state transitions validated
- Only APPROVED -> SCHEDULED allowed
- Only SCHEDULED -> PUBLISHING allowed
- Only PUBLISHING -> PUBLISHED allowed
- Illegal transitions blocked + audited

### AI Provider Tests
- Provider abstraction interface consistency
- Mock provider returns consistent format
- Failover to alternative provider
- Cost tracking per provider
- Prompt versioning resolution

### Video Rendering Tests
- FFmpeg command generation correctness
- Input validation before render
- Idempotent execution (same input = same output)
- Error types and handling
- Subtitle integration

### Publication Tests
- APPROVED check before publication
- Publisher selection per platform
- Retry on transient failures
- Analytics initialization
- Multi-tenant isolation

## Coverage Requirements

### Minimum Thresholds
- Unit tests: 80% line coverage per module
- Integration tests: critical paths covered
- E2E tests: happy path + failure paths for critical flows

### Critical Flows Must Have E2E Coverage
1. Authentication flow (register → login → JWT)
2. Content creation → approval → publication
3. Tenant isolation (cross-tenant access denial)
4. API Key management (create → use → rotate → revoke)
5. State machine transitions (all legal + illegal)
6. Publication with APPROVED check enforcement

### Bug-Prevention Tests
- Tests for edge cases discovered in development
- Regression tests when bugs fixed
- Property-based testing for state machine invariants
- Fuzz testing for API inputs

## Testing Best Practices

1. **Arrange-Act-Assert pattern** in all tests
2. **Test data cleanup** (database rollback after each test)
3. **Mock external services** (AI, social APIs, FFmpeg)
4. **Use test containers** for database in CI
5. **Parallel test execution** where possible
6. **Test isolation** - no test should depend on another's state
7. **Descriptive test names** (test should read like spec)
8. **Property-based testing** for invariants (workflow rules, tenant isolation)
9. **Performance tests** for queue processing, large content volumes
10. **Accessibility tests** if UI components included