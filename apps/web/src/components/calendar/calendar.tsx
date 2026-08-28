'use client'

import { useState, useEffect } from 'react'
import { 
  Calendar as CalendarIcon,
  Play,
  CheckCircle2,
  Upload,
  Clock,
  Filter
} from 'lucide-react'
import { useLanguage } from '@/theme/i18n'
import { getBrandConfig } from '@/theme/branding'
import { useWorkspace } from '@/context/workspace'

type CalendarEvent = {
  id: string
  title: string
  type: 'generation' | 'review' | 'publication'
  datetime: string
  status?: string
  vertical: string
}

type CalendarView = 'today' | 'tomorrow' | 'week' | 'month'

const MOCK_EVENTS: CalendarEvent[] = [
  {
    id: '1',
    title: 'Oración de la mañana',
    type: 'generation',
    datetime: new Date().toISOString(),
    status: 'DRAFT',
    vertical: 'christian',
  },
  {
    id: '2',
    title: 'Versículo del día',
    type: 'review',
    datetime: new Date().toISOString(),
    status: 'REVIEW',
    vertical: 'christian',
  },
  {
    id: '3',
    title: 'Oración de la noche',
    type: 'publication',
    datetime: new Date().toISOString(),
    status: 'SCHEDULED',
    vertical: 'christian',
  },
]

