# Cost Management

## Cost Categories

### AI Costs
- **AI generation per content item**: cost per title, description, CTA, hashtags generation
- **AI model pricing**: per 1K tokens (varies by provider: Gemini, OpenAI, Groq)
- **AI retry cost**: additional cost on failed attempts, tracked per job

### TTS Costs
- **Per minute of audio**: TTS provider pricing (Google, ElevenLabs, local)
- **Voice selection**: premium voices cost more than default
- **Language pricing**: some languages cost more
- **Audio duration**: longer content = higher cost

### Rendering Costs
- **Per video rendered**: FFmpeg processing cost
- **Cloud rendering**: if using external service (vs local FFmpeg)
- **Video duration**: longer videos cost more CPU/time
- **Resolution**: 1080x1920 standard, no extra cost beyond time

### Storage Costs
- **Per GB per month**: S3-compatible storage
- **Video storage**: per video asset
- **Audio storage**: per audio asset
- **Thumbnail/thumbnails**: per image
- **Lifecycle management**: auto-delete old versions, archive to cold storage

### API Usage Costs
- **Social API calls**: YouTube, Instagram, Facebook API usage
- **AI provider API**: tokens used, quota overages
- **TTS provider API**: per request charges
- **External services**: any third-party API usage

## Cost Tracking Tables

### cost_registries
```typescript
interface CostRegistry {
  id: UUID;
  description: String;  // e.g., "AI generation per video", "TTS per minute"
  category: Enum;      // ai, tts, storage, rendering, api_usage
  amount: Decimal;     // cost amount
  reference_type: Enum; // content, project, tenant, user, nullable
  reference_id: UUID;  // FK to referenced record
  metadata: JSON;      // additional context (provider, model, etc.)
  created_at: Timestamp;
}
```

### Cost Aggregation Per Scope

#### cost_per_video (per content item)
Sum of:
- AI generation costs (title, description, CTA, hashtags, script)
- TTS generation costs (voice audio)
- Rendering costs (FFmpeg processing)
- Storage costs (pro-rated per video)
- API usage costs (platform calls)

Formula: `cost_per_video = cost_ai + cost_tts + cost_render + cost_storage_pro-rata + cost_api`

#### daily_cost (per tenant per day)
Sum of all costs incurred in a 24-hour period.

#### monthly_cost (per tenant per month)
Aggregated daily costs for calendar month.

#### cost_by_category (per tenant per month)
Breakdown by:
- AI: X%
- TTS: Y%
- Rendering: Z%
- Storage: W%
- API: V%

### Cost per Vertical
- Christian: typically lower (shorter content, standard templates)
- Automotive: variable (depends on content length)
- Fitness: variable
- Configured per tenant plan

## Cost Optimization Strategies

### 1. Batch Processing
- Multiple content items processed together where possible
- Shared resources (templates, backgrounds)
- Reduced per-item overhead

### 2. Caching
- Prompt caching (AI provider support)
- Template rendering cache
- Generated audio cache (same text+voice = same audio)
- Video cache (same content+template = same video)

### 3. Provider Selection
- Gemini: cost-effective for generation
- Groq: faster, competitive pricing
- OpenAI: higher cost, broader capabilities
- Local TTS: zero marginal cost after setup

### 4. Idempotent Retries
- Same input → same output (no wasted AI calls)
- Retry only on actual failures
- Exponential backoff avoids thundering herd

### 5. Quota Management
- Per-tenant AI quota limits
- Alert before overage
- Graceful degradation (use alternative provider)
- Plan-based limits (free vs pro vs enterprise)

## Cost Examples (Estimates)

### Typical Christian Content Video
- AI generation (4 calls): $0.03 - $0.08
- TTS (1 minute): $0.01 - $0.03
- Rendering (FFmpeg, local): $0.00 (infrastructure cost)
- Storage (pro-rated): $0.001 - $0.005
- **Total per video**: ~$0.04 - $0.12

### Typical Automotive Content Video
- AI generation (4 calls): $0.03 - $0.08
- TTS (1-2 minutes): $0.02 - $0.06
- Rendering: $0.00 - $0.05 (if cloud)
- Storage: $0.001 - $0.005
- **Total per video**: ~$0.06 - $0.20

## Cost Configuration Per Tenant

### Plan Features
| Plan | AI Calls/Day | TTS Minutes/Day | Videos/Day | Storage GB |
|------|-------------|-----------------|------------|------------|
| Free | 10 | 5 | 3 | 1 |
| Pro | 100 | 50 | 20 | 10 |
| Enterprise | Unlimited | Unlimited | Unlimited | 100+ |

### Cost Alerts
- Email alert at 80% of monthly budget
- Automatic pause at 100% (configurable)
- Per-notification costs (per API call, per video)
- Super-admin can override limits

## Cost Reporting

### Monthly Cost Report
- Sent to tenant admin at month-end
- Breakdown by category (AI, TTS, Rendering, Storage, API)
- Per-vertical breakdown (if multiple verticals installed)
- Per-project breakdown
- Comparison vs previous month
- Forecast based on current trajectory

### Cost Alert Triggers
- 50% of monthly budget used
- 80% of monthly budget used  
- Cost per video exceeds threshold
- Sudden cost spike (potential bug or abuse)

### Budget Override
- Super-admin can increase budget temporarily
- Justification required for significant increases
- All overrides audited
- Automatic reset at next billing cycle

## API Cost Examples

### AI Provider Costs (per 1K tokens)
- Gemini: $0.35 - $1.00 (depending on model)
- OpenAI GPT-4o: $2.50 - $10.00
- Groq: $0.25 - $0.75

### TTS Provider Costs (per minute)
- Google Cloud TTS: $4.00 (standard wavelet)
- ElevenLabs: $0.50 - $1.50 (depending on voice)
- Local/TTS: $0.00 (after infrastructure cost)

### Rendering Costs
- Local FFmpeg: $0.00 (server CPU cost only)
- Cloud rendering (if used): $0.05 - $0.20 per minute

## Cost Safety Rules

1. No cost operations without tenant context
2. Cost estimated before job execution
3. User approval for costs above threshold
4. All costs auditable (who, what, when, how much)
5. No negative costs (validation before record)
6. Costs cannot be modified after creation (append-only)
7. Monthly resets are atomic transactions