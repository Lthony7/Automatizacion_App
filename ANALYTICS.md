# Analytics

## Metrics Registry

### Core Metrics Per Content Item

| Metric Type | Data Type | Description |
|-------------|-----------|-------------|
| views | Integer | Number of times video was viewed |
| likes | Integer | Number of likes/hearts |
| comments | Integer | Number of comments posted |
| shares | Integer | Number of times shared |
| followers | Integer | Follower change during/after publication |
| watch_time | Float | Total watch time in seconds |
| retention | Float | Percentage of video watched (average) |
| publication_time | Timestamp | When content was published |
| click_through_rate | Float | CTA clicks / views ratio |

### Per-Tenant Aggregation
All metrics filtered by tenant_id. Aggregations per project and per vertical.

### Analytics Collection

1. **Platform API Polling**
   - Periodic job (every 1-5 minutes) queries each connected social account
   - Retrieves metrics from YouTube Analytics, Instagram Insights, Facebook Insights
   - Stores raw data in analytics table

2. **Webhook Events**
   - Platforms can send webhooks for real-time updates
   - Endpoints configured per social account
   - Lower latency than polling
   - Fallback to polling if webhooks unavailable

3. **Manual Import**
   - Admin can import metrics from platform dashboards
   - CSV import for historical data
   - Useful for migration or supplemental data

### Analytics Table Structure

```typescript
interface Analytics {
  id: UUID;
  content_id: UUID;          // FK to content
  platform: Platform;        // youtube, instagram, facebook
  metric_type: MetricType;   // views, likes, comments, shares, followers, watch_time, retention, publication_time
  metric_value: Number;
  recorded_at: Timestamp;    // when this metric was recorded
  tenant_id: UUID;
}
```

### Metric Types

| metric_type | Description | Calculation |
|-------------|-------------|------------|
| views | Total video views | From platform API |
| likes | Total likes/thumbs up | From platform API |
| comments | Total comments | From platform API |
| shares | Total shares/reshares | From platform API |
| followers | Net follower change | Before/after comparison |
| watch_time | Total minutes watched | From platform analytics |
| retention | Average retention % | From platform analytics |
| publication_time | Publication timestamp | From publication record |

### Content Intelligence

#### Recommendation Engine

Analyzes performance and generates recommendations:

1. **Identify Top Performers**
   - Content with highest retention
   - Content with most engagement (likes + comments + shares)
   - Content with best conversion (CTA clicks)

2. **Pattern Detection**
   - Best performing times of day
   - Best performing days of week
   - Most effective content types per vertical
   - Most effective templates

3. **Generated Recommendations**
   - "Publish similar content on [day] at [time]"
   - "Use template [X] for [vertical] content"
   - "Add [topic] to increase engagement by Y%"
   - " optimal publishing frequency for [vertical]"

4. **Safety Constraints**
   - Does NOT automatically modify content
   - Recommendations only, requires human approval
   - Critical content (prayer, verse) has extra safeguards
   - Recommendations logged and auditable

### Cost & Revenue Analytics

#### Cost Tracking (from COSTS.md)
- cost_per_video: AI + TTS + rendering costs
- daily_cost: total daily operations cost
- monthly_cost: total monthly operations cost

#### Revenue Opportunities (future)
- Affiliate marketing analytics
- Sponsored content metrics
- Platform monetization insights

### Dashboard Exposure

#### Per-Tenant Dashboards
- Content performance over time
- Vertical comparison
- Publisher performance
- Cost vs performance ratio

#### Per-Project Dashboards
- Project-specific metrics
- Template effectiveness
- Vertical-specific trends

#### Global Analytics
- Cross-tenant aggregated insights (super-admin only)
- Industry benchmarking (if data sufficient)
- Feature usage analytics

### Data Retention
- Real-time metrics: 90 days
- Historical metrics: 1 year (configurable)
- Aggregated trends: 2+ years
- GDPR/privacy compliance for user data

### API Endpoints

```
GET /analytics?content_id=...&platform=...&metric_type=...&date_range=...
GET /tenant/:id/analytics/summary
GET /project/:id/analytics/performance
GET /vertical/:vertical/analytics/comparison
POST /analytics/import  // bulk import historical data
```

All endpoints require tenant scoping.