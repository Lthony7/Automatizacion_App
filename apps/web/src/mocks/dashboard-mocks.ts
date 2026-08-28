/**
 * Mocks aislados del frontend.
 *
 * REGLA: estos datos NUNCA se usan en producción. Se activan únicamente cuando
 * `NEXT_PUBLIC_USE_MOCKS=true` o cuando el endpoint del backend todavía no existe
 * (ver cada consumidor). Los mocks viven SOLO aquí — ningún componente define
 * datos de negocio inline.
 */

export const USE_MOCKS = process.env.NEXT_PUBLIC_USE_MOCKS === 'true'

// --- Dashboard ---

export interface DashboardKpis {
  videosToday: number
  dailyTarget: number
  pendingReview: number
  approved: number
  scheduledToday: number
  publishedToday: number
  errors: number
}

/** TODO backend: GET /api/dashboard?range=today */
export const mockDashboardKpis: DashboardKpis = {
  videosToday: 5,
  dailyTarget: 5,
  pendingReview: 3,
  approved: 2,
  scheduledToday: 5,
  publishedToday: 7,
  errors: 1,
}

export type PipelineCounts = Partial<
  Record<'DRAFT' | 'GENERATING' | 'VALIDATING' | 'RENDERING' | 'REVIEW' | 'APPROVED' | 'SCHEDULED' | 'PUBLISHED', number>
>

/** TODO backend: GET /api/workflow/summary */
export const mockPipelineCounts: PipelineCounts = {
  DRAFT: 2,
  GENERATING: 1,
  VALIDATING: 1,
  RENDERING: 1,
  REVIEW: 3,
  APPROVED: 2,
  SCHEDULED: 5,
  PUBLISHED: 7,
}

/** TODO backend: GET /api/costs/summary */
export const mockCostSummary = {
  todayUsd: 2.45,
  monthUsd: 68.34,
  budgetMonthlyUsd: 120,
  series: [1.8, 2.2, 3.1, 2.6, 3.4, 1.9, 2.45],
}

export interface AgendaItem {
  time: string
  title: string
  typeKey: string
  statusKey: string
}

/** TODO backend: GET /api/calendar/today */
export const mockAgendaToday: AgendaItem[] = [
  { time: '07:00 AM', title: 'Oración de la Mañana', typeKey: 'types.prayer', statusKey: 'dashboard.statusSCHEDULED' },
  { time: '10:00 AM', title: 'Versículo del Día', typeKey: 'types.verse', statusKey: 'review.approved' },
  { time: '01:00 PM', title: 'Reflexión: Confía en Dios', typeKey: 'types.reflection', statusKey: 'dashboard.statusREVIEW' },
  { time: '05:00 PM', title: 'Historia de David', typeKey: 'types.story', statusKey: 'review.approved' },
  { time: '09:00 PM', title: 'Oración de la Noche', typeKey: 'types.prayer', statusKey: 'dashboard.statusSCHEDULED' },
]

export interface RecentContentRow {
  id: string
  title: string
  typeKey: string
  statusTone: 'review' | 'approved' | 'scheduled' | 'published' | 'failed'
  statusLabelKey: string
  scheduledAt?: string
  platforms: Array<'youtube' | 'instagram' | 'facebook' | 'tiktok'>
}

/** TODO backend: GET /api/content?limit=8 */
export const mockRecentContent: RecentContentRow[] = [
  { id: 'c1', title: 'Oración de la Mañana', typeKey: 'types.prayer', statusTone: 'review', statusLabelKey: 'dashboard.statusREVIEW', scheduledAt: '07:00 AM', platforms: ['youtube'] },
  { id: 'c2', title: 'Versículo del Día', typeKey: 'types.verse', statusTone: 'approved', statusLabelKey: 'review.approved', scheduledAt: '10:00 AM', platforms: ['youtube', 'instagram'] },
  { id: 'c3', title: 'Reflexión: Confía en Dios', typeKey: 'types.reflection', statusTone: 'review', statusLabelKey: 'dashboard.statusREVIEW', scheduledAt: '01:00 PM', platforms: [] },
  { id: 'c4', title: 'Historia de David', typeKey: 'types.story', statusTone: 'approved', statusLabelKey: 'review.approved', scheduledAt: '05:00 PM', platforms: ['facebook'] },
  { id: 'c5', title: 'Oración de la Noche', typeKey: 'types.prayer', statusTone: 'scheduled', statusLabelKey: 'dashboard.statusSCHEDULED', scheduledAt: '09:00 PM', platforms: ['youtube', 'instagram', 'facebook'] },
]

export interface PerformancePoint {
  dayKey: string
  views: number
  likes: number
  comments: number
  shares: number
}

/** TODO backend: GET /api/analytics/performance?days=7 */
export const mockPerformance7d: PerformancePoint[] = [
  { dayKey: 'days.mon', views: 4200, likes: 310, comments: 48, shares: 65 },
  { dayKey: 'days.tue', views: 5100, likes: 402, comments: 61, shares: 82 },
  { dayKey: 'days.wed', views: 4800, likes: 355, comments: 52, shares: 71 },
  { dayKey: 'days.thu', views: 6300, likes: 512, comments: 84, shares: 110 },
  { dayKey: 'days.fri', views: 7200, likes: 604, comments: 96, shares: 132 },
  { dayKey: 'days.sat', views: 6900, likes: 580, comments: 91, shares: 124 },
  { dayKey: 'days.sun', views: 8400, likes: 702, comments: 118, shares: 160 },
]

export interface ActivityItem {
  id: string
  eventKey: string
  detail?: string
  relativeTimeKey: string
  tone: 'approved' | 'published' | 'generated' | 'scheduled' | 'review'
}

/** TODO backend: GET /api/activity?limit=6 */
export const mockRecentActivity: ActivityItem[] = [
  { id: 'a1', eventKey: 'activity.videoApproved', detail: 'Versículo del Día - Salmos 23:1', relativeTimeKey: 'time.minAgo', tone: 'approved' },
  { id: 'a2', eventKey: 'activity.publishedYoutube', detail: 'Historia de David', relativeTimeKey: 'time.hourAgo', tone: 'published' },
  { id: 'a3', eventKey: 'activity.newGenerated', detail: 'Oración por mi Familia', relativeTimeKey: 'time.hoursAgo2', tone: 'generated' },
  { id: 'a4', eventKey: 'activity.scheduledMorningPrayer', relativeTimeKey: 'time.hoursAgo4', tone: 'scheduled' },
  { id: 'a5', eventKey: 'activity.reviewPendingReflection', relativeTimeKey: 'time.yesterday', tone: 'review' },
]

// --- Notificaciones (badge + panel) ---

/** TODO backend: GET /api/notifications?unread=true */
export const mockNotifications = [
  { id: 'n1', messageKey: 'notifications.reviewPendingCount', count: 3, unread: true },
  { id: 'n2', messageKey: 'notifications.videoGenerated', unread: true },
  { id: 'n3', messageKey: 'notifications.publicationSucceeded', detail: 'YouTube · Historia de David', unread: false },
  { id: 'n4', messageKey: 'notifications.budgetReached', unread: false },
]
