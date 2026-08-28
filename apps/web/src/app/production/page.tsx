'use client'

import { Shell } from '@/components/shell/shell'
import { ModuleWorkspace } from '@/components/modules/module-workspace'

export default function ProductionPage() {
  return <Shell><ModuleWorkspace module="production" /></Shell>
}
