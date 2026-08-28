# Workflow & State Machine

## Critical State Rules

**RULE**: Only APPROVED can enter SCHEDULED.
**RULE**: Only SCHEDULED can enter PUBLISHING.
**RULE**: Only PUBLISHING can enter PUBLISHED.
**RULE**: No external module can skip the state machine.

## Complete State Machine

```
DRAFT
   ↓ (create/generate)
QUEUED
   ↓ (workflow start)
GENERATING
   ↓ (AI generation)
GENERATED
   ↓ (validation)
VALIDATING
   ↓ (domain validation)
VALIDATED
   ↓ (audio generation)
AUDIO_GENERATING
   ↓ (audio done)
AUDIO_GENERATED
   ↓ (video rendering)
RENDERING
   ↓ (render complete)
RENDERED
   ↓ (AI review)
AI_REVIEW
   ↓ (human approval)
PENDING_APPROVAL
   ↓ (approve/reject)
     ├── EDITING (if changes needed)
     │    ↓
     │    → REJECTED
     │    → PENDING_APPROVAL (retry)
     └── ↓ (approve)
        APPROVED
           ↓ (state rule: only APPROVED -> SCHEDULED)
          SCHEDULED
             ↓ (state rule: only SCHEDULED -> PUBLISHING)
            PUBLISHING
               ↓ (state rule: only PUBLISHING -> PUBLISHED)
              PUBLISHED
                 ↓ (final state)
```

### Rejected Flow
```
REJECTED
   ↓ (user fixes content)
PENDING_APPROVAL
   ↓ (approve)
APPROVED (continue flow)
```

### Failed Flow
```
FAILED (at any state)
   ↓ (manual intervention)
   → CANCELLED
   → RETRY (transition back to appropriate state)
```

### Cancelled Flow
```
CANCELLED
   ↓ (final state, no recovery)
```

## State Transitions Matrix

