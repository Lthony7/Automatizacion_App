'use client'

import { useParams } from 'next/navigation'
import { Shell } from '@/components/shell/shell'
import { ModuleWorkspace } from '@/components/modules/module-workspace'

export default function ModulePage() {
  const params = useParams<{ module: string }>()
  return <Shell><ModuleWorkspace module={params.module} /></Shell>
}
