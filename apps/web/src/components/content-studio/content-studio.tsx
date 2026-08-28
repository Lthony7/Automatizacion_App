'use client'

import { useState } from 'react'
import {
  Sparkles,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from 'lucide-react'
import { useLanguage } from '@/theme/i18n'
import { apiFetch, getAuthToken } from '@/lib/api-client'

type ContentType = {
  id: string
  label: string
  description: string
  templateName: string
}

const CONTENT_TYPES: ContentType[] = [
  { id: 'prayer', label: 'Oración de la mañana', description: 'Oración para comenzar el día', templateName: 'morning_prayer' },
  { id: 'prayer', label: 'Oración de la noche', description: 'Oración para terminar el día', templateName: 'night_prayer' },
  { id: 'prayer', label: 'Oración de protección', description: 'Oración de protección divina', templateName: 'protection_prayer' },
  { id: 'prayer', label: 'Oración por familia', description: 'Oración por la familia', templateName: 'family_prayer' },
  { id: 'prayer', label: 'Oración por hijos', description: 'Oración por los hijos', templateName: 'children_prayer' },
  { id: 'prayer', label: 'Oración por trabajo', description: 'Oración por el trabajo', templateName: 'work_prayer' },
  { id: 'prayer', label: 'Oración de fortaleza', description: 'Oración de fortaleza espiritual', templateName: 'strength_prayer' },
  { id: 'prayer', label: 'Oración de esperanza', description: 'Oración de esperanza', templateName: 'hope_prayer' },
  { id: 'prayer', label: 'Oración de agradecimiento', description: 'Oración de gratitud', templateName: 'thanksgiving_prayer' },
  { id: 'verse', label: 'Versículo del día', description: 'Versículo bíblico del día', templateName: 'daily_verse' },
  { id: 'verse', label: 'Salmos', description: 'Salmos bíblicos', templateName: 'psalm' },
  { id: 'verse', label: 'Proverbios', description: 'Proverbios bíblicos', templateName: 'proverb' },
  { id: 'reflection', label: 'Reflexión bíblica', description: 'Reflexión sobre la biblia', templateName: 'bible_reflection' },
  { id: 'story', label: 'Historia bíblica', description: 'Historia de la biblia', templateName: 'bible_story' },
  { id: 'story', label: 'Personaje bíblico', description: 'Personaje de la biblia', templateName: 'bible_character' },
  { id: 'story', label: 'Parábola', description: 'Parábola de Jesús', templateName: 'parable' },
  { id: 'teaching', label: 'Enseñanza cristiana', description: 'Enseñanza cristiana', templateName: 'christian_teaching' },
  { id: 'teaching', label: 'Ánimo cristiano', description: 'Mensaje de ánimo cristiano', templateName: 'christian_encouragement' },
]

type ContentStudioProps = {
  vertical: string
  project?: string
}

export function ContentStudio({ vertical, project = 'bible-shorts' }: ContentStudioProps) {
  const { t } = useLanguage()
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [topic, setTopic] = useState('')
  const [tone, setTone] = useState('inspirational')
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<string | null>(null)
  const [tokensUsed, setTokensUsed] = useState<number | null>(null)
  const [cost, setCost] = useState<number | null>(null)

  const selectedType = CONTENT_TYPES[selectedIndex]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!getAuthToken()) {
      setError('No hay sesión activa. Inicia sesión primero desde la API o registra un usuario.')
      return
    }

    setIsGenerating(true)
    setError(null)
    setResult(null)
    setTokensUsed(null)
    setCost(null)

    try {
      const variables: Record<string, string> = {
        tono: tone,
        duracion_minutos: '2',
      }

      if (topic.trim()) {
        variables.tema_principal = topic.trim()
      }

      if (selectedType.id === 'verse') {
        variables.tema_fecha = topic.trim() || 'la fe'
        variables.fecha = new Date().toLocaleDateString('es-ES')
        variables.longitud_reflexion = '100'
        variables.tema_sugerido = topic.trim() || 'esperanza'
      }

      if (selectedType.id === 'story') {
        variables.personaje_o_evento = topic.trim() || 'David'
        variables.libro_biblico = '1 Samuel'
        variables.capitulo = '17'
        variables.longitud = '300'
        variables.enfoque = 'fe y valentía'
      }

      if (selectedType.id === 'reflection') {
        variables.pasaje_biblico = topic.trim() || 'Juan 3:16'
        variables.referencia = 'Juan 3:16'
        variables.tema_central = topic.trim() || 'amor de Dios'
        variables.longitud = '200'
      }

      if (selectedType.id === 'teaching') {
        variables.tema_doctrinal = topic.trim() || 'la gracia'
        variables.referencias_biblicas = 'Efesios 2:8-9'
        variables.nivel_profundidad = 'intermedio'
        variables.longitud = '250'
      }

      const res = await apiFetch('/content/generate', {
        method: 'POST',
        body: JSON.stringify({
          contentType: selectedType.id,
          templateName: selectedType.templateName,
          vertical,
          variables,
        }),
      })

      if (!res) {
        setError('Sesión expirada. Inicia sesión nuevamente.')
        return
      }

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        setError(body.message ?? `Error ${res.status}: No se pudo generar el contenido`)
        return
      }

      const data = await res.json()
      setResult(data.script ?? data.description ?? '(Contenido generado sin texto)')
      setTokensUsed(data.metadata?.tokens ?? null)
      setCost(data.costAi ?? null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error de conexión con el servidor')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6">
      <header className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-textPrimary">
          {t('content.title') || 'Contenido'}
        </h1>
        <p className="text-textSecondary mt-1">
          {project} · {vertical}
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left column - Form */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h2 className="font-medium mb-4">{t('content.generate') || 'Generar contenido'}</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Content Type */}
            <div>
              <label className="block text-sm font-medium text-textPrimary mb-1">
                Tipo de contenido
              </label>
              <select
                value={selectedIndex}
                onChange={(e) => setSelectedIndex(Number(e.target.value))}
                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-surface text-textPrimary"
                disabled={isGenerating}
              >
                {CONTENT_TYPES.map((type, i) => (
                  <option key={i} value={i}>
                    {type.label}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-textSecondary">{selectedType.description}</p>
            </div>

            {/* Topic */}
            <div>
              <label className="block text-sm font-medium text-textPrimary mb-1">
                {t('content.topic') || 'Tema'}
              </label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Ej: La paz que sobrepasa todo entendimiento"
                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-surface text-textPrimary placeholder:text-textSecondary"
                disabled={isGenerating}
              />
            </div>

            {/* Tone */}
            <div>
              <label className="block text-sm font-medium text-textPrimary mb-1">
                {t('content.tone') || 'Tono'}
              </label>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-surface text-textPrimary"
                disabled={isGenerating}
              >
                <option value="inspirational">Inspiracional</option>
                <option value="calm">Calmado</option>
                <option value="energetic">Energético</option>
                <option value="serious">Serio</option>
                <option value="friendly">Amigable</option>
              </select>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isGenerating}
              className="w-full py-3 px-4 rounded-lg font-medium text-white bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="inline h-4 w-4 animate-spin mr-2" />
                  Generando con IA...
                </>
              ) : (
                <>
                  <Sparkles className="inline h-4 w-4 mr-2" />
                  Generar contenido
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right column - Result */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h2 className="font-medium mb-4">Resultado</h2>

          {!isGenerating && !result && !error && (
            <div className="text-center py-8 text-textSecondary">
              <Sparkles className="h-12 w-12 mx-auto mb-3 opacity-40" />
              <p>Completa el formulario y presiona generar para crear contenido con IA</p>
            </div>
          )}

          {isGenerating && (
            <div className="text-center py-8">
              <Loader2 className="h-12 w-12 mx-auto mb-3 animate-spin text-primary" />
              <p className="font-medium text-textPrimary">Generando contenido...</p>
              <p className="text-sm text-textSecondary mt-1">Conectando con el proveedor de IA</p>
            </div>
          )}

          {error && (
            <div className="p-4 rounded-lg bg-error/10 border border-error">
              <div className="flex items-center gap-2 text-error font-medium">
                <AlertTriangle className="h-5 w-5 shrink-0" />
                Error
              </div>
              <p className="mt-2 text-sm text-error/80">{error}</p>
            </div>
          )}

          {result && !isGenerating && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-success">
                <CheckCircle2 className="h-5 w-5" />
                <span className="font-medium">Contenido generado</span>
              </div>

              {tokensUsed !== null && (
                <p className="text-xs text-textSecondary">
                  Tokens: {tokensUsed}{cost !== null ? ` · Costo: $${cost.toFixed(6)}` : ''}
                </p>
              )}

              <div className="rounded-lg border border-border bg-surface-secondary p-4">
                <pre className="whitespace-pre-wrap text-sm text-textPrimary font-sans leading-relaxed">
                  {result}
                </pre>
              </div>

              <button
                onClick={() => { setResult(null); setError(null) }}
                className="text-sm text-primary hover:underline"
              >
                Generar otro contenido
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
