/*
 * Domain Contracts Package - Content Automation Platform
 * FASE 1: Foundation Structure
 * Implementation of the 7 Domain Engine interfaces from FASE 0
 * These are the generic interfaces that verticals (Christian, Automotive, etc.)
 * must implement without modifying the Core modules.
 * FASE 3: Domain Registry and concrete domain implementations
 * FASE 4: AI Provider Abstraction and Prompt Engine
 * FASE 5: Christian Vertical Complete Implementation
 * FASE 6: Bible Engine
 * FASE 7: Content Engine, Content Planner, Campaigns
 * FASE 8: Media, Audio, Subtitles
 * FASE 9: Templates, Video Rendering, Render Jobs
*/

export { DomainInterface, RegisterableDomain, DomainRegistry, DomainRegistryEvent, DomainRegistryListener } from './domain.registry';
export { ChristianDomain } from './christian.domain';
export { AutomotiveDomain } from './automotive.domain';

// FASE 4: AI Provider Abstraction
export { AIProvider } from './ai-provider';
export { PromptProvider } from './prompt-provider';
export { InMemoryPromptProvider } from './in-memory-prompt-provider';
export { AIService, AIServiceConfig, AIUsageRecord, AIServiceError } from './ai-service';

// FASE 4: Provider implementations (initial: Gemini, prepared: Groq, OpenAI)
export { GeminiProvider } from './providers/gemini-provider';
export { GroqProvider } from './providers/groq-provider';
export { OpenAIProvider } from './providers/openai-provider';

// FASE 0: Original 7 interfaces (re-exported for convenience)
export { DomainProvider, DomainValidator, DomainContentTypeProvider, DomainPromptProvider, DomainRuleProvider, DomainTemplateProvider, DomainKnowledgeProvider } from './domain.interface';

// FASE 5: Christian Vertical Complete
export { ChristianContentType, CHRISTIAN_CONTENT_TYPES, CHRISTIAN_CONTENT_TYPE_METADATA, getChristianContentTypeMetadata, getChristianContentTypesByCategory } from './christian-content-types';
export { ChristianDomainProvider } from './christian-domain-provider';
export { ChristianValidator } from './christian-validator';
export { ChristianPromptProvider } from './christian-prompt-provider';
export { ChristianRuleProvider } from './christian-rule-provider';
export { ChristianTemplateProvider } from './christian-template-provider';
export { ChristianKnowledgeProvider } from './christian-knowledge-provider';
export { DEFAULT_CHRISTIAN_CALENDAR, CHRISTIAN_CALENDAR_EVENT_TEMPLATES, CalendarConfig, CalendarEvent, CalendarEventTemplate, getDefaultChristianCalendar, mergeCalendarConfigs, validateCalendarEvent } from './christian-calendar-config';

// FASE 6: Bible Engine (Christian Domain only)
export { BibleParser } from './bible-engine/bible-parser';
export { BibleEngine, BibleEngineData } from './bible-engine/bible-engine';
export { BibleGuard } from './bible-engine/bible-guard';
export { BIBLE_BOOKS, BIBLE_TOPICS, BIBLE_TRANSLATIONS, RVR_1909_TRANSLATION, SAMPLE_BIBLE_VERSES, CHAPTER_VERSE_COUNTS } from './bible-engine/bible-data';
export { BibleTranslation, BibleBook, BibleChapter, BibleVerse, BibleTopic, ParsedBibleReference, BibleReferenceValidationResult, BibleEngineConfig } from './bible-engine/bible-types';

// FASE 7: Generic Content Engine, planning, and campaigns
export { ContentEngine } from './content-engine';
export { ContentPlanner } from './content-planner';
export { CampaignService, InMemoryCampaignRepository } from './campaigns';
export { ContentPipelineStatus, ContentIdea, ContentFields, GeneratedContent, ContentGenerationRequest, StructuredContentAI, ContentDomainProvider, DomainProviderResolver, ContentPipelineResult } from './content-engine';
export { PlanningScope, DailyTargetConfig, DailyPlanRequest, PlannedContent, DailyPlan } from './content-planner';
export { CampaignStatus, Campaign, CreateCampaignInput, CampaignRepository } from './campaigns';

// FASE 8: Generic Media, Audio, and Subtitle Engines
export { MediaEngine, InMemoryMediaProvider } from './media-engine';
export { MediaType, MediaMetadata, MediaAsset, MediaSearchRequest, MediaProvider, MediaLicenseValidation } from './media-engine';
export { AudioEngine, GoogleTTSProvider, ElevenLabsTTSProvider, LocalTTSProvider } from './audio-engine';
export { AudioAsset, TTSRequest, TTSVoice, TTSProvider, TTSProviderClient } from './audio-engine';
export { SubtitleEngine } from './subtitle-engine';
export { SubtitleFormat, SubtitlePosition, SubtitleCue, SubtitleStyle, SubtitleGenerationRequest, SubtitleProvider, RenderedSubtitles } from './subtitle-engine';

