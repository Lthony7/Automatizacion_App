'use client'

import {
  AlertTriangle,
  BarChart3,
  Bot,
  CalendarDays,
  CheckCircle2,
  DollarSign,
  Film,
  HardDrive,
  Mic,
  PauseCircle,
  Plug,
  Video,
  Wallet,
} from 'lucide-react'
import { useLanguage } from '@/theme/i18n'

// ---------------------------------------------------------------------------
// Isolated mock data (temporary until backend endpoints exist)
// ---------------------------------------------------------------------------

type Category = 'ai' | 'tts' | 'storage' | 'rendering' | 'api_calls'

const CATEGORY_META: Record<Category, { labelEs: string; icon: typeof Bot; color: string }> = {
  ai: { labelEs: 'IA', icon: Bot, color: 'rgb(var(--color-primary))' },
  tts: { labelEs: 'TTS', icon: Mic, color: 'rgb(var(--color-info))' },
  storage: { labelEs: 'Almacenamiento', icon: HardDrive, color: 'rgb(var(--color-warning))' },
  rendering: { labelEs: 'Rendering', icon: Film, color: 'rgb(var(--color-success))' },
  api_calls: { labelEs: 'API calls', icon: Plug, color: 'rgb(var(--color-secondary))' },
}

const MOCK_KPIS = {
  todayUsd: 3.42,
  monthUsd: 78.16,
  perVideoUsd: 0.61,
  videosToday: 3,
}

const MOCK_BY_CATEGORY: Array<{ category: Category; usd: number }> = [
  { category: 'ai', usd: 41.2 },
  { category: 'rendering', usd: 18.4 },
  { category: 'tts', usd: 11.9 },
  { category: 'api_calls', usd: 4.1 },
  { category: 'storage', usd: 2.56 },
]

const MOCK_BY_PROVIDER = [
  { provider: 'Gemini', category: 'ai' as Category, usd: 28.7 },
  { provider: 'ElevenLabs', category: 'tts' as Category, usd: 11.9 },
  { provider: 'FFmpeg', category: 'rendering' as Category, usd: 18.4 },
  { provider: 'Groq', category: 'ai' as Category, usd: 12.5 },
  { provider: 'S3', category: 'storage' as Category, usd: 2.56 },
  { provider: 'YouTube API', category: 'api_calls' as Category, usd: 2.3 },
]

const MOCK_RECENT = [
  { id: 'r1', time: '21:04', content: 'Oración de la noche', category: 'rendering' as Category, usd: 0.09 },
  { id: 'r2', time: '21:03', content: 'Oración de la noche', category: 'tts' as Category, usd: 0.18 },
  { id: 'r3', time: '21:02', content: 'Oración de la noche', category: 'ai' as Category, usd: 0.41 },
  { id: 'r4', time: '17:05', content: 'Salmo 23 animado', category: 'rendering' as Category, usd: 0.11 },
  { id: 'r5', time: '17:04', content: 'Salmo 23 animado', category: 'ai' as Category, usd: 0.52 },
]

interface LimitRow {
  scopeLabel: string
  kindLabel: string
  used: number
  value: number
  unit: string
}

const MONTH_BUDGET = 120

function limitsFor(): LimitRow[] {
  const monthPct = (MOCK_KPIS.monthUsd / MONTH_BUDGET) * 100
  return [
    { scopeLabel: 'Tenant · BibleShorts', kindLabel: 'daily_video_limit', used: MOCK_KPIS.videosToday, value: 5, unit: '' },
    { scopeLabel: 'Tenant · BibleShorts', kindLabel: 'monthly_budget_usd', used: MOCK_KPIS.monthUsd, value: MONTH_BUDGET, unit: ' USD' },
    { scopeLabel: 'Proyecto · bible-shorts', kindLabel: 'daily_budget_usd', used: MOCK_KPIS.todayUsd, value: 15, unit: ' USD' },
    { scopeLabel: 'Proveedor · Gemini', kindLabel: 'monthly_budget_usd', used: 28.7, value: Math.round((MONTH_BUDGET * Math.max(monthPct, 25)) / 100), unit: ' USD' },
  ]
}

function limitState(pct: number): { key: 'ok' | 'warn' | 'over'; label: string; classes: string } {
  if (pct >= 100) return { key: 'over', label: 'Excedido', classes: 'bg-error/10 text-error border-error/30' }
  if (pct >= 80) return { key: 'warn', label: 'Cerco del límite', classes: 'bg-warning/10 text-warning border-warning/30' }
  return { key: 'ok', label: 'OK', classes: 'bg-success/10 text-success border-success/30' }
}

function fmt(usd: number): string {
  return `$${usd.toFixed(2)}`
}

// ---------------------------------------------------------------------------

