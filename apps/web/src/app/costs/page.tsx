'use client'

import { useState } from 'react'
import { Shell } from '@/components/shell/shell'
import { VerticalSelector } from '@/components/shell/vertical-selector'
import { CostDashboard } from '@/components/costs/cost-dashboard'
import { LanguageProvider } from '@/theme/i18n'

function CostsPage() {
  const [vertical, setVertical] = useState('christian')

  return (
    <Shell vertical={vertical}>
      <div className="border-b border-border bg-surface px-4 py-3 flex items-center justify-between">
        <VerticalSelector
          selectedVertical={vertical}
          onVerticalChange={setVertical}
        />
      </div>
      <div className="max-w-7xl mx-auto p-4 md:p-6">
        <CostDashboard />
      </div>
    </Shell>
  )
}

export default function Page() {
  return (
    <LanguageProvider>
      <CostsPage />
    </LanguageProvider>
  )
}
