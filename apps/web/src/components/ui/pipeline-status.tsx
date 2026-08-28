'use client'

import {
  FileText,
  Sparkles,
  Mic,
  Film,
  Eye,
  CheckCircle,
  Calendar,
  Send,
} from 'lucide-react'
import type { ComponentType } from 'react'

export type PipelineState =
  | 'DRAFT'
  | 'GENERATING'
  | 'VALIDATING'
  | 'RENDERING'
  | 'REVIEW'
  | 'APPROVED'
  | 'SCHEDULED'
  | 'PUBLISHED'

export type PipelineCounts = Partial<Record<PipelineState, number>>

const steps: Array<{
  state: PipelineState
  labelKey: string
  icon: ComponentType<{ className?: string }>
}> = [
  { state: 'DRAFT', labelKey: 'dashboard.statusDRAFT', icon: FileText },
  { state: 'GENERATING', labelKey: 'dashboard.statusGENERATING', icon: Sparkles },
  { state: 'VALIDATING', labelKey: 'dashboard.statusVALIDATING', icon: CheckCircle },
  { state: 'RENDERING', labelKey: 'dashboard.statusRENDERING', icon: Film },
  { state: 'REVIEW', labelKey: 'dashboard.statusREVIEW', icon: Eye },
  { state: 'APPROVED', labelKey: 'dashboard.statusAPPROVED', icon: CheckCircle },
  { state: 'SCHEDULED', labelKey: 'dashboard.statusSCHEDULED', icon: Calendar },
  { state: 'PUBLISHED', labelKey: 'dashboard.statusPUBLISHED', icon: Send },
]

/** Visual production pipeline: DRAFT → … → PUBLISHED with per-state counts. */
export function PipelineStatus({
  counts,
  labels,
}: {
  /** count per pipeline state */
  counts: Partial<Record<PipelineState, number>>
  /** translated labels keyed by `dashboard.statusXXX` */
  labels: Record<string, string>
}) {
  const toneFor = (state: PipelineState): string => {
    if ((counts[state] ?? 0) > 0) {
      switch (state) {
        case 'PUBLISHED':
          return 'bg-primary/10 border-primary/40 text-primary'
        case 'APPROVED':
          return 'bg-success/10 border-success/40 text-success'
        case 'REVIEW':
          return 'bg-warning/10 border-warning/40 text-warning'
        case 'SCHEDULED':
          return 'bg-secondary/10 border-secondary/40 text-primary'
        default:
          return 'bg-info/5 border-info/30 text-info'
      }
    }
    return 'bg-surface border-border text-textSecondary'
  }

  return (
    <ol className="flex items-stretch gap-1.5 overflow-x-auto pb-1" aria-label="Pipeline de producción">
      {steps.map(({ state, labelKey, icon: Icon }, i) => (
        <li key={state} className="flex items-center min-w-fit">
          <div
            className={`flex flex-col items-center rounded-lg border px-2.5 py-2 min-w-[76px] ${toneFor(state)}`}
          >
            <Icon className="h-4 w-4 mb-1" aria-hidden />
            <span className="text-[11px] font-medium leading-tight text-center whitespace-nowrap">
              {labels[labelKey] ?? state}
            </span>
            <span className="text-sm font-bold mt-0.5">{counts[state] ?? 0}</span>
          </div>
          {i < steps.length - 1 && (
            <span className="mx-0.5 text-border select-none" aria-hidden>
              →
            </span>
          )}
        </li>
      ))}
    </ol>
  )
}
