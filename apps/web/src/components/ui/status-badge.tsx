import type { ReactNode } from 'react'

export type StatusTone = 'review' | 'approved' | 'scheduled' | 'published' | 'failed'

const toneClasses: Record<StatusTone, string> = {
  review: 'border-warning/30 bg-warning/10 text-warning',
  approved: 'border-success/30 bg-success/10 text-success',
  scheduled: 'border-info/30 bg-info/10 text-info',
  published: 'border-primary/30 bg-primary/10 text-primary',
  failed: 'border-error/30 bg-error/10 text-error',
}

export function StatusBadge({
  children,
  tone,
  className = '',
}: {
  children: ReactNode
  tone: StatusTone
  className?: string
}) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${toneClasses[tone]} ${className}`}>
      {children}
    </span>
  )
}
