import type { ReactNode } from 'react'

export function Card({
  children,
  className = '',
  padded = true,
}: {
  children: ReactNode
  className?: string
  padded?: boolean
}) {
  return (
    <div
      className={`bg-card border border-border rounded-xl shadow-[0_2px_10px_rgb(var(--color-text-primary)/0.04)] ${padded ? 'p-4 md:p-5' : ''} ${className}`}
    >
      {children}
    </div>
  )
}

export function CardHeader({
  title,
  subtitle,
  action,
}: {
  title: string
  subtitle?: string
  action?: ReactNode
}) {
  return (
    <div className="flex items-start justify-between gap-3 mb-4">
      <div className="min-w-0">
        <h2 className="font-semibold text-textPrimary truncate">{title}</h2>
        {subtitle && <p className="text-xs text-textSecondary mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}
