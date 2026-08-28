# Content Automation Platform

A modular monolith SaaS platform for content automation, supporting multiple verticals and multi-tenancy.

## Overview

The platform enables automated content creation, processing, and distribution across multiple channels and platforms. Built with a modular monolith architecture that can later extract heavy modules (Video Engine, AI Engine, Publication Engine) as microservices if growth requires.

## Philosophy

- **No domain coupling**: Core never depends on Christian, Automotive, Fitness, or any specific vertical
- **Abstraction first**: AI providers, TTS publishers, and video engines are all abstractions
- **Multi-tenant ready**: Full isolation between tenants with shared infrastructure
- **State-driven workflow**: Critical state machine controls content progression
- **Audit everything**: Critical operations are fully auditable

## First Vertical: Christian Content

Initial content types include:
- Morning and night prayers
- Protection prayers
- Family, children, work prayers
- Biblical verses, Psalms, Proverbs
- Stories, characters, parables, teachings
- Biblical curiosities

Architecture designed to support any vertical (Automotive, Fitness, etc.) without core modifications.

## Stack

- **Frontend**: Next.js, React, TypeScript
- **Backend**: NestJS, TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Queue**: Redis + BullMQ
- **Video**: FFmpeg
- **Storage**: S3-compatible Object Storage
- **Container**: Docker
- **Testing**: Jest, Supertest, Playwright
- **Observability**: Structured logging, health checks, metrics, Sentry-ready

## Key Features

1. Content idea generation
2. AI-powered content generation
3. Script, title, description, CTA generation
4. Hashtag generation
5. Domain validation
6. Voice generation (TTS)
7. Multimedia resource selection
8. Subtitle generation
9. Vertical video rendering (1080x1920)
10. Automated review workflow
11. Human review support
12. Content approval/rejection
13. Scheduled publishing
14. Social media publication via official APIs
15. Analytics collection
16. Cost calculation
17. Performance analysis
18. Content recommendations
19. Multi-project support
20. Multi-user support
21. Plugin-based vertical installation

## Architecture Layers

- Core (Auth, Users, Tenants, Projects, Roles, Permissions, API Keys, Workflow, Audit)
- Content Modules (Content, Ideas, Planner, Campaigns, Prompts, Domain)
- Media Modules (Media, Audio, Subtitles, Templates, Video)
- Distribution (Scheduler, Queues, Social Accounts, Publication, Analytics, Notifications)
- Business (Cost Management, Content Intelligence)

## ADRs

See ADR-001 through ADR-009 for architectural decisions.

## Getting Started

See DEPLOYMENT.md for deployment instructions.