'use client'

import { useState, useEffect } from 'react'
import { Check, Save, Key, Plus, Trash2, RefreshCw, Eye, EyeOff, AlertTriangle } from 'lucide-react'
import { Shell } from '@/components/shell/shell'

interface ApiKeyItem {
  id: string
  prefix: string
  permissions: string[]
  status: string
  lastUsedAt: string | null
  createdAt: string
}

export default function SettingsPage() {
  const [saved, setSaved] = useState(false)
  const [notifications, setNotifications] = useState(true)

  // API Keys state
  const [apiKeys, setApiKeys] = useState<ApiKeyItem[]>([])
  const [loadingKeys, setLoadingKeys] = useState(true)
  const [newKeyRaw, setNewKeyRaw] = useState<string | null>(null)
  const [showNewKey, setShowNewKey] = useState(false)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchKeys = async () => {
    setLoadingKeys(true)
    try {
      const res = await fetch('/api/api-keys', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token') ?? ''}` },
      })
      if (res.ok) {
        const data = await res.json()
        setApiKeys(Array.isArray(data) ? data : data.data ?? [])
      }
    } catch {
      // Silent — keys list is optional
    } finally {
      setLoadingKeys(false)
    }
  }

  useEffect(() => { fetchKeys() }, [])

  const createKey = async () => {
    setCreating(true)
    setError(null)
    try {
      const res = await fetch('/api/api-keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token') ?? ''}`,
        },
        body: JSON.stringify({ permissions: ['content:read', 'content:write', 'ai:generate'] }),
      })
      const data = await res.json()
      if (res.ok && data?.data?.rawKey) {
        setNewKeyRaw(data.data.rawKey)
        setShowNewKey(true)
        fetchKeys()
      } else {
        setError(data?.message ?? 'Error al crear API key')
      }
    } catch {
      setError('Error de conexión')
    } finally {
      setCreating(false)
    }
  }

  const revokeKey = async (id: string) => {
    if (!confirm('¿Revocar esta API key? No podrás recuperarla.')) return
    try {
      await fetch(`/api/api-keys/${id}/revoke`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('token') ?? ''}` },
      })
      fetchKeys()
    } catch {
      // silent
    }
  }

  const save = () => {
    setSaved(true)
    window.setTimeout(() => setSaved(false), 2500)
  }

  return (
    <Shell>
      <div className="max-w-3xl mx-auto p-4 md:p-6">
        <header className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-textPrimary">Configuración</h1>
          <p className="mt-1 text-sm text-textSecondary">Personaliza las preferencias de tu espacio de trabajo.</p>
        </header>

        <div className="space-y-4">
          {/* API Keys */}
          <section className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Key className="h-5 w-5 text-primary" />
                <h2 className="font-semibold text-textPrimary">API Keys</h2>
              </div>
              <button
                onClick={createKey}
                disabled={creating}
                className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                <Plus className="h-4 w-4" />
                {creating ? 'Creando...' : 'Crear API Key'}
              </button>
            </div>
            <p className="mt-1 text-sm text-textSecondary">
              Usa estas claves para autenticar solicitudes a la API y configurar proveedores de IA.
            </p>

            {error && (
              <div className="mt-3 flex items-center gap-2 rounded-lg bg-error/10 px-3 py-2 text-sm text-error">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            {/* New key display (shown once after creation) */}
            {newKeyRaw && showNewKey && (
              <div className="mt-4 rounded-lg border border-warning bg-warning/5 p-4">
                <p className="text-sm font-medium text-warning mb-2">
                  Tu API key ha sido creada. Cópiala ahora — no podrás verla de nuevo.
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 rounded bg-surface-secondary px-3 py-2 text-sm font-mono break-all text-textPrimary">
                    {newKeyRaw}
                  </code>
                  <button
                    onClick={() => { navigator.clipboard.writeText(newKeyRaw); }}
                    className="shrink-0 h-8 px-3 rounded-lg border border-border text-sm hover:bg-muted transition-colors"
                  >
                    Copiar
                  </button>
                </div>
                <button
                  onClick={() => { setNewKeyRaw(null); setShowNewKey(false); }}
                  className="mt-2 text-xs text-textSecondary hover:text-textPrimary"
                >
                  Cerrar
                </button>
              </div>
            )}

            {/* Keys list */}
            {loadingKeys ? (
              <p className="mt-4 text-sm text-textSecondary">Cargando...</p>
            ) : apiKeys.length === 0 ? (
              <p className="mt-4 text-sm text-textSecondary">No hay API keys creadas.</p>
            ) : (
              <div className="mt-4 space-y-2">
                {apiKeys.map((key) => (
                  <div key={key.id} className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
                    <div className="min-w-0">
                      <p className="text-sm font-mono text-textPrimary">{key.prefix}...</p>
                      <p className="text-xs text-textSecondary">
                        {key.status === 'active' ? 'Activa' : 'Revocada'}
                        {key.lastUsedAt ? ` · Último uso: ${new Date(key.lastUsedAt).toLocaleDateString()}` : ''}
                      </p>
                    </div>
                    {key.status === 'active' && (
                      <button
                        onClick={() => revokeKey(key.id)}
                        className="shrink-0 p-2 rounded-lg text-error hover:bg-error/10 transition-colors"
                        title="Revocar"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Existing settings */}
          <section className="rounded-xl border border-border bg-card p-5">
            <h2 className="font-semibold text-textPrimary">Idioma</h2>
            <p className="mt-1 text-sm text-textSecondary">La interfaz está configurada en español.</p>
            <span className="mt-4 inline-flex rounded-lg border border-primary bg-primary/10 px-3 py-2 text-sm font-medium text-primary">Español</span>
          </section>

          <section className="rounded-xl border border-border bg-card p-5">
            <h2 className="font-semibold text-textPrimary">Notificaciones</h2>
            <label className="mt-4 flex cursor-pointer items-center justify-between gap-4">
              <span>
                <span className="block text-sm font-medium text-textPrimary">Avisos del proyecto</span>
                <span className="block text-sm text-textSecondary">Recibe alertas sobre revisiones y publicaciones.</span>
              </span>
              <input checked={notifications} onChange={(event) => setNotifications(event.target.checked)} type="checkbox" className="h-5 w-5 accent-primary" />
            </label>
          </section>

          <section className="rounded-xl border border-border bg-card p-5">
            <h2 className="font-semibold text-textPrimary">Marca y permisos</h2>
            <p className="mt-1 text-sm text-textSecondary">La identidad de BibleShorts y los permisos de administrador están activos.</p>
          </section>
        </div>

        <button onClick={save} className="mt-6 inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-white hover:bg-primary/90 focus-ring">
          {saved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
          {saved ? 'Cambios guardados' : 'Guardar cambios'}
        </button>
      </div>
    </Shell>
  )
}
