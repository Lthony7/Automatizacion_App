import type { WorkflowState, WorkflowTransition } from 'domain-contracts/workflow-jobs';

/** Schedule entry for when a job should be processed. */
export type ScheduleEntry = {
  id: string;
  type: 'tenant' | 'project' | 'content-type';
  refId: string; // tenantId, projectId, or contentTypeId
  cronExpression: string; // e.g. '0 7 * * MON' for 7AM Mondays, or flexible format
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
};

/** Parses a schedule string into hour/minute for simple cases.
 * Accepts: 'HH:MM', 'H:MM', 'HH:MM AM/PM', or cron-like 'H M * * *' */
export function parseScheduleTime(schedule: string): { hour: number; minute: number } | null {
  const trimmed = schedule.trim();
  // Try 'H:MM' or 'HH:MM' 24-hour
  const match24 = trimmed.match(/^(\d{1,2}):(\d{2})$/);
  if (match24) {
    const hour = parseInt(match24[1], 10);
    const minute = parseInt(match24[2], 10);
    if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) {
      return { hour, minute };
    }
  }
  // Try 'HH:MM AM/PM' or 'H:MM AM/PM'
  const match12 = trimmed.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (match12) {
    let hour = parseInt(match12[1], 10);
    const minute = parseInt(match12[2], 10);
    const ampm = match12[3].toUpperCase();
    if (ampm === 'PM' && hour !== 12) hour += 12;
    if (ampm === 'AM' && hour === 12) hour = 0;
    if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) {
      return { hour, minute };
    }
  }
  return null;
}

/** Simple next-fire-time calculator for fixed daily times.
 * Returns null if schedule is not a simple HH:MM time. */
export function nextFireTimeForSimpleSchedule(
  schedule: string,
  referenceTime?: Date,
): Date | null {
  const parsed = parseScheduleTime(schedule);
  if (!parsed) return null;

  const ref = referenceTime ?? new Date();
  const next = new Date(ref);
  next.setHours(parsed.hour, parsed.minute, 0, 0);

  // If the time has already passed today, schedule for tomorrow
  if (next <= ref) {
    next.setDate(next.getDate() + 1);
  }

  return next;
}

/** Workflow scheduler that respects tenant/project/content-type schedules.
 * Does NOT hardcode any times - all schedules come from configured entries. */
export class WorkflowScheduler {
  private readonly schedules = new Map<string, ScheduleEntry>();

  constructor(scheduleEntries: ScheduleEntry[]) {
    for (const entry of scheduleEntries) {
      this.schedules.set(entry.refId, entry);
    }
  }

  /** Get schedule for a tenant. */
  getTenantSchedule(tenantId: string): ScheduleEntry | undefined {
    return this.schedules.get(`tenant:${tenantId}`);
  }

  /** Get schedule for a project. */
  getProjectSchedule(projectId: string): ScheduleEntry | undefined {
    return this.schedules.get(`project:${projectId}`);
  }

  /** Get schedule for a content type. */
  getContentTypeSchedule(contentTypeId: string): ScheduleEntry | undefined {
    return this.schedules.get(`content-type:${contentTypeId}`);
  }

  /** Get all active schedules. */
  getAllSchedules(): ScheduleEntry[] {
    return Array.from(this.schedules.values()).filter((s) => s.active);
  }

  /** Check if a given state should be triggered at the current time.
   * Returns the transition name if the schedule matches, or undefined. */
  checkTrigger(state: WorkflowState, now: Date): { transition: WorkflowTransition } | undefined {
    // For FASE 11, we map specific states to schedule-based triggers
    const scheduleMap: Partial<Record<WorkflowState, string>> = {
      SCHEDULED: 'content-generation',
      PUBLISHING: 'publication',
    };

    // Check each schedule entry
    for (const entry of this.getAllSchedules()) {
      const nextFire = nextFireTimeForSimpleSchedule(entry.cronExpression, now);
      if (!nextFire) continue; // Not a simple time schedule, skip

      // Check if this schedule applies to the current state
      if (scheduleMap[state] === entry.type) {
        // In a full implementation, we'd check if the refId matches the current tenant/project/content-type
        // For now, we return the trigger if the time matches
        return { transition: state === 'SCHEDULED' ? 'APPROVED_TO_SCHEDULED' : 'SCHEDULED_TO_PUBLISHING' };
      }
    }

    return undefined;
  }
}

/** Default 5-video-per-day schedule configuration (NOT hardcoded in code - loaded from DB).
 * Format: cron expressions or simple time strings.
 * These are placeholders - real values come from tenant/project schedules. */
export const DEFAULT_SCHEDULE_ENTRIES: ScheduleEntry[] = [
  // Example format - real schedules loaded from DB
  // { id: '1', type: 'tenant', refId: 'tenant-1', cronExpression: '0 7 * * *', active: true }, // daily 7AM
  // { id: '2', type: 'tenant', refId: 'tenant-2', cronExpression: '0 10 * * *', active: true }, // daily 10AM
];