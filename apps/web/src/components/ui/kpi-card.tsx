'use client'

import type { ReactNode } from 'react'

export type KpiTone = 'primary' | 'success' | 'warning' | 'error' | 'info' | 'neutral'

const toneText: Record<KpiTone, string> = {
  primary: 'text-primary',
  success: 'text-success',
  warning: 'text-warning',
  error: 'text-error',
  info: 'text-info',
  neutral: 'text-textPrimary',
}

const toneIconBg: Record<KpiTone, string> = {
  primary: 'bg-primary/10 text-primary',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  error: 'bg-error/10 text-error',
  info: 'bg-info/10 text-info',
  neutral: 'bg-muted text-textSecondary',
}

export function KpiCard({
  label,
  value,
  description,
  icon,
  tone = 'primary',
  progress,
}: {
  label: string
  value: ReactNode
  description?: string
  icon?: ReactNode
  tone?: KpiTone
  /** Optional 0-100 progress bar */
  progress?: number
}) {
  return (
    <div className="bg-card border border-border rounded-xl p-4 shadow-sm hover:border-primary/40 transition-colors min-h-[132px]">
      <div className="flex items-start gap-3">
        {icon && (
          <div className={`inline-flex shrink-0 items-center justify-center h-10 w-10 rounded-xl ${toneIconBg[tone]}`}>
            {icon}
          </div>
        )}
        <div className="min-w-0">
          <p className="text-xs font-medium text-textSecondary leading-tight">{label}</p>
          <p className={`text-2xl font-bold mt-1 ${toneText[tone]}`}>{value}</p>
          {description && <p className="text-xs text-textSecondary mt-1">{description}</p>}
        </div>
      </div>
      {typeof progress === 'number' && (
        <div
          className="mt-3 h-1.5 w-full rounded-full bg-muted overflow-hidden"
          role="progressbar"
          aria-valuenow={Math.min(100, Math.max(0, Math.round(progress)))}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={label}
        >
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          />
        </div>
      )}
    </div>
  )
}
