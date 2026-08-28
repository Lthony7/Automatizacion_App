'use client'

import { createContext, useContext, useEffect, useMemo, useState } from 'react'

export type ContentStatus = 'DRAFT' | 'REVIEW' | 'APPROVED' | 'REJECTED' | 'SCHEDULED' | 'PUBLISHED'

export type ContentItem = {
  id: string
  title: string
  topic: string
  type: string
  duration: string
  template: string
  vertical: string
  status: ContentStatus
  createdAt: string
  scheduledFor?: string
  platforms: string[]
  rejectionNote?: string
}

export type SocialAccount = { id: string; network: string; handle: string; connected: boolean }
export type Asset = { id: string; name: string; kind: 'Imagen' | 'Audio' | 'Video'; usable: boolean }
export type Template = { id: string; name: string; format: string; active: boolean; vertical: string }

type CreateContentInput = Pick<ContentItem, 'topic' | 'type' | 'duration' | 'template'>
type WorkspaceValue = {
  content: ContentItem[]
  socialAccounts: SocialAccount[]
  assets: Asset[]
  templates: Template[]
  activeVertical: string
  setActiveVertical: (vertical: string) => void
  createContent: (input: CreateContentInput) => void
  approveContent: (id: string) => void
  rejectContent: (id: string, note: string) => void
  scheduleContent: (id: string, platforms: string[], scheduledFor: string) => void
  publishContent: (id: string) => void
  addSocialAccount: (network: string, handle: string) => void
  toggleSocialAccount: (id: string) => void
  addAsset: (name: string, kind: Asset['kind']) => void
  addTemplate: (name: string, format: string, vertical: string) => void
}

const STORAGE_KEY = 'content-automation-workspace-v1'
const WorkspaceContext = createContext<WorkspaceValue | null>(null)

const seedContent: ContentItem[] = [
  { id: 'content-1', title: 'Oración de la mañana', topic: 'Comenzar el día con paz', type: 'Oración', duration: '0:58', template: 'Clásica', vertical: 'christian', status: 'REVIEW', createdAt: '2026-08-26T08:30:00.000Z', platforms: [] },
  { id: 'content-2', title: 'Versículo del día', topic: 'Salmos 23:1', type: 'Versículo', duration: '0:45', template: 'Minimalista', vertical: 'christian', status: 'APPROVED', createdAt: '2026-08-26T07:30:00.000Z', platforms: [] },
  { id: 'content-3', title: 'Reflexión: Confía en Dios', topic: 'La confianza en tiempos difíciles', type: 'Reflexión', duration: '1:12', template: 'Cinematográfica', vertical: 'christian', status: 'SCHEDULED', createdAt: '2026-08-25T10:00:00.000Z', scheduledFor: '2026-08-27T10:00', platforms: ['YouTube', 'Instagram'] },
  { id: 'content-4', title: 'Historia de David y Goliat', topic: 'Valentía y fe', type: 'Historia', duration: '1:30', template: 'Dinámica', vertical: 'christian', status: 'PUBLISHED', createdAt: '2026-08-24T11:00:00.000Z', platforms: ['YouTube', 'Facebook'] },
]

function titleFor(topic: string, type: string) {
  return topic.trim() || `Nuevo contenido: ${type}`
}

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const [activeVertical, setActiveVertical] = useState('christian')
  const [content, setContent] = useState(seedContent)
  const [socialAccounts, setSocialAccounts] = useState<SocialAccount[]>([
    { id: 'social-1', network: 'YouTube', handle: '@BibleShorts', connected: true },
    { id: 'social-2', network: 'Instagram', handle: '@bibleshorts', connected: true },
  ])
  const [assets, setAssets] = useState<Asset[]>([
    { id: 'asset-1', name: 'Fondo amanecer', kind: 'Imagen', usable: true },
    { id: 'asset-2', name: 'Música ambiente suave', kind: 'Audio', usable: true },
  ])
  const [templates, setTemplates] = useState<Template[]>([
    { id: 'template-1', name: 'Clásica', format: '9:16 · Oración', active: true, vertical: 'christian' },
    { id: 'template-2', name: 'Minimalista', format: '9:16 · Versículo', active: true, vertical: 'christian' },
    { id: 'template-3', name: 'Cinematográfica', format: '9:16 · Reflexión', active: true, vertical: 'christian' },
    { id: 'template-4', name: 'Diagnóstico rápido', format: '9:16 · Consejos de vehículo', active: true, vertical: 'automotive' },
    { id: 'template-5', name: 'Mantenimiento práctico', format: '9:16 · Guía automotriz', active: true, vertical: 'automotive' },
  ])

  useEffect(() => {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return
    try {
      const saved = JSON.parse(raw) as Partial<Pick<WorkspaceValue, 'content' | 'socialAccounts' | 'assets' | 'templates' | 'activeVertical'>>
      if (saved.content) setContent(saved.content.map((item) => ({ ...item, vertical: item.vertical ?? 'christian' })))
      if (saved.socialAccounts) setSocialAccounts(saved.socialAccounts)
      if (saved.assets) setAssets(saved.assets)
      if (saved.templates) setTemplates(saved.templates.map((item) => ({ ...item, vertical: item.vertical ?? 'christian' })))
      if (saved.activeVertical) setActiveVertical(saved.activeVertical)
    } catch { window.localStorage.removeItem(STORAGE_KEY) }
  }, [])

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ content, socialAccounts, assets, templates, activeVertical }))
  }, [content, socialAccounts, assets, templates, activeVertical])

  const value = useMemo<WorkspaceValue>(() => ({
    content, socialAccounts, assets, templates, activeVertical, setActiveVertical,
    createContent: ({ topic, type, duration, template }) => setContent((items) => [{
      id: `content-${Date.now()}`, title: titleFor(topic, type), topic: topic || type, type, duration: `0:${duration.padStart(2, '0')}`,
      template, vertical: activeVertical, status: 'REVIEW', createdAt: new Date().toISOString(), platforms: [],
    }, ...items]),
    approveContent: (id) => setContent((items) => items.map((item) => item.id === id ? { ...item, status: 'APPROVED' } : item)),
    rejectContent: (id, note) => setContent((items) => items.map((item) => item.id === id ? { ...item, status: 'REJECTED', rejectionNote: note } : item)),
    scheduleContent: (id, platforms, scheduledFor) => setContent((items) => items.map((item) => item.id === id ? { ...item, status: 'SCHEDULED', platforms, scheduledFor } : item)),
    publishContent: (id) => setContent((items) => items.map((item) => item.id === id ? { ...item, status: 'PUBLISHED' } : item)),
    addSocialAccount: (network, handle) => setSocialAccounts((items) => [{ id: `social-${Date.now()}`, network, handle, connected: true }, ...items]),
    toggleSocialAccount: (id) => setSocialAccounts((items) => items.map((item) => item.id === id ? { ...item, connected: !item.connected } : item)),
    addAsset: (name, kind) => setAssets((items) => [{ id: `asset-${Date.now()}`, name, kind, usable: true }, ...items]),
    addTemplate: (name, format, vertical) => setTemplates((items) => [{ id: `template-${Date.now()}`, name, format, active: true, vertical }, ...items]),
  }), [content, socialAccounts, assets, templates, activeVertical])

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>
}

export function useWorkspace() {
  const value = useContext(WorkspaceContext)
  if (!value) throw new Error('useWorkspace must be used within WorkspaceProvider')
  return value
}
