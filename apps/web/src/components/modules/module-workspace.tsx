'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Check, Link2, Plus, Send, Upload } from 'lucide-react'
import { useWorkspace } from '@/context/workspace'

const fallback: Record<string, { title: string; description: string }> = {
  projects: { title: 'Proyectos', description: 'Agrupa contenido, marca, recursos y canales por iniciativa.' },
  ideas: { title: 'Ideas', description: 'Registra oportunidades y conviértelas en contenido desde el flujo de creación.' },
  users: { title: 'Usuarios', description: 'Administra quién crea, revisa y publica contenido.' },
  audit: { title: 'Auditoría', description: 'Consulta trazabilidad de cambios y aprobaciones.' },
  production: { title: 'Producción', description: 'Supervisa trabajos de generación y renderizado.' },
  library: { title: 'Biblioteca', description: 'Consulta los activos reutilizables y el contenido final.' },
  analytics: { title: 'Analíticas', description: 'Mide el rendimiento de publicaciones por red y formato.' },
}

export function ModuleWorkspace({ module }: { module: string }) {
  const workspace = useWorkspace()
  const [name, setName] = useState('')
  const [notice, setNotice] = useState('')
  const alert = (message: string) => { setNotice(message); setName('') }
  const connectedNetworks = workspace.socialAccounts.filter((account) => account.connected).map((account) => account.network)

  if (module === 'templates') return <Module title="Plantillas" description="Formatos base reutilizables para acelerar la producción." notice={notice}>
    <Form value={name} onChange={setName} placeholder="Nombre de la plantilla" action="Crear plantilla" onSubmit={() => name.trim() && (workspace.addTemplate(name.trim(), '9:16 · Video corto', 'christian'), alert('Plantilla base creada y disponible al generar contenido.'))} />
    <List items={workspace.templates.map((item) => ({ title: item.name, detail: `${item.format} · ${item.active ? 'Disponible' : 'Archivada'}` }))} />
  </Module>

  if (module === 'media') return <Module title="Recursos multimedia" description="Imágenes, audios y clips que pueden utilizarse en nuevas producciones." notice={notice}>
    <Form value={name} onChange={setName} placeholder="Nombre del recurso" action="Añadir recurso" icon={<Upload className="h-4 w-4" />} onSubmit={() => name.trim() && (workspace.addAsset(name.trim(), 'Imagen'), alert('Recurso añadido a la biblioteca de producción.'))} />
    <List items={workspace.assets.map((item) => ({ title: item.name, detail: `${item.kind} · ${item.usable ? 'Listo para usar' : 'En procesamiento'}` }))} />
  </Module>

  if (module === 'social-accounts') return <Module title="Redes sociales" description="Conecta los canales autorizados para sincronizar y publicar contenido." notice={notice}>
    <Form value={name} onChange={setName} placeholder="Usuario o identificador de cuenta" action="Conectar cuenta" icon={<Link2 className="h-4 w-4" />} onSubmit={() => name.trim() && (workspace.addSocialAccount('Nueva red', name.trim()), alert('Cuenta conectada. Ya puede seleccionarse al programar publicaciones.'))} />
    <div className="divide-y divide-border rounded-xl border border-border bg-card">{workspace.socialAccounts.map((account) => <div key={account.id} className="flex items-center justify-between gap-3 p-4"><div><p className="font-medium">{account.network}</p><p className="text-xs text-textSecondary">{account.handle}</p></div><button onClick={() => workspace.toggleSocialAccount(account.id)} className={`rounded-lg px-3 py-2 text-sm ${account.connected ? 'bg-success/10 text-success' : 'bg-muted text-textSecondary'}`}>{account.connected ? 'Sincronizada' : 'Reconectar'}</button></div>)}</div>
  </Module>

  if (module === 'publications') return <Module title="Publicaciones" description="Programa videos aprobados en las redes sociales conectadas." notice={notice}>
    {workspace.content.filter((item) => ['APPROVED', 'SCHEDULED', 'PUBLISHED'].includes(item.status)).map((item) => <div key={item.id} className="mb-3 rounded-xl border border-border bg-card p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-medium">{item.title}</p><p className="text-xs text-textSecondary mt-1">{item.platforms.length ? `${item.platforms.join(', ')} · ${item.scheduledFor ? new Date(item.scheduledFor).toLocaleString('es') : 'Publicado'}` : 'Aprobado y pendiente de programación'}</p></div>{item.status === 'APPROVED' ? <button disabled={!connectedNetworks.length} onClick={() => { workspace.scheduleContent(item.id, connectedNetworks, new Date(Date.now() + 86400000).toISOString().slice(0, 16)); alert('Publicación programada para mañana en las redes sincronizadas.') }} className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm text-white disabled:opacity-50"><Send className="h-4 w-4" />Programar</button> : item.status === 'SCHEDULED' ? <button onClick={() => { workspace.publishContent(item.id); alert('Publicación marcada como sincronizada correctamente.') }} className="rounded-lg border border-primary px-3 py-2 text-sm text-primary">Publicar ahora</button> : <span className="text-sm text-success">Publicada</span>}</div>)}
    {!workspace.content.some((item) => item.status === 'APPROVED') && <p className="rounded-xl border border-dashed border-border p-6 text-sm text-textSecondary">Aprueba un video desde Revisiones para programarlo aquí.</p>}
  </Module>

  const config = fallback[module] ?? { title: 'Módulo', description: 'Espacio de trabajo del proyecto.' }
  return <Module title={config.title} description={config.description} notice={notice}><div className="rounded-xl border border-border bg-card p-6"><p className="text-sm text-textSecondary">Este módulo se conecta con el flujo central del proyecto. Para crear una nueva propuesta, inicia en Contenido; su avance quedará disponible en Revisión, Videos y Publicaciones.</p><Link href="/content/generate" className="mt-4 inline-flex rounded-lg bg-primary px-3 py-2 text-sm text-white">Crear contenido</Link></div></Module>
}

function Module({ title, description, notice, children }: { title: string; description: string; notice: string; children: React.ReactNode }) { return <div className="max-w-5xl mx-auto p-4 md:p-6"><header className="mb-6"><h1 className="text-2xl md:text-3xl font-bold">{title}</h1><p className="mt-1 text-sm text-textSecondary">{description}</p></header>{notice && <p className="mb-4 flex items-center gap-2 rounded-lg border border-success/30 bg-success/10 p-3 text-sm text-success"><Check className="h-4 w-4" />{notice}</p>}{children}</div> }
function Form({ value, onChange, placeholder, action, onSubmit, icon = <Plus className="h-4 w-4" /> }: { value: string; onChange: (value: string) => void; placeholder: string; action: string; onSubmit: () => void; icon?: React.ReactNode }) { return <form onSubmit={(event) => { event.preventDefault(); onSubmit() }} className="mb-4 flex flex-col gap-2 sm:flex-row"><input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="h-10 flex-1 rounded-lg border border-border bg-surface px-3 text-sm" /><button className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm text-white">{icon}{action}</button></form> }
function List({ items }: { items: Array<{ title: string; detail: string }> }) { return <div className="divide-y divide-border rounded-xl border border-border bg-card">{items.map((item, index) => <div key={`${item.title}-${index}`} className="p-4"><p className="font-medium">{item.title}</p><p className="mt-1 text-xs text-textSecondary">{item.detail}</p></div>)}</div> }
