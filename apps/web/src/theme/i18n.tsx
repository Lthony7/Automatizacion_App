'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

type Language = 'es' | 'en'

const LANGUAGE_CONTEXT_KEY = 'bible-shorts-language'

const LanguageContext = createContext<{
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string, defaults?: string) => string
}>({
  language: 'es',
  setLanguage: () => {},
  t: () => '',
})

const useLanguage = (): {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string, defaults?: string) => string
} => {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}

const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState<Language>('es')

  useEffect(() => {
    // La aplicación inicia en español aunque existan preferencias antiguas guardadas.
    const savedLanguage = localStorage.getItem(LANGUAGE_CONTEXT_KEY)
    if (savedLanguage === 'en') {
      setLanguage('en')
    }
  }, [])

  useEffect(() => {
    localStorage.setItem(LANGUAGE_CONTEXT_KEY, language)
    document.documentElement.lang = language
    document.documentElement.dataset.lang = language
  }, [language])

  const translate = (key: string, defaults?: string): string => {
    const translations = {
      'es': es,
      'en': en,
    }[language]

    // Navigate nested object with dot notation
    const value = key.split('.').reduce((obj: any, k: string) => {
      return obj?.[k]
    }, translations)

    return value || (defaults || key)
  }

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t: translate,
      }}
    >
      {children}
    </LanguageContext.Provider>
  )
}

export { LanguageProvider, useLanguage }

