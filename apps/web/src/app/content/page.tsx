'use client'

import Link from 'next/link'
import { Plus, ArrowRight } from 'lucide-react'
import { Shell } from '@/components/shell/shell'
import { useWorkspace, type ContentStatus } from '@/context/workspace'

const labels: Record<ContentStatus, string> = { DRAFT: 'Borrador', REVIEW: 'Pendiente de revisión', APPROVED: 'Aprobado', REJECTED: 'Requiere cambios', SCHEDULED: 'Programado', PUBLISHED: 'Publicado' }
const tones: Record<ContentStatus, string> = { DRAFT: 'bg-muted text-textSecondary', REVIEW: 'bg-warning/10 text-warning', APPROVED: 'bg-success/10 text-success', REJECTED: 'bg-error/10 text-error', SCHEDULED: 'bg-info/10 text-info', PUBLISHED: 'bg-primary/10 text-primary' }

export default function ContentPage() {
  const { content } = useWorkspace()
  return <Shell>
    <div className="max-w-7xl mx-auto p-4 md:p-6">
      <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><h1 className="text-2xl md:text-3xl font-bold">Contenido</h1><p className="mt-1 text-sm text-textSecondary">Aquí se centralizan las propuestas antes de su revisión, producción y publicación.</p></div><Link href="/content/generate" className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-white"><Plus className="h-4 w-4" />Crear contenido</Link></header>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 mb-5">{(['REVIEW', 'APPROVED', 'SCHEDULED', 'PUBLISHED'] as ContentStatus[]).map((status) => <div key={status} className="rounded-xl border border-border bg-card p-4"><p className="text-2xl font-bold">{content.filter((item) => item.status === status).length}</p><p className="text-xs text-textSecondary mt-1">{labels[status]}</p></div>)}</div>
      <div className="overflow-hidden rounded-xl border border-border bg-card"><div className="grid grid-cols-[1fr_auto] gap-3 border-b border-border px-4 py-3 text-xs font-semibold uppercase text-textSecondary"><span>Contenido</span><span>Estado</span></div>{content.map((item) => <div key={item.id} className="grid grid-cols-[1fr_auto] gap-3 items-center border-b border-border last:border-0 px-4 py-4"><div className="min-w-0"><p className="font-medium truncate">{item.title}</p><p className="text-xs text-textSecondary mt-1">{item.type} · {item.duration} · Plantilla {item.template}</p>{item.rejectionNote && <p className="mt-1 text-xs text-error">Motivo: {item.rejectionNote}</p>}</div><div className="flex items-center gap-3"><span className={`hidden sm:inline-flex rounded-full px-2 py-1 text-xs font-medium ${tones[item.status]}`}>{labels[item.status]}</span>{item.status === 'REVIEW' && <Link className="text-sm text-primary hover:underline" href="/review">Revisar</Link>}{item.status === 'APPROVED' && <Link className="text-sm text-primary hover:underline" href="/videos">Ver video</Link>}</div></div>)}</div>
      <div className="mt-5 flex items-center gap-2 text-sm text-textSecondary"><ArrowRight className="h-4 w-4 text-primary" />Flujo: Crear → Contenido → Revisión → Videos → Publicaciones.</div>
    </div>
  </Shell>
}
