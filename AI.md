# AI Provider Abstraction

## Philosophy

No direct SDK calls (Gemini, OpenAI, Groq) from content modules. All modules use AIService abstraction. Provider can be swapped without business logic changes.

## AIService Interface

### Core Methods

#### generateText(params: GenerateTextParams): Promise<GenerateTextResult>
- purpose: Define what text to generate (script, title, description, CTA, etc.)
- inputs: content_type, vertical, prompts, variables, style preferences
- output: generated text, token usage, provider used, cost

#### generateContent(params: GenerateContentParams): Promise<GenerateContentResult>
- purpose: Full content generation (title + description + CTA + hashtags)
- inputs: content_type, vertical, theme, style, tone
- output: complete content object with all fields

#### validateContent(params: ValidateContentParams): Promise<ValidationResult>
- purpose: Domain-specific content validation
- inputs: content, vertical, domain_provider
- output: VALID/WARNING/INVALID with reasons

## Provider Implementations

### Initial Provider: Gemini
- Model: gemini-1.5-pro or similar
- Configuration: API key, temperature, max tokens
- Error handling: Gemini-specific error mapping
- Rate limiting: Gemini API quotas

### Prepared Providers (Abstraction Layer)
- **Groq**: fast inference, llama3, mixtral models
- **OpenAI**: gpt-4o, gpt-4-turbo, embeddings
- **Anthropic**: claude-3 series
- **Local/Llama**: self-hosted models via Ollama

### Provider Configuration
Each provider configured via:
- API key (never in code, env vars or secret management)
- Default model
- Temperature settings
- Max tokens
- Timeout settings
- Retry configuration

## AI Workflow Integration

### Content Generation Flow
1. Content idea → AIService.generateText() with appropriate prompt
2. Prompt resolved from DomainPromptProvider
3. Provider called through AIService abstraction
4. Result stored with provider metadata
5. Cost calculated and recorded in cost_registries

### Prompt Management
- Prompts versioned per tenant/project/vertical
- Stored in database (prompts table)
- Not hardcoded in source code
- Can be updated without deployment
- A/B testing of different prompts

### Cost Tracking
Each AI call records:
- ai_provider (Enum: gemini, openai, groq, etc.)
- ai_model (String)
- tokens_used (Integer)
- cost (Decimal)
- content_id (FK to content)
- project_id
- tenant_id

Cost accumulation:
- cost_per_video: sum of AI + TTS + rendering costs
- daily_cost: total costs per day per tenant/project
- monthly_cost: aggregated monthly costs

## Fallback & Redundancy

### Provider Failover
- Primary provider configured
- Fallback provider if primary fails or exceeds quotas
- Graceful degradation messages

### Retry Logic
- Exponential backoff on API errors
- Maximum retry attempts configured per provider
- Idempotency keys for safe retries

## API Contract

All providers must implement the same interface:
- generateText(params): Promise<result>
- generateContent(params): Promise<result>
- validateContent(params): Promise<result>
- getCost estimate(): Decimal

Implementation details hidden behind abstraction.