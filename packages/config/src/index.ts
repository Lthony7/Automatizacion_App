/*
 * Config Package - Content Automation Platform
 * FASE 1: Foundation Structure
 * Configuration management shared across apps and packages
 * Multi-tenancy plan configuration
*/

export const APP_NAME = 'Content Automation Platform';
export const API_VERSION = '1';

export const PLANS = {
  free: { maxDailyVideos: 5, maxProjects: 1 },
  pro: { maxDailyVideos: 20, maxProjects: 10 },
  enterprise: { maxDailyVideos: Infinity, maxProjects: Infinity },
} as const;

export type PlanId = keyof typeof PLANS;
