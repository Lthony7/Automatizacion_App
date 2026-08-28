'use client'

import { useState } from 'react'
import { Shell } from '@/components/shell/shell'
import { NotificationCenter } from '@/components/notifications/notifications'
import { VerticalSelector } from '@/components/shell/vertical-selector'
import { LanguageProvider } from '@/theme/i18n'

function NotificationsPage() {
  const [vertical, setVertical] = useState('christian')

  return (
    <Shell vertical={vertical}>
      <div className="border-b border-border bg-surface px-4 py-3 flex items-center justify-between">
        <VerticalSelector
          selectedVertical={vertical}
          onVerticalChange={setVertical}
        />
      </div>
      <NotificationCenter vertical={vertical} />
    </Shell>
  )
}

export default function Page() {
  return (
    <LanguageProvider>
      <NotificationsPage />
    </LanguageProvider>
  )
}
