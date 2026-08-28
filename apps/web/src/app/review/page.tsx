'use client'

import { useEffect, useMemo, useState } from 'react'
import { Shell } from '@/components/shell/shell'
import { ReviewStudio, type ReviewItem } from '@/components/review/review-studio'
import { useWorkspace, type ContentItem } from '@/context/workspace'

function toReviewItem(item: ContentItem): ReviewItem {
  return {
    id: item.id, title: item.title, description: item.topic, script: `Guion generado para: ${item.topic}.`,
    cta: 'Sigue la cuenta para recibir más contenido', hashtags: ['fe', 'inspiración', 'bibleshorts'],
    content_type: item.type, vertical: 'christian', status: 'REVIEW',
    scores: { quality: 88, originality: 84, safety: 96 },
    domainValidation: { passed: true, issues: [], score: 95 },
    aiReview: { passed: true, suggestions: ['Revisa el ritmo del cierre antes de publicar.'], score: 90 },
    bibleGuard: { passed: true, warnings: [], score: 95 },
    versionHistory: [{ version: 1, timestamp: new Date(item.createdAt).toLocaleString('es'), author: 'sistema', changes: 'Generación inicial' }],
    auditHistory: [{ action: 'GENERATED', timestamp: new Date(item.createdAt).toLocaleString('es'), user: 'sistema', details: 'Enviado automáticamente a revisión' }],
    platform: item.platforms.join(', '),
  }
}

export default function ReviewPage() {
  const { content, approveContent, rejectContent } = useWorkspace()
  const pending = useMemo(() => content.filter((item) => item.status === 'REVIEW'), [content])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => { if (!selectedId || !pending.some((item) => item.id === selectedId)) setSelectedId(pending[0]?.id ?? null) }, [pending, selectedId])
  useEffect(() => { const update = () => setIsMobile(window.innerWidth < 768); update(); window.addEventListener('resize', update); return () => window.removeEventListener('resize', update) }, [])
  const selected = pending.find((item) => item.id === selectedId)

  return <Shell>
    <div className="max-w-7xl mx-auto p-4 md:p-6">
      <header className="mb-5"><h1 className="text-2xl font-bold">Revisiones</h1><p className="text-sm text-textSecondary mt-1">Aprueba el contenido para que aparezca en Videos y quede disponible para programar.</p></header>
      {pending.length === 0 ? <div className="rounded-xl border border-border bg-card p-10 text-center"><p className="font-medium">No hay contenido pendiente de revisión.</p><p className="mt-1 text-sm text-textSecondary">Crea contenido o vuelve cuando se genere una nueva propuesta.</p></div> : <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
        <aside className="rounded-xl border border-border bg-card p-2 h-fit"><p className="px-2 py-2 text-xs font-semibold uppercase text-textSecondary">Cola ({pending.length})</p>{pending.map((item) => <button key={item.id} onClick={() => setSelectedId(item.id)} className={`w-full rounded-lg px-3 py-3 text-left ${selectedId === item.id ? 'bg-primary/10 text-primary' : 'hover:bg-surface-secondary'}`}><p className="text-sm font-medium truncate">{item.title}</p><p className="text-xs text-textSecondary mt-0.5">{item.type} · {item.duration}</p></button>)}</aside>
        {selected && <ReviewStudio item={toReviewItem(selected)} canReview isMobile={isMobile} onEdit={() => {}} onApprove={(item) => approveContent(item.id)} onReject={(item, reason, comment) => rejectContent(item.id, comment || reason)} />}
      </div>}
    </div>
  </Shell>
}
