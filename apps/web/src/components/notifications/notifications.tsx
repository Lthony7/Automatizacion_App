'use client'

import { useState, useEffect } from 'react'
import { 
  Bell,
  BellRing,
  Video,
  CheckCircle2,
  XCircle,
  Upload,
  AlertTriangle,
  DollarSign,
  AlertCircle,
  Settings,
  Trash2,
  Check
} from 'lucide-react'
import { useLanguage } from '@/theme/i18n'
import { getBrandConfig } from '@/theme/branding'

type NotificationType = 
  | 'video_generated'
  | 'review_pending'
  | 'video_approved'
  | 'video_rejected'
  | 'publication_succeeded'
  | 'publication_failed'
  | 'budget_reached'
  | 'system_error'

type Notification = {
  id: string
  type: NotificationType
  title: string
  message: string
  timestamp: string
  read: boolean
  vertical?: string
}

const NOTIFICATION_ICONS: Record<NotificationType, React.ReactNode> = {
  video_generated: <Video className="h-5 w-5" />,
  review_pending: <CheckCircle2 className="h-5 w-5" />,
  video_approved: <CheckCircle2 className="h-5 w-5 text-success" />,
  video_rejected: <XCircle className="h-5 w-5 text-error" />,
  publication_succeeded: <Upload className="h-5 w-5 text-success" />,
  publication_failed: <Upload className="h-5 w-5 text-error" />,
  budget_reached: <DollarSign className="h-5 w-5 text-warning" />,
  system_error: <AlertCircle className="h-5 w-5 text-error" />,
}

const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: '1',
    type: 'video_generated',
    title: 'Video generado',
    message: 'Oración de la mañana ha sido generado',
    timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    read: false,
    vertical: 'christian',
  },
  {
    id: '2',
    type: 'review_pending',
    title: 'Revisión pendiente',
    message: 'Versículo del día está listo para revisión',
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    read: false,
    vertical: 'christian',
  },
  {
    id: '3',
    type: 'video_approved',
    title: 'Video aprobado',
    message: 'Oración de la noche fue aprobado',
    timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    read: true,
    vertical: 'christian',
  },
  {
    id: '4',
    type: 'publication_succeeded',
    title: 'Publicación exitosa',
    message: 'Oración de la mañana fue publicado en YouTube',
    timestamp: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
    read: true,
    vertical: 'christian',
  },
]

export function NotificationCenter({ vertical = 'christian' }: { vertical?: string }) {
  const { t } = useLanguage()
  const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS)
  const [filter, setFilter] = useState<NotificationType | 'all'>('all')
  const brand = getBrandConfig(vertical)

  const unreadCount = notifications.filter(n => !n.read).length

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  }

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  const filteredNotifications = filter === 'all' 
    ? notifications 
    : notifications.filter(n => n.type === filter)

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Bell className="h-6 w-6 text-primary" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 h-4 w-4 bg-error rounded-full flex items-center justify-center text-xs text-white font-bold">
                {unreadCount}
              </span>
            )}
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-textPrimary">
            {t('notifications.title') || 'Notificaciones'}
          </h1>
        </div>
        <button
          onClick={markAllAsRead}
          className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border hover:border-primary transition-colors text-sm"
        >
          <Check className="h-4 w-4" />
          Marcar todas como leídas
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-2 mb-4 overflow-x-auto">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors ${
            filter === 'all' ? 'bg-primary text-white' : 'bg-surface text-textSecondary hover:text-primary'
          }`}
        >
          Todas
        </button>
        {(Object.keys(NOTIFICATION_ICONS) as NotificationType[]).map((type) => (
          <button
            key={type}
            onClick={() => setFilter(type)}
            className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors flex items-center gap-1 ${
              filter === type ? 'bg-primary text-white' : 'bg-surface text-textSecondary hover:text-primary'
            }`}
          >
            {NOTIFICATION_ICONS[type]}
            <span className="capitalize">{type.replace('_', ' ')}</span>
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {filteredNotifications.length === 0 ? (
          <div className="text-center py-12 text-textSecondary">
            <BellRing className="h-12 w-12 mx-auto mb-3 opacity-40" />
            <p>No hay notificaciones</p>
          </div>
        ) : (
          filteredNotifications.map((notification) => (
            <div
              key={notification.id}
              className={`flex items-start gap-3 p-4 rounded-lg border transition-colors ${
                notification.read ? 'bg-surface border-border' : 'bg-primary/5 border-primary/30'
              }`}
            >
              <div className="flex-shrink-0 mt-0.5">
                {NOTIFICATION_ICONS[notification.type]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-textPrimary">{notification.title}</p>
                    <p className="text-sm text-textSecondary mt-0.5">{notification.message}</p>
                  </div>
                  <span className="text-xs text-textSecondary whitespace-nowrap">
                    {new Date(notification.timestamp).toLocaleTimeString('es', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  {!notification.read && (
                    <button
                      onClick={() => markAsRead(notification.id)}
                      className="text-xs px-2 py-1 rounded bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                    >
                      Marcar como leída
                    </button>
                  )}
                  <button
                    onClick={() => deleteNotification(notification.id)}
                    className="text-xs px-2 py-1 rounded bg-error/10 text-error hover:bg-error/20 transition-colors flex items-center gap-1"
                  >
                    <Trash2 className="h-3 w-3" />
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Push Notification Settings */}
      <div className="mt-8 p-4 bg-surface border border-border rounded-lg">
        <div className="flex items-center gap-2 mb-3">
          <Settings className="h-5 w-5 text-textSecondary" />
          <h3 className="font-medium text-textPrimary">Configuración de notificaciones</h3>
        </div>
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" defaultChecked className="rounded border-border" />
            <span>Notificaciones web push</span>
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" defaultChecked className="rounded border-border" />
            <span>Notificaciones PWA</span>
          </label>
          <label className="flex items-center gap-2 text-sm opacity-60">
            <input type="checkbox" disabled className="rounded border-border" />
            <span className="text-textSecondary">Notificaciones móviles (próximamente)</span>
          </label>
        </div>
      </div>
    </div>
  )
}