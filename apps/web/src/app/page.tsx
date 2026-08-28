'use client'

import { useState } from 'react'
import { Shell } from '@/components/shell/shell'
import { Dashboard } from '@/components/dashboard/dashboard'
import { VerticalSelector } from '@/components/shell/vertical-selector'

export default function Page() {
  const [vertical, setVertical] = useState('christian')

  return (
    <Shell vertical={vertical}>
      <div className="border-b border-border bg-surface px-4 py-3 flex items-center justify-between">
        <VerticalSelector
          selectedVertical={vertical}
          onVerticalChange={setVertical}
        />
      </div>
      <Dashboard />
    </Shell>
  )
}