export function CostDashboard() {
  const { t } = useLanguage()
  const limits = limitsFor()
  const monthlyPct = (MOCK_KPIS.monthUsd / MONTH_BUDGET) * 100
  const generationPaused = limits.some((l) => l.used >= l.value)
  const totalCategory = MOCK_BY_CATEGORY.reduce((a, c) => a + c.usd, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-textPrimary">
            {t('costs.title', 'Costos')}
          </h1>
          <p className="text-sm text-textSecondary mt-1">
            {t('costs.subtitle', 'Control de gasto por IA, TTS, almacenamiento, rendering y llamadas API')}
          </p>
        </div>
        <div
          className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium w-fit ${
            generationPaused
              ? 'border-error/30 bg-error/10 text-error'
              : 'border-success/30 bg-success/10 text-success'
          }`}
        >
          {generationPaused ? <PauseCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
          {generationPaused
            ? t('costs.paused', 'Generación automática pausada')
            : t('costs.active', 'Generación automática activa')}
        </div>
      </div>

      {/* Pause banner */}
      {generationPaused && (
        <div className="flex items-start gap-3 rounded-lg border border-error/30 bg-error/10 p-4">
          <AlertTriangle className="h-5 w-5 text-error shrink-0 mt-0.5" />
          <p className="text-sm text-textPrimary">
            {t(
              'costs.pauseBanner',
              'Se alcanzó un límite de costo: se detuvo la generación automática, se registró el evento de auditoría y se notificó al administrador.',
            )}
          </p>
        </div>
      )}

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: t('costs.today', 'Costo hoy'), value: fmt(MOCK_KPIS.todayUsd), icon: CalendarDays },
          { label: t('costs.month', 'Costo del mes'), value: `${fmt(MOCK_KPIS.monthUsd)} / ${fmt(MONTH_BUDGET)}`, icon: Wallet },
          { label: t('costs.perVideo', 'Costo por video'), value: fmt(MOCK_KPIS.perVideoUsd), icon: Video },
          { label: t('costs.budgetUsed', 'Presupuesto usado'), value: `${monthlyPct.toFixed(0)}%`, icon: BarChart3 },
        ].map((kpi) => {
          const Icon = kpi.icon
          return (
            <div key={kpi.label} className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium uppercase tracking-wide text-textSecondary">{kpi.label}</span>
                <Icon className="h-4 w-4 text-primary" />
              </div>
              <p className="mt-2 text-xl md:text-2xl font-bold text-textPrimary">{kpi.value}</p>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Limits */}
        <section className="bg-card border border-border rounded-lg p-4 md:p-6">
          <h2 className="font-semibold text-textPrimary mb-4">
            {t('costs.limitsTitle', 'Límites y estado')}
          </h2>
          <div className="space-y-4">
            {limits.map((l) => {
              const pct = l.value > 0 ? (l.used / l.value) * 100 : 0
              const state = limitState(pct)
              return (
                <div key={`${l.scopeLabel}-${l.kindLabel}`}>
                  <div className="flex items-center justify-between mb-1.5 gap-2">
                    <span className="text-sm text-textPrimary truncate">{l.kindLabel}</span>
                    <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-medium ${state.classes}`}>
                      {state.label}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden" role="presentation">
                    <div
                      className={`h-full rounded-full ${
                        state.key === 'over' ? 'bg-error' : state.key === 'warn' ? 'bg-warning' : 'bg-success'
                      }`}
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>
                  <div className="mt-1 flex justify-between text-xs text-textSecondary">
                    <span>{l.scopeLabel}</span>
                    <span>
                      {l.used}{l.unit} / {l.value}{l.unit}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* Breakdown by category */}
        <section className="bg-card border border-border rounded-lg p-4 md:p-6">
          <h2 className="font-semibold text-textPrimary mb-4">
            {t('costs.byCategory', 'Gasto por categoría')} · {fmt(totalCategory)}
          </h2>
          <div className="space-y-3">
            {MOCK_BY_CATEGORY.map(({ category, usd }) => {
              const meta = CATEGORY_META[category]
              const Icon = meta.icon
              const pct = (usd / totalCategory) * 100
              return (
                <div key={category}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="flex items-center gap-2 text-sm text-textPrimary">
                      <Icon className="h-4 w-4" style={{ color: meta.color }} />
                      {meta.labelEs}
                    </span>
                    <span className="text-sm font-medium text-textPrimary">
                      {fmt(usd)} <span className="text-textSecondary">({pct.toFixed(0)}%)</span>
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden" role="presentation">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: meta.color }} />
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      </div>

      {/* By provider */}
      <section className="bg-card border border-border rounded-lg divide-y divide-border">
        <div className="hidden md:flex px-4 py-3 text-xs font-semibold uppercase tracking-wide text-textSecondary">
          <span className="flex-1">{t('costs.provider', 'Proveedor')}</span>
          <span className="w-32">Categoría</span>
          <span className="w-24 text-right">USD</span>
        </div>
        {MOCK_BY_PROVIDER.map((row) => {
          const meta = CATEGORY_META[row.category]
          return (
            <div key={row.provider} className="flex flex-col md:flex-row md:items-center gap-1 md:gap-0 px-4 py-3 hover:bg-surface transition-colors">
              <span className="flex-1 font-medium text-textPrimary">{row.provider}</span>
              <span className="md:w-32 text-sm text-textSecondary">{meta.labelEs}</span>
              <span className="md:w-24 text-sm font-medium text-textPrimary md:text-right">{fmt(row.usd)}</span>
            </div>
          )
        })}
      </section>

      {/* Recent records */}
      <section className="bg-card border border-border rounded-lg divide-y divide-border">
        <div className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-textSecondary">
          {t('costs.recent', 'Registros recientes')}
        </div>
        {MOCK_RECENT.map((row) => {
          const meta = CATEGORY_META[row.category]
          const Icon = meta.icon
          return (
            <div key={row.id} className="flex items-center gap-3 px-4 py-3">
              <span className="text-xs text-textSecondary tabular-nums w-10 shrink-0">{row.time}</span>
              <Icon className="h-4 w-4 shrink-0" style={{ color: meta.color }} />
              <span className="flex-1 min-w-0 truncate text-sm text-textPrimary">{row.content}</span>
              <span className="text-sm font-medium text-textPrimary shrink-0">{fmt(row.usd)}</span>
            </div>
          )
        })}
      </section>
    </div>
  )
}
