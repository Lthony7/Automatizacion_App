'use client'

import {
  LayoutDashboard,
  FolderKanban,
  FileText,
  Lightbulb,
  Calendar,
  Eye,
  Video,
  Image,
  LayoutTemplate,
  Share2,
  Send,
  BarChart3,
  Wallet,
  Settings as SettingsIcon,
  Users,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react'
import { Shell } from '@/components/shell/shell'
import { VerticalSelector } from '@/components/shell/vertical-selector'
import { LanguageProvider } from '@/theme/i18n'
import { useVerticalMetadata } from '@/hooks/use-vertical-metadata'
import type { NavIcon } from '@/lib/vertical-metadata'

const iconMap: Record<NavIcon, React.ComponentType<{ className?: string }>> = {
  'layout-dashboard': LayoutDashboard,
  'folder-kanban': FolderKanban,
  'file-text': FileText,
  lightbulb: Lightbulb,
  calendar: Calendar,
  eye: Eye,
  video: Video,
  image: Image,
  'layout-template': LayoutTemplate,
  'share-2': Share2,
  send: Send,
  'bar-chart-3': BarChart3,
  wallet: Wallet,
  settings: SettingsIcon,
  users: Users,
  'shield-check': ShieldCheck,
}

function MorePageInner() {
  const { metadata } = useVerticalMetadata('christian')

  if (!metadata) {
    return (
      <Shell vertical="christian">
        <div className="max-w-3xl mx-auto p-4 md:p-6 space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-14 rounded-lg bg-muted animate-pulse border border-border" />
          ))}
        </div>
      </Shell>
    )
  }

  return (
    <Shell vertical={metadata.id}>
      <div className="max-w-3xl mx-auto p-4 md:p-6">
        <h1 className="text-2xl md:text-3xl font-bold text-textPrimary mb-6">Más</h1>
        <div className="bg-card border border-border rounded-lg divide-y divide-border">
          {metadata.nav
            .filter((n) => n.group === 'secondary')
            .map((item) => {
              const Icon = iconMap[item.icon] ?? FileText
              return (
                <a
                  key={item.id}
                  href={item.href}
                  className="flex items-center justify-between p-4 hover:bg-surface transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-surface-secondary">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <span className="font-medium text-textPrimary">{item.defaultLabel}</span>
                  </div>
                  <ChevronRight className="h-5 w-5 text-textSecondary" />
                </a>
              )
            })}
        </div>
        <p className="text-xs text-textSecondary mt-4 text-center">
          Navegación proporcionada por el backend — vertical activo: {metadata.displayName}
        </p>
      </div>
    </Shell>
  )
}

export default function Page() {
  return (
    <LanguageProvider>
      <MorePageInner />
    </LanguageProvider>
  )
}
