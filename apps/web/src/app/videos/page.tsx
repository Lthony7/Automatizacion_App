'use client'

import Link from 'next/link'
import { Play, Video as VideoIcon } from 'lucide-react'
import { Shell } from '@/components/shell/shell'
import { useWorkspace } from '@/context/workspace'

export default function VideosPage() {
  const { content } = useWorkspace()
  const videos = content.filter((item) => ['APPROVED', 'SCHEDULED', 'PUBLISHED'].includes(item.status))
  return <Shell><div className="max-w-7xl mx-auto p-4 md:p-6">
    <header className="mb-5"><h1 className="text-2xl font-bold">Videos</h1><p className="mt-1 text-sm text-textSecondary">Videos aprobados y listos para programar o ya publicados.</p></header>
    {videos.length === 0 ? <div className="rounded-xl border border-border bg-card p-10 text-center"><VideoIcon className="h-8 w-8 mx-auto text-textSecondary" /><p className="mt-3 font-medium">Aún no hay videos aprobados.</p><Link href="/review" className="mt-2 inline-block text-sm text-primary hover:underline">Ir a revisiones</Link></div> : <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">{videos.map((item) => <article key={item.id} className="overflow-hidden rounded-xl border border-border bg-card"><div className="aspect-video bg-gradient-to-br from-primary/30 to-secondary/30 flex items-center justify-center"><span className="rounded-full bg-black/30 p-3 text-white"><Play className="h-5 w-5" /></span></div><div className="p-4"><h2 className="font-medium truncate">{item.title}</h2><p className="mt-1 text-xs text-textSecondary">{item.type} · {item.duration}</p><div className="mt-3 flex items-center justify-between"><span className="rounded-full bg-success/10 px-2 py-1 text-xs text-success">{item.status === 'APPROVED' ? 'Listo para publicar' : item.status === 'SCHEDULED' ? 'Programado' : 'Publicado'}</span><Link href="/publications" className="text-sm text-primary hover:underline">{item.status === 'APPROVED' ? 'Programar' : 'Ver publicación'}</Link></div></div></article>)}</div>}
  </div></Shell>
}
