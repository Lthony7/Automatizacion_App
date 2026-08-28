'use client'

import { useState, useEffect } from 'react'
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize,
  Edit3,
  XCircle,
  CheckCircle2,
  Shield,
  Brain,
  FileText,
  Hash,
  Clock,
  History,
  ListChecks,
  AlertTriangle
} from 'lucide-react'
import { useLanguage } from '@/theme/i18n'
import { getBrandConfig } from '@/theme/branding'

export type ReviewItem = {
  id: string
  title: string
  description: string
  script: string
  cta: string
  hashtags: string[]
  content_type: string
  vertical: string
  status: 'REVIEW' | 'APPROVED' | 'REJECTED' | 'DRAFT' | 'GENERATING'
  scores: {
    quality: number
    originality: number
    safety: number
  }
  domainValidation: {
    passed: boolean
    issues: string[]
    score: number
  }
  aiReview: {
    passed: boolean
    suggestions: string[]
    score: number
  }
  bibleGuard?: {
    passed: boolean
    warnings: string[]
    score: number
  }
  versionHistory: Array<{
    version: number
    timestamp: string
    author: string
    changes: string
  }>
  auditHistory: Array<{
    action: string
    timestamp: string
    user: string
    details: string
  }>
  scheduledTime?: string
  platform?: string
  thumbnailUrl?: string
  videoUrl?: string
}

type ReviewStudioProps = {
  item: ReviewItem
  onApprove: (item: ReviewItem) => void
  onReject: (item: ReviewItem, reason: string, comment: string) => void
  onEdit: (item: ReviewItem) => void
  canReview: boolean
  isMobile?: boolean
}