export function Calendar({ vertical = 'christian' }: { vertical?: string }) {
  const { t } = useLanguage()
  const [view, setView] = useState<CalendarView>('month')
  const { content } = useWorkspace()
  const events: CalendarEvent[] = content.map((item) => ({
    id: item.id,
    title: item.title,
    type: item.status === 'REVIEW' ? 'review' : item.status === 'SCHEDULED' || item.status === 'PUBLISHED' ? 'publication' : 'generation',
    datetime: item.scheduledFor ?? item.createdAt,
    status: item.status,
    vertical,
  }))
  const brand = getBrandConfig(vertical)

  const getEventIcon = (type: CalendarEvent['type']) => {
    switch (type) {
      case 'generation': return <Play className="h-4 w-4 text-info" />
      case 'review': return <CheckCircle2 className="h-4 w-4 text-warning" />
      case 'publication': return <Upload className="h-4 w-4 text-success" />
    }
  }

  const getEventTypeLabel = (type: CalendarEvent['type']) => {
    switch (type) {
      case 'generation': return 'Generación'
      case 'review': return 'Revisión'
      case 'publication': return 'Publicación'
    }
  }

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-textPrimary flex items-center gap-2">
            <CalendarIcon className="h-6 w-6 text-primary" />
            {t('calendar.title') || 'Calendario'}
          </h1>
        </div>

        {/* View Selector */}
        <div className="flex items-center gap-1 bg-surface rounded-lg p-1">
          <button
            onClick={() => setView('today')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              view === 'today' ? 'bg-background text-primary shadow-sm' : 'text-textSecondary hover:text-primary'
            }`}
          >
            {t('calendar.today') || 'Hoy'}
          </button>
          <button
            onClick={() => setView('tomorrow')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              view === 'tomorrow' ? 'bg-background text-primary shadow-sm' : 'text-textSecondary hover:text-primary'
            }`}
          >
            {t('calendar.tomorrow') || 'Mañana'}
          </button>
          <button
            onClick={() => setView('week')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              view === 'week' ? 'bg-background text-primary shadow-sm' : 'text-textSecondary hover:text-primary'
            }`}
          >
            {t('calendar.week') || 'Semana'}
          </button>
          <button
            onClick={() => setView('month')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              view === 'month' ? 'bg-background text-primary shadow-sm' : 'text-textSecondary hover:text-primary'
            }`}
          >
            {t('calendar.month') || 'Mes'}
          </button>
        </div>
      </div>

      {/* Calendar Content */}
      <div className="bg-card border border-border rounded-lg p-4 md:p-6">
        {/* Desktop - Visual Calendar */}
        <div className="hidden md:block">
          {view === 'month' && <MonthView events={events} brand={brand} />}
          {view === 'week' && <WeekView events={events} brand={brand} />}
          {view === 'today' && <DayView events={events} brand={brand} title={t('calendar.today') || 'Hoy'} />}
          {view === 'tomorrow' && <DayView events={events} brand={brand} title={t('calendar.tomorrow') || 'Mañana'} />}
        </div>

        {/* Mobile - Agenda/List */}
        <div className="md:hidden">
          <div className="space-y-3">
            {events.map((event) => (
              <div
                key={event.id}
                className="flex items-start gap-3 p-3 bg-surface border border-border rounded-lg"
              >
                <div className="flex-shrink-0 mt-1">
                  {getEventIcon(event.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-textPrimary truncate">{event.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-textSecondary">
                      {getEventTypeLabel(event.type)}
                    </span>
                    <span className="text-xs text-textSecondary">·</span>
                    <span className="text-xs text-textSecondary">
                      {new Date(event.datetime).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
                {event.status && (
                  <span className="text-xs px-2 py-1 rounded bg-surface-secondary text-textSecondary">
                    {event.status}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function MonthView({ events, brand }: { events: CalendarEvent[]; brand: ReturnType<typeof getBrandConfig> }) {
  const days = Array.from({ length: 35 }, (_, i) => i + 1)
  
  return (
    <div>
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((day) => (
          <div key={day} className="text-center text-xs font-medium text-textSecondary py-2">
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => (
          <button
            key={day}
            className="aspect-square flex flex-col items-center justify-start p-1 rounded hover:bg-surface transition-colors border border-transparent hover:border-border"
          >
            <span className="text-sm text-textPrimary">{day}</span>
            <div className="mt-1 flex flex-col gap-0.5 w-full">
              {events.slice(0, 2).map((event) => (
                <div
                  key={event.id}
                  className="h-1 rounded-full"
                  style={{
                    backgroundColor: 
                      event.type === 'generation' ? brand.colors.info :
                      event.type === 'review' ? brand.colors.warning :
                      brand.colors.success
                  }}
                />
              ))}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

function WeekView({ events, brand }: { events: CalendarEvent[]; brand: ReturnType<typeof getBrandConfig> }) {
  const days = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
  
  return (
    <div className="grid grid-cols-7 gap-2">
      {days.map((day, i) => (
        <div key={day} className="border border-border rounded-lg p-2 min-h-[200px]">
          <div className="text-center text-sm font-medium text-textSecondary mb-2">{day}</div>
          <div className="space-y-1">
            {events.slice(i, i + 1).map((event) => (
              <div
                key={event.id}
                className="p-1 rounded text-xs"
                style={{
                  backgroundColor:
                    event.type === 'generation' ? `${brand.colors.info}20` :
                    event.type === 'review' ? `${brand.colors.warning}20` :
                    `${brand.colors.success}20`
                }}
              >
                <p className="font-medium truncate">{event.title}</p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function DayView({ events, brand, title }: { events: CalendarEvent[]; brand: ReturnType<typeof getBrandConfig>; title: string }) {
  return (
    <div>
      <h3 className="font-medium text-textPrimary mb-4">{title}</h3>
      <div className="space-y-2">
        {events.map((event) => (
          <div
            key={event.id}
            className="flex items-center gap-3 p-3 bg-surface border border-border rounded-lg"
          >
            <div
              className="w-1 h-12 rounded-full"
              style={{
                backgroundColor:
                  event.type === 'generation' ? brand.colors.info :
                  event.type === 'review' ? brand.colors.warning :
                  brand.colors.success
              }}
            />
            <div className="flex-1">
              <p className="font-medium text-textPrimary">{event.title}</p>
              <p className="text-sm text-textSecondary">
                {new Date(event.datetime).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
            {event.status && (
              <span className="text-xs px-2 py-1 rounded bg-surface-secondary text-textSecondary">
                {event.status}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