// FASE 9: Generic templates, video rendering, and idempotent render jobs
export { TemplateEngine } from './template-engine';
export { VideoLayerType, TemplateTransition, VideoTemplateLayer, VideoTemplate } from './template-engine';
export { VideoEngine, VERTICAL_VIDEO_OUTPUT } from './video-engine';
export { VideoContent, MediaAssets, SubtitleTrack, VideoOutput, VideoRenderRequest, FFmpegInput, FFmpegRenderPlan, VideoRenderResult, FFmpegExecutor } from './video-engine';
export { RenderJobService, InMemoryRenderJobQueue, DEFAULT_RENDER_RETRY_POLICY } from './render-jobs';
export { RenderRetryPolicy, RenderJobPayload, RenderJob, RenderJobQueue, RenderJobHandler } from './render-jobs';
export { CHRISTIAN_DEMO_VIDEO_TEMPLATES, AUTOMOTIVE_DEMO_VIDEO_TEMPLATES, DEMO_VIDEO_TEMPLATES } from './demo-video-templates';

// FASE 11: Workflow Jobs and Scheduler
export { WorkflowState, WorkflowTransition, WorkflowJobPayload, WorkflowJob, WorkflowJobQueue, WorkflowJobHandler, WorkflowJobService, DEFAULT_WORKFLOW_RETRY_POLICY } from './workflow-jobs';

// FASE 12: Social Publishers and Publication Engine
export { Publisher, SocialPlatform, SocialAccount, PublicationRequest, PublicationResult, PublicationStatus, TokenStore } from './social-publisher';
export { PublicationEngine, PublicationJob, PublicationJobStatus, PublicationJobStore, createInMemoryPublicationJobStore } from './publication-engine';
export { YouTubePublisher } from './social-publishers/youtube-publisher';
export { InstagramPublisher } from './social-publishers/instagram-publisher';
export { FacebookPublisher } from './social-publishers/facebook-publisher';
export { MockPublisher, createMockTokenStore } from './social-publishers/mock-publisher';

// FASE 13: Analytics Engine + Content Intelligence (generic, metadata-driven)
export { AnalyticsEngine, createInMemoryAnalyticsStore, DIMENSION_EXTRACTORS } from './analytics-engine';
export { MetricType, ALL_METRICS, AnalyticsDimension, ALL_DIMENSIONS, AnalyzedContent, MetricRecord, AnalyticsStore } from './analytics-engine';
export { SegmentAggregate, DimensionReport, MetricAverages } from './analytics-engine';
export { ContentIntelligence } from './content-intelligence';
export { InsightOptions, InsightRecommendation } from './content-intelligence';

// FASE 14: Cost Management + limits/guard
export { CostEngine, createInMemoryCostStore } from './cost-management';
export { CostCategory, ALL_COST_CATEGORIES, CostRecord, CostRecordFilter, CostStore, CategoryBreakdownEntry, CostBreakdown } from './cost-management';
export { CostGuard, createInMemoryLimitStore, createInMemoryVideoUsageStore, createInMemoryAuditLog, createInMemoryAdminNotifier } from './cost-guard';
export { LimitScope, LimitKind, CostLimit, LimitStore, VideoUsageStore, AuditSeverity, AuditEvent, AuditLog, AdminNotification, AdminNotifier, LimitEvaluation, GuardCheckOptions } from './cost-guard';

// FASE 15: Vertical metadata (backend-provided navigation + dashboard config)
export { getVerticalMetadata, listVerticalIds, fetchVerticalMetadata, VerticalMetadataProvider, registerVerticalMetadata, seedBuiltinVerticals } from './vertical-metadata';
export type { NavIcon, NavItem, ContentCategory, VerticalMetadata } from './vertical-metadata';

// FASE 16: Audit + Notification Engines (generic, no vertical-specific services)
export { AuditEngine, createInMemoryAuditStore, sanitizeValue, sanitizeMetadata } from './audit-engine';
export type { AuditResult, AuditRecord, AuditRecordInput, AuditStore } from './audit-engine';
export { NotificationEngine, createInMemoryNotificationStore, EmailChannel, TelegramChannel, GenericChannel, APP_EVENTS } from './notification-engine';
export type { AppEvent, NotificationSeverity, Notification, NotificationInput, NotificationStore, NotificationChannel } from './notification-engine';

// FASE 17: Automotive vertical demostrativo — mismo Core (no plataforma separada)
export { AutomotiveContentType, AUTOMOTIVE_CONTENT_TYPES, AUTOMOTIVE_CONTENT_TYPE_METADATA, getAutomotiveContentTypeMetadata, getAutomotiveContentTypesByCategory } from './automotive-content-types';
export { AutomotiveValidator } from './automotive-validator';
export { AutomotivePromptProvider } from './automotive-prompt-provider';
export { AutomotiveRuleProvider } from './automotive-rule-provider';
export { AutomotiveDomainProvider } from './automotive-domain-provider';