export function ReviewStudio({
  item,
  onApprove,
  onReject,
  onEdit,
  canReview,
  isMobile = false,
}: ReviewStudioProps) {
  const { t } = useLanguage()
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [rejectComment, setRejectComment] = useState('')
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(true)
  const [showVideoFullscreen, setShowVideoFullscreen] = useState(false)

  const brand = getBrandConfig(item.vertical)

  const ScoreBadge = ({ label, score, color }: { label: string; score: number; color: string }) => (
    <div className="flex items-center justify-between p-3 rounded-md bg-surface border border-border">
      <span className="text-sm text-textSecondary">{label}</span>
      <span className="font-semibold" style={{ color }}>
        {score}/100
      </span>
    </div>
  )

  return (
    <div className={`max-w-7xl mx-auto ${isMobile ? 'p-3' : 'p-4 md:p-6'}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <h1 className="text-xl md:text-2xl font-bold text-textPrimary">
          {t('review.title') || 'Revisión'}
        </h1>
        {!isMobile && (
          <div className="flex items-center gap-2 text-sm text-textSecondary">
            <Clock className="h-4 w-4" />
            {item.scheduledTime || 'No programado'}
          </div>
        )}
      </div>

      <div className={`grid gap-4 md:gap-6 ${isMobile ? 'grid-cols-1' : 'lg:grid-cols-2'}`}>
        {/* Left Column - Video Preview */}
        <div className="space-y-4">
          <div className="relative bg-black rounded-lg overflow-hidden aspect-[9/16] max-w-sm mx-auto">
            {item.videoUrl ? (
              <video
                src={item.videoUrl}
                className="w-full h-full object-contain"
                muted={isMuted}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20">
                <Play className="h-16 w-16 text-primary/50" />
              </div>
            )}

            {/* Video Controls */}
            <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                  aria-label={isPlaying ? 'Pausar' : 'Reproducir'}
                >
                  {isPlaying ? <Pause className="h-5 w-5 text-white" /> : <Play className="h-5 w-5 text-white" />}
                </button>
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                  aria-label={isMuted ? 'Activar sonido' : 'Silenciar'}
                >
                  {isMuted ? <VolumeX className="h-5 w-5 text-white" /> : <Volume2 className="h-5 w-5 text-white" />}
                </button>
                <button
                  onClick={() => setShowVideoFullscreen(true)}
                  className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                  aria-label="Pantalla completa"
                >
                  <Maximize className="h-5 w-5 text-white" />
                </button>
              </div>
            </div>
          </div>

          {/* Mobile-only quick actions */}
          {isMobile && canReview && (
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setShowRejectModal(true)}
                className="flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-error/10 border border-error text-error font-medium min-h-[44px]"
                style={{ minHeight: '44px' }}
              >
                <XCircle className="h-5 w-5" />
                {t('review.reject') || 'Rechazar'}
              </button>
              <button
                onClick={() => onApprove(item)}
                className="flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-white font-medium min-h-[44px]"
                style={{ backgroundColor: brand.colors.success, minHeight: '44px' }}
              >
                <CheckCircle2 className="h-5 w-5" />
                {t('review.approve') || 'Aprobar'}
              </button>
            </div>
          )}
        </div>

        {/* Right Column - Content Details */}
        <div className="space-y-4">
          {/* Title */}
          <div className="bg-card border border-border rounded-lg p-4">
            <h3 className="font-semibold text-textPrimary mb-1">{item.title}</h3>
            <p className="text-sm text-textSecondary">{item.description}</p>
          </div>

          {/* Script */}
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="h-4 w-4 text-textSecondary" />
              <span className="text-sm font-medium">Guion</span>
            </div>
            <p className="text-sm text-textPrimary whitespace-pre-wrap">{item.script}</p>
          </div>

          {/* CTA and Hashtags */}
          <div className="bg-card border border-border rounded-lg p-4 space-y-3">
            <div>
              <span className="text-sm font-medium text-textSecondary">CTA</span>
              <p className="text-sm text-textPrimary mt-1">{item.cta}</p>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Hash className="h-4 w-4 text-textSecondary" />
                <span className="text-sm font-medium">Hashtags</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {item.hashtags.map((tag, i) => (
                  <span key={i} className="px-2 py-1 rounded-full bg-surface-secondary text-xs text-textSecondary">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Domain Validation */}
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-textSecondary" />
                <span className="text-sm font-medium">Validación de dominio</span>
              </div>
              <span className={`text-xs px-2 py-1 rounded ${
                item.domainValidation.passed ? 'bg-success/10 text-success' : 'bg-error/10 text-error'
              }`}>
                {item.domainValidation.passed ? 'Aprobado' : 'Rechazado'}
              </span>
            </div>
            <ScoreBadge label="Puntuación" score={item.domainValidation.score} color={brand.colors.primary} />
            {item.domainValidation.issues.length > 0 && (
              <div className="mt-3 space-y-1">
                {item.domainValidation.issues.map((issue, i) => (
                  <p key={i} className="text-xs text-error flex items-start gap-1">
                    <AlertTriangle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                    {issue}
                  </p>
                ))}
              </div>
            )}
          </div>

          {/* AI Review */}
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Brain className="h-4 w-4 text-textSecondary" />
                <span className="text-sm font-medium">Revisión IA</span>
              </div>
              <span className={`text-xs px-2 py-1 rounded ${
                item.aiReview.passed ? 'bg-success/10 text-success' : 'bg-error/10 text-error'
              }`}>
                {item.aiReview.passed ? 'Aprobado' : 'Rechazado'}
              </span>
            </div>
            <ScoreBadge label="Puntuación" score={item.aiReview.score} color={brand.colors.secondary} />
            {item.aiReview.suggestions.length > 0 && (
              <div className="mt-3 space-y-1">
                {item.aiReview.suggestions.map((suggestion, i) => (
                  <p key={i} className="text-xs text-textSecondary flex items-start gap-1">
                    <CheckCircle2 className="h-3 w-3 mt-0.5 flex-shrink-0 text-success" />
                    {suggestion}
                  </p>
                ))}
              </div>
            )}
          </div>

          {/* Bible Guard (if applicable) */}
          {item.bibleGuard && (
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-textSecondary" />
                  <span className="text-sm font-medium">{t('review.bibleGuard') || 'Validación Bíblica'}</span>
                </div>
                <span className={`text-xs px-2 py-1 rounded ${
                  item.bibleGuard.passed ? 'bg-success/10 text-success' : 'bg-error/10 text-error'
                }`}>
                  {item.bibleGuard.passed ? 'Aprobado' : 'Rechazado'}
                </span>
              </div>
              <ScoreBadge label="Puntuación" score={item.bibleGuard.score} color={brand.colors.accent} />
              {item.bibleGuard.warnings.length > 0 && (
                <div className="mt-3 space-y-1">
                  {item.bibleGuard.warnings.map((warning, i) => (
                    <p key={i} className="text-xs text-warning flex items-start gap-1">
                      <AlertTriangle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                      {warning}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Scores */}
          <div className="grid grid-cols-3 gap-2">
            <ScoreBadge label="Calidad" score={item.scores.quality} color={brand.colors.primary} />
            <ScoreBadge label="Originalidad" score={item.scores.originality} color={brand.colors.secondary} />
            <ScoreBadge label="Seguridad" score={item.scores.safety} color={brand.colors.accent} />
          </div>

          {/* Version History */}
          {item.versionHistory.length > 0 && (
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <History className="h-4 w-4 text-textSecondary" />
                <span className="text-sm font-medium">Historial de versiones</span>
              </div>
              <div className="space-y-2">
                {item.versionHistory.map((version, i) => (
                  <div key={i} className="text-xs text-textSecondary">
                    <span className="font-medium">v{version.version}</span> · {version.author} · {version.timestamp}
                    <p className="mt-0.5">{version.changes}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Audit History */}
          {item.auditHistory.length > 0 && (
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <ListChecks className="h-4 w-4 text-textSecondary" />
                <span className="text-sm font-medium">Historial de auditoría</span>
              </div>
              <div className="space-y-2">
                {item.auditHistory.map((audit, i) => (
                  <div key={i} className="text-xs text-textSecondary">
                    <span className="font-medium">{audit.action}</span> · {audit.user} · {audit.timestamp}
                    <p className="mt-0.5">{audit.details}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Desktop Actions */}
          {!isMobile && canReview && (
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => onEdit(item)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border hover:border-primary transition-colors"
              >
                <Edit3 className="h-4 w-4" />
                Editar
              </button>
              <button
                onClick={() => setShowRejectModal(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-error/10 border border-error text-error hover:bg-error/20 transition-colors"
              >
                <XCircle className="h-4 w-4" />
                {t('review.reject') || 'Rechazar'}
              </button>
              <button
                onClick={() => onApprove(item)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-white transition-colors"
                style={{ backgroundColor: brand.colors.success }}
              >
                <CheckCircle2 className="h-4 w-4" />
                {t('review.approve') || 'Aprobar'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg max-w-md w-full p-6">
            <h3 className="font-semibold text-textPrimary mb-4">
              {t('review.reject') || 'Rechazar contenido'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-textPrimary mb-1">
                  {t('review.reason') || 'Motivo'}
                </label>
                <select
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-error"
                >
                  <option value="">Selecciona un motivo</option>
                  <option value="content_issue">Problema de contenido</option>
                  <option value="quality_issue">Problema de calidad</option>
                  <option value="bible_guard">Violación de Bible Guard</option>
                  <option value="domain_validation">Falló validación de dominio</option>
                  <option value="other">Otro</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-textPrimary mb-1">
                  {t('review.comment') || 'Comentario'}
                </label>
                <textarea
                  value={rejectComment}
                  onChange={(e) => setRejectComment(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-error"
                  placeholder="Explica el motivo del rechazo..."
                />
              </div>
              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => setShowRejectModal(false)}
                  className="px-4 py-2 rounded-lg border border-border hover:border-primary transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    onReject(item, rejectReason, rejectComment)
                    setShowRejectModal(false)
                    setRejectReason('')
                    setRejectComment('')
                  }}
                  disabled={!rejectReason}
                  className="px-4 py-2 rounded-lg bg-error text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t('review.reject') || 'Rechazar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Video Modal */}
      {showVideoFullscreen && (
        <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
          <button
            onClick={() => setShowVideoFullscreen(false)}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/20 hover:bg-white/30"
            aria-label="Cerrar"
          >
            <XCircle className="h-6 w-6 text-white" />
          </button>
          <video
            src={item.videoUrl}
            className="max-w-full max-h-full object-contain"
            controls
            autoPlay
          />
        </div>
      )}
    </div>
  )
}