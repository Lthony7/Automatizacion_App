# Publishing System

## Abstraction Layer

### Publisher Interface

```typescript
interface Publisher {
  platform: Platform;
  publish(contentId: string, videoUrl: string, metadata: PublishMetadata): Promise<PublishResult>;
  canPublish(content: ContentEntity): boolean; // checks if APPROVED
  getStatus(contentId: string): Promise<PublishStatus>;
}
```

**Rule**: Content must be APPROVED before publication. No exceptions.

## Publisher Implementations

### YouTubePublisher
- Platform: YouTube
- Video format: Vertical (1080x1920), Shorts-compatible
- Metadata: title, description, tags, category, visibility
- Publish options: unlisted, private, public, scheduled
- Handles YouTube Data API v3
- Responds with: video ID, URL, view count start

### InstagramPublisher
- Platform: Instagram (Feed, Stories, Reels)
- Video format: Vertical (1080x1920), up to 60fps
- Metadata: caption, hashtags, location, tag users
- Publish options: immediate, first comment scheduling
- Handles Instagram Graph API
- Responds with: post ID, insights start

### FacebookPublisher
- Platform: Facebook / Instagram (connected)
- Video format: Vertical (1080x1920)
- Metadata: message, tags, audience targeting
- Publish options: to feed, to story, scheduled
- Handles Graph API
- Responds with: post ID, reach, engagement

## Publication Workflow

### Required Sequence
1. Content state: APPROVED
2. Trigger publication (manual or scheduled)
3. State transition: APPROVED → SCHEDULED → PUBLISHING → PUBLISHED
4. Publisher API call
5. Result stored in publisher_attempts table
6. Analytics tracking begins

### Publication States

| State | Description |
|-------|-------------|
| SCHEDULED | Content queued for publication, not yet sent to platform |
| PUBLISHING | API call in progress to social platform |
| PUBLISHED | Successfully published on platform |
| PUBLISH_FAILED | Platform API rejected or error occurred |

### Scheduled Publications
- Content can be scheduled for future publication
- `published_at` timestamp set
- State: SCHEDULED until `published_at` arrives
- Can be unscheduled/cancelled before publication

### Bulk Publication
- Multiple content items can be published in batch
- Parallel processing with rate limiting
- Per-platform limits respected
- Individual results tracked per item

## API Key Requirements

### Social Account Connection
- OAuth flow for each platform
- Access tokens stored encrypted (AES-256 or similar)
- Refresh tokens automated
- Token expiration handling
- Account per tenant/project

### Permission Scopes
- YouTube: `youtube.upload`, `youtube.managed_channels.read`
- Instagram: `instagram_basic`, `pages_manage_posts`
- Facebook: `pages_manage_posts`, `publish_pages`

### Key Rotation
- Automatic refresh via stored refresh tokens
- Manual rotation via admin panel
- Revoked keys invalidated immediately
- Last_used_at tracking for monitoring

## Error Handling

### Publication Failure
1. State: PUBLISHING → PUBLISH_FAILED
2. Error message stored in publisher_attempts
3. Retry logic with exponential backoff
- Max 3 retries per publication
- Backoff: 1min, 5min, 15min
- After 3 failures: manual intervention required

### Success Path
1. Platform returns success
2. State: PUBLISHING → PUBLISHED
3. Analytics initialization
4. Cost tracking for publication
5. Notification to user

### Partial Success
- Some platforms report partial success
- Individual items tracked
- State based on majority success
- Mixed results logged

## Analytics Integration

### Publication Metrics Tracked
- views, likes, comments, shares
- follower changes (if applicable)
- watch_time, retention metrics
- publication_time (timestamp)
- platform-specific metrics

### Data Flow
1. Publication completed → analytics queue
2. Periodic polling of platform APIs
3. Metrics stored in analytics table
4. Available for Content Intelligence analysis

## Multi-Tenant Publication

### Tenant Isolation
- Each tenant's social accounts are isolated
- Publisher respects tenant context
- No cross-tenant publication

### Per-Tenant Limits
- Publication quotas per plan
- Rate limits per tenant per platform
- Content visible only to tenant users

## Publication API Endpoints

```
POST /content/:id/publication  // trigger publication
GET /content/:id/publication-status  // check status
POST /content/bulk/publication  // bulk publish (admin)
GET /tenant/:id/publications  // tenant's publication history
```

All endpoints require tenant context validation.