| From \ To | DRAFT | QUEUED | GENERATING | GENERATED | VALIDATING | VALIDATED | AUDIO_GENERATING | AUDIO_GENERATED | RENDERING | RENDERED | AI_REVIEW | PENDING_APPROVAL | EDITING | REJECTED | APPROVED | SCHEDULED | PUBLISHING | PUBLISHED | FAILED | CANCELLED |
|-----------|-------|--------|------------|-----------|------------|-----------|-----------------|-----------------|-----------|----------|-----------|------------------|---------|----------|----------|-----------|------------|-----------|--------|-----------|
| DRAFT     |  -    |   ✓   |      |      |      |      |      |      |      |      |      |      |      |      |      |      |      |      |      |      |      |
| QUEUED    |   ✓   |  -    |      |      |      |      |      |      |      |      |      |      |      |      |      |      |      |      |      |      |      |
| GENERATING|      |   ✓   |  -    |      |      |      |      |      |      |      |      |      |      |      |      |      |      |      |      |      |      |
| GENERATED |      |      |   ✓   |  -    |      |      |      |      |      |      |      |      |      |      |      |      |      |      |      |      |      |
| VALIDATING|      |      |      |   ✓   |  -    |      |      |      |      |      |      |      |      |      |      |      |      |      |      |      |      |
| VALIDATED |      |      |      |      |   ✓   |  -    |      |      |      |      |      |      |      |      |      |      |      |      |      |      |      |
| AUDIO_GENERATING| |      |      |      |      |      |   ✓   |      |      |      |      |      |      |      |      |      |      |      |      |      |      |
| AUDIO_GENERATED| |      |      |      |      |      |      |   ✓   |      |      |      |      |      |      |      |      |      |      |      |      |      |
| RENDERING |      |      |      |      |      |      |      |      |   ✓   |      |      |      |      |      |      |      |      |      |      |      |      |
| RENDERED  |      |      |      |      |      |      |      |      |      |   ✓   |      |      |      |      |      |      |      |      |      |      |      |
| AI_REVIEW |      |      |      |      |      |      |      |      |      |      |   ✓   |      |      |      |      |      |      |      |      |      |      |
| PENDING_APPROVAL| |      |      |      |      |      |      |      |      |      |      |   ✓   |      |      |      |      |      |      |      |      |      |
| EDITING   |      |      |      |      |      |      |      |      |      |      |      |      |   ✓   |      |      |      |      |      |      |      |      |
| REJECTED  |   ✓   |      |      |      |      |      |      |      |      |      |      |      |      |   ✓   |      |      |      |      |      |      |      |
| APPROVED  |      |      |      |      |      |      |      |      |      |      |      |      |      |      |      |   ✓   |      |      |      |      |      |
| SCHEDULED |      |      |      |      |      |      |      |      |      |      |      |      |      |      |      |      |   ✓   |      |      |      |      |
| PUBLISHING|      |      |      |      |      |      |      |      |      |      |      |      |      |      |      |      |      |   ✓   |      |      |      |
| PUBLISHED |      |      |      |      |      |      |      |      |      |      |      |      |      |      |      |      |      |      |   -    |      |      |
| FAILED    |   ✓   |   ✓   |   ✓   |   ✓   |   ✓   |   ✓   |   ✓   |   ✓   |   ✓   |   ✓   |   ✓   |   ✓   |   ✓   |   ✓   |   ✓   |   ✓   |   ✓   |   -    |   -    |
| CANCELLED |   ✓   |   ✓   |   ✓   |   ✓   |   ✓   |   ✓   |   ✓   |   ✓   |   ✓   |   ✓   |   ✓   |   ✓   |   ✓   |   ✓   |   ✓   |   ✓   |   ✓   |   ✓   |   -    |   -    |
```

✓ = allowed transition
- = not allowed (terminal or invalid)

## Transition Triggers

### Automatic Transitions (system-driven)
- Content created → DRAFT (initial state)
- Job completion → next state (GENERATING→GENERATED, etc.)
- Validation passed → VALIDATED
- Audio generated → AUDIO_GENERATED
- Video rendered → RENDERED

### Manual/Human Triggers
- Approve content → PENDING_APPROVAL → APPROVED
- Reject content → REJECTED → (user edits) → PENDING_APPROVAL
- Cancel content → CANCELLED from any state
- Retry failed job → transition back to appropriate state

### State Rule Enforcement
- Transitions checked by workflow service
- Domain engine validates vertical-specific rules
- Audit log entry for every transition
- Attempted illegal transition → FAILED state + alert

## Workflow Service (NestJS)

### Responsibilities
1. Validate transition requests against state machine
2. Execute transition and update content state
3. Trigger next job in queue (AI, TTS, Render, Publish)
4. Emit events for other modules to react
5. Audit log every state change

### Transition Validation
```typescript
async canTransition(contentId: string, toState: State, user: User): Promise<boolean> {
  const content = await this.contentService.findOne(contentId);
  
  // Rule: only APPROVED -> SCHEDULED
  if (content.state === APPROVED && toState === State.SCHEDULED) {
    // Additional checks: tenant permission, etc.
    return true;
  }
  
  // Rule: only SCHEDULED -> PUBLISHING
  if (content.state === State.SCHEDULED && toState === State.PUBLISHING) {
    return true;
  }
  
  // Rule: only PUBLISHING -> PUBLISHED
  if (content.state === State.PUBLISHING && toState === State.PUBLISHED) {
    return true;
  }
  
  // Other transitions validation...
  return this.domainEngine.validateTransition(content, toState, user);
}
```

### Events Emitted
- state:changed (content_id, from_state, to_state, user_id)
- content:approved (content_id, approver_id)
- content:rejected (content_id, rejector_id, reason)
- video:rendered (content_id, video_url)
- publication:started (content_id, platform)
- publication:completed (content_id, platform, success)
- workflow:failed (content_id, error, state)

## Idempotency

### Critical Principle
**Todo background job debe ser idempotente.**

Meaning: Same input produces same result, safe to retry.

### Implementation
- Job data includes: content_id, tenant_id, project_id, parameters
- Redis key per job: `workflow:job:{job_type}:{content_id}`
- If job re-executed, check if already completed result exists
- Partial results cleaned up before re-execution
- State transitions are atomic (database transaction)

### Idempotent Jobs
- AI generation: same prompt → same output (with seed)
- TTS generation: same text+voice → same audio
- Video rendering: same inputs → same output (deterministic FFmpeg)
- Publication: same content → same API calls (handle duplicates)

## Error States & Recovery

### From Any State → FAILED
- Max retries exceeded
- System error (external API failure, etc.)
- Manual intervention required

### From FAILED → CANCELLED
- Content permanently cancelled
- No further automatic retries
- Admin can manually restart from appropriate state

### From FAILED → RETRY
- Specific failures (rate limit, transient error)
- Exponential backoff before retry
- Max 3 retries per job type
- Cost tracking per retry attempt

## Multi-Tenant Considerations

### State Isolation
- Each tenant's content follows independent state machines
- State transitions respect tenant context
- No cross-tenant state interference

### Tenant-Specific Rules
- Some tenants may skip AI_REVIEW (configured in settings)
- Some tenants may have different approval workflows
- Vertical-specific rules from Domain Engine applied per tenant