const es = {
  dashboard: {
    title: 'Panel de Control',
    subtitle: 'Resumen general de tu contenido',
    videosToday: 'Videos de hoy',
    videosTodayShort: 'Videos Generados Hoy',
    dailyTarget: 'Objetivo diario',
    dailyTargetSub: 'Objetivo diario',
    pendingReview: 'Pendientes de revisión',
    pendingReviewSub: 'Necesitan revisión',
    approved: 'Aprobados',
    approvedSub: 'Listos para programar',
    scheduled: 'Programados',
    scheduledToday: 'Programados',
    scheduledTodaySub: 'Para publicar hoy',
    publishedToday: 'Publicados',
    publishedTodaySub: 'Hoy',
    errors: 'Errores',
    errorsSub: 'Requieren atención',
    costDaily: 'Costo diario',
    costMonthly: 'Costo mensual',
    pipeline: 'Pipeline',
    contentToday: 'Contenido de hoy',
    statusDRAFT: 'Borrador',
    statusGENERATING: 'Generando',
    statusVALIDATING: 'Validando',
    statusRENDERING: 'Renderizando',
    statusREVIEW: 'En revisión',
    statusAPPROVED: 'Aprobado',
    statusSCHEDULED: 'Programado',
    statusPUBLISHED: 'Publicado',
    statusCANCELLED: 'Cancelado',
    productionPipeline: 'Pipeline de Producción',
    estimatedCost: 'Costo Estimado',
    costToday: 'Hoy',
    costThisMonth: 'Este Mes',
    seriesDailyCost: 'Costo Diario',
    seriesMonthlyCost: 'Costo Mensual',
    agendaToday: 'Agenda de Hoy',
    viewCalendar: 'Ver calendario',
    recentContent: 'Contenido Reciente',
    colTitle: 'Título',
    colType: 'Tipo',
    colStatus: 'Estado',
    colScheduled: 'Programado',
    colPlatforms: 'Plataformas',
    colActions: 'Acciones',
    performance: 'Rendimiento',
    last7Days: 'Últimos 7 días',
    views: 'Vistas',
    likes: 'Me gusta',
    comments: 'Comentarios',
    shares: 'Compartidos',
    avgRetention: 'Retención promedio',
    recentActivity: 'Actividad Reciente',
    quickAccess: 'Accesos Rápidos',
    myVideos: 'Mis Videos',
    reviews: 'Revisiones',
    generateContent: 'Generar Contenido',
  },
  common: {
    all: 'Todas',
  },
  empty: {
    videos: 'No hay videos',
    videosHint: 'Genera tu primer video desde el Content Studio.',
  },
  content: {
    title: 'Contenido',
    generate: 'Generar contenido',
    topic: 'Tema',
    vertical: 'Vertical',
    project: 'Proyecto',
    tone: 'Tono',
    duration: 'Duración',
    language: 'Idioma',
    voice: 'Voz',
    template: 'Plantilla',
    generateContent: 'Generar contenido',
  },
  review: {
    title: 'Revisar contenido',
    approve: 'Aprobar',
    reject: 'Rechazar',
    reason: 'Motivo',
    comment: 'Comentario',
    bibleGuard: 'Validación Bíblica',
    aiReview: 'Revisión IA',
    qualityScore: 'Puntuación de calidad',
    originalityScore: 'Puntuación de originalidad',
    safetyScore: 'Puntuación de seguridad',
  },
  calendar: {
    title: 'Calendario',
    today: 'Hoy',
    tomorrow: 'Mañana',
    week: 'Semana',
    month: 'Mes',
  },
  settings: {
    title: 'Configuración',
    language: 'Idioma',
    branding: 'Branding',
    projects: 'Proyectos',
    verticals: 'Verticales',
    permissions: 'Permisos',
    notifications: 'Notificaciones',
  },
  notifications: {
    title: 'Notificaciones',
    videoGenerated: 'Video generado',
    reviewPending: 'Revisión pendiente',
    videoApproved: 'Video aprobado',
    videoRejected: 'Video rechazado',
    publicationSucceeded: 'Publicación exitosa',
    publicationFailed: 'Publicación fallida',
    budgetReached: 'Límite de presupuesto alcanzado',
    systemError: 'Error del sistema',
    reviewPendingCount: 'Tienes {count} videos pendientes de revisión',
  },
  types: {
    prayer: 'Oración',
    verse: 'Versículo',
    reflection: 'Reflexión',
    story: 'Historia',
    teaching: 'Enseñanza',
  },
  activity: {
    videoApproved: 'Video aprobado',
    publishedYoutube: 'Video publicado en YouTube',
    newGenerated: 'Nuevo video generado',
    scheduledMorningPrayer: 'Oración de la Mañana programada',
    reviewPendingReflection: 'Reflexión pendiente de revisión',
  },
  time: {
    minAgo: 'hace 5 min',
    hourAgo: 'hace 1 h',
    hoursAgo2: 'hace 2 h',
    hoursAgo4: 'hace 4 h',
    yesterday: 'ayer',
  },
  days: {
    mon: 'Lun', tue: 'Mar', wed: 'Mié', thu: 'Jue', fri: 'Vie', sat: 'Sáb', sun: 'Dom',
  },
  search: {
    placeholder: 'Buscar contenido, videos, ideas...',
  },
  header: {
    generateContent: 'Generar Contenido',
    notifications: 'Notificaciones',
    theme: 'Tema',
    themeLight: 'Claro',
    themeDark: 'Oscuro',
    themeSystem: 'Sistema',
    openMenu: 'Abrir menú',
    userMenu: 'Menú de usuario',
  },
  sidebar: {
    currentProject: 'Proyecto actual',
    currentUser: 'Usuario',
    language: 'Idioma',
    plan: 'Plan',
    mainNav: 'Navegación principal',
    adminNav: 'Administración',
    ideas: 'Ideas',
    generateContent: 'Generar Contenido',
    myVideos: 'Mis Videos',
    reviews: 'Revisiones',
    productionQueue: 'Cola',
    audio: 'Audio',
    rendering: 'Renderizado',
    multimedia: 'Multimedia',
    templates: 'Plantillas',
    scheduledPubs: 'Programadas',
    publishedPubs: 'Publicadas',
    socialNetworks: 'Redes Sociales',
    analytics: 'Analytics',
    costs: 'Costos',
    settings: 'Configuración',
    admin: 'Admin',
    administrator: 'Administrador',
    planPro: 'Pro',
  },
  nav: {
    dashboard: 'Panel de control',
    projects: 'Proyectos',
    content: 'Contenido',
    ideas: 'Ideas',
    calendar: 'Calendario',
    review: 'Revisiones',
    videos: 'Videos',
    media: 'Recursos multimedia',
    templates: 'Plantillas',
    socialAccounts: 'Redes sociales',
    publications: 'Publicaciones',
    analytics: 'Analíticas',
    costs: 'Costos',
    settings: 'Configuración',
    users: 'Usuarios',
    audit: 'Auditoría',
  },
}

const en = {
  dashboard: {
    title: 'Dashboard',
    subtitle: 'General overview of your content',
    videosToday: 'Videos today',
    videosTodayShort: 'Videos Generated Today',
    dailyTarget: 'Daily target',
    dailyTargetSub: 'Daily target',
    pendingReview: 'Pending review',
    pendingReviewSub: 'Need review',
    approved: 'Approved',
    approvedSub: 'Ready to schedule',
    scheduled: 'Scheduled',
    scheduledToday: 'Scheduled',
    scheduledTodaySub: 'To publish today',
    publishedToday: 'Published',
    publishedTodaySub: 'Today',
    errors: 'Errors',
    errorsSub: 'Need attention',
    costDaily: 'Daily cost',
    costMonthly: 'Monthly cost',
    pipeline: 'Pipeline',
    contentToday: "Today's content",
    statusDRAFT: 'Draft',
    statusGENERATING: 'Generating',
    statusVALIDATING: 'Validating',
    statusRENDERING: 'Rendering',
    statusREVIEW: 'Review',
    statusAPPROVED: 'Approved',
    statusSCHEDULED: 'Scheduled',
    statusPUBLISHED: 'Published',
    statusCANCELLED: 'Cancelled',
    productionPipeline: 'Production Pipeline',
    estimatedCost: 'Estimated Cost',
    costToday: 'Today',
    costThisMonth: 'This Month',
    seriesDailyCost: 'Daily Cost',
    seriesMonthlyCost: 'Monthly Cost',
    agendaToday: "Today's Agenda",
    viewCalendar: 'View calendar',
    recentContent: 'Recent Content',
    colTitle: 'Title',
    colType: 'Type',
    colStatus: 'Status',
    colScheduled: 'Scheduled',
    colPlatforms: 'Platforms',
    colActions: 'Actions',
    performance: 'Performance',
    last7Days: 'Last 7 days',
    views: 'Views',
    likes: 'Likes',
    comments: 'Comments',
    shares: 'Shares',
    avgRetention: 'Avg. Retention',
    recentActivity: 'Recent Activity',
    quickAccess: 'Quick Access',
    myVideos: 'My Videos',
    reviews: 'Reviews',
    generateContent: 'Generate Content',
  },
  common: {
    all: 'All',
  },
  empty: {
    videos: 'No videos yet',
    videosHint: 'Generate your first video from the Content Studio.',
  },
  content: {
    title: 'Content',
    generate: 'Generate content',
    topic: 'Topic',
    vertical: 'Vertical',
    project: 'Project',
    tone: 'Tone',
    duration: 'Duration',
    language: 'Language',
    voice: 'Voice',
    template: 'Template',
    generateContent: 'Generate content',
  },
  review: {
    title: 'Review content',
    approve: 'Approve',
    reject: 'Reject',
    reason: 'Reason',
    comment: 'Comment',
    bibleGuard: 'Bible Guard',
    aiReview: 'AI Review',
    qualityScore: 'Quality score',
    originalityScore: 'Originality score',
    safetyScore: 'Safety score',
  },
  calendar: {
    title: 'Calendar',
    today: 'Today',
    tomorrow: 'Tomorrow',
    week: 'Week',
    month: 'Month',
  },
  settings: {
    title: 'Settings',
    language: 'Language',
    branding: 'Branding',
    projects: 'Projects',
    verticals: 'Verticals',
    permissions: 'Permissions',
    notifications: 'Notifications',
  },
  notifications: {
    title: 'Notifications',
    videoGenerated: 'Video generated',
    reviewPending: 'Review pending',
    videoApproved: 'Video approved',
    videoRejected: 'Video rejected',
    publicationSucceeded: 'Publication succeeded',
    publicationFailed: 'Publication failed',
    budgetReached: 'Budget reached',
    systemError: 'System error',
    reviewPendingCount: 'You have {count} videos pending review',
  },
  types: {
    prayer: 'Prayer',
    verse: 'Verse',
    reflection: 'Reflection',
    story: 'Story',
    teaching: 'Teaching',
  },
  activity: {
    videoApproved: 'Video approved',
    publishedYoutube: 'Video published on YouTube',
    newGenerated: 'New video generated',
    scheduledMorningPrayer: 'Morning Prayer scheduled',
    reviewPendingReflection: 'Reflection pending review',
  },
  time: {
    minAgo: '5 min ago',
    hourAgo: '1 h ago',
    hoursAgo2: '2 h ago',
    hoursAgo4: '4 h ago',
    yesterday: 'yesterday',
  },
  days: {
    mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu', fri: 'Fri', sat: 'Sat', sun: 'Sun',
  },
  search: {
    placeholder: 'Search content, videos, ideas...',
  },
  header: {
    generateContent: 'Generate Content',
    notifications: 'Notifications',
    theme: 'Theme',
    themeLight: 'Light',
    themeDark: 'Dark',
    themeSystem: 'System',
    openMenu: 'Open menu',
    userMenu: 'User menu',
  },
  sidebar: {
    currentProject: 'Current project',
    currentUser: 'User',
    language: 'Language',
    plan: 'Plan',
    mainNav: 'Main navigation',
    adminNav: 'Administration',
    ideas: 'Ideas',
    generateContent: 'Generate Content',
    myVideos: 'My Videos',
    reviews: 'Reviews',
    productionQueue: 'Queue',
    audio: 'Audio',
    rendering: 'Rendering',
    multimedia: 'Multimedia',
    templates: 'Templates',
    scheduledPubs: 'Scheduled',
    publishedPubs: 'Published',
    socialNetworks: 'Social Networks',
    analytics: 'Analytics',
    costs: 'Costs',
    settings: 'Settings',
    admin: 'Admin',
    administrator: 'Administrator',
    planPro: 'Pro',
  },
  nav: {
    dashboard: 'Dashboard',
    projects: 'Projects',
    content: 'Content',
    ideas: 'Ideas',
    calendar: 'Calendar',
    review: 'Reviews',
    videos: 'Videos',
    media: 'Media',
    templates: 'Templates',
    socialAccounts: 'Social accounts',
    publications: 'Publications',
    analytics: 'Analytics',
    costs: 'Costs',
    settings: 'Settings',
    users: 'Users',
    audit: 'Audit',
  },
}
