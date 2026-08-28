'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Menu,
  Settings,
  X,
  LayoutDashboard,
  FolderKanban,
  FileText,
  Lightbulb,
  Calendar,
  Eye,
  Video,
  Image as ImageIcon,
  LayoutTemplate,
  Share2,
  Send,
  BarChart3,
  Wallet,
  Users,
  ShieldCheck,
  Search,
  Bell,
  Sun,
  Moon,
  MonitorSmartphone,
  Plus,
  Globe,
  ChevronUp,
} from 'lucide-react'
import { useVerticalMetadata } from '@/hooks/use-vertical-metadata'
import { useLanguage } from '@/theme/i18n'
import { useTheme } from '@/theme/theme'
import type { NavIcon } from '@/lib/vertical-metadata'

const iconMap: Record<NavIcon, React.ComponentType<{ className?: string }>> = {
  'layout-dashboard': LayoutDashboard,
  'folder-kanban': FolderKanban,
  'file-text': FileText,
  lightbulb: Lightbulb,
  calendar: Calendar,
  eye: Eye,
  video: Video,
  image: ImageIcon,
  'layout-template': LayoutTemplate,
  'share-2': Share2,
  send: Send,
  'bar-chart-3': BarChart3,
  wallet: Wallet,
  settings: Settings,
  users: Users,
  'shield-check': ShieldCheck,
}

type ShellProps = {
  children: React.ReactNode
  vertical?: string
}

/** Nav ids that require admin permission (hidden when user lacks `admin:manage`). */
const ADMIN_NAV_IDS = new Set(['users', 'audit', 'settings'])

export function Shell({ children, vertical = 'christian' }: ShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showMoreOptions, setShowMoreOptions] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const { metadata } = useVerticalMetadata(vertical)
  const pathname = usePathname()
  const { t } = useLanguage()
  const { theme, setTheme } = useTheme()

  // TODO backend: permisos reales desde sesión (GET /api/me). Mientras tanto UI-only;
  // el backend SIEMPRE es la autoridad (AuthGuard + PermissionsGuard).
  const canAdmin = true

  const nav = useMemo(() => (metadata?.nav ?? []).filter((n) => canAdmin || !ADMIN_NAV_IDS.has(n.id)), [metadata])
  const primaryNav = useMemo(() => nav.filter((n) => n.group === 'primary'), [nav])
  const secondaryNav = useMemo(() => nav.filter((n) => n.group === 'secondary'), [nav])
  const adminNavIds = ['users', 'settings']
  const mainNav = useMemo(
    () => nav.filter((n) => !adminNavIds.includes(n.id)),
    [nav],
  )
  const adminNav = useMemo(() => nav.filter((n) => adminNavIds.includes(n.id)), [nav])

  const brandName = metadata?.displayName ?? 'BibleShorts'
  const brandIcon = '/brand/logo-icon.png'
  const unreadCount = 3
  const activeNav = nav.find((item) => item.href === pathname)
  const pageTitle = activeNav ? t(activeNav.labelKey, activeNav.defaultLabel) : 'Panel de control'

  const themeCycle = () => setTheme(theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light')
  const ThemeIcon = theme === 'dark' ? Moon : theme === 'system' ? MonitorSmartphone : Sun

  return (
    <div className="min-h-screen bg-background text-textPrimary">
      {/* ===== Desktop Sidebar ===== */}
      <aside className="hidden lg:flex lg:fixed lg:left-0 lg:top-0 lg:h-screen lg:w-64 lg:flex-col bg-sidebar z-40 border-r border-sidebar-border">
        <SidebarContent
          brandName={brandName}
          brandIcon={brandIcon}
          mainNav={mainNav}
          adminNav={adminNav}
          iconMap={iconMap}
          pathname={pathname}
          t={t}
          onNavigate={() => {}}
        />
      </aside>

      {/* ===== Mobile Sidebar Drawer ===== */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-72 max-w-[85vw] bg-sidebar border-r border-sidebar-border overflow-y-auto flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
              <div className="flex items-center gap-2 min-w-0">
                <img src={brandIcon} alt="" className="h-[2.1rem] w-auto shrink-0" />
                <h2 className="font-semibold text-textPrimary truncate">{brandName}</h2>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-2 rounded-md text-sidebar-text hover:bg-sidebar-hover transition-colors focus-ring"
                aria-label="Cerrar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <SidebarContent
              brandName={brandName}
              brandIcon={brandIcon}
              mainNav={mainNav}
              adminNav={adminNav}
              iconMap={iconMap}
              pathname={pathname}
              t={t}
              onNavigate={() => setSidebarOpen(false)}
              hideHeader
            />
          </aside>
        </div>
      )}

      {/* ===== Main column ===== */}
      <div className="lg:pl-64 flex flex-col min-h-screen">
        {/* Header */}
        <header className="sticky top-0 z-30 border-b border-border bg-surface/90 backdrop-blur supports-[backdrop-filter]:bg-surface/70">
          <div className="flex items-center gap-2 md:gap-3 px-3 md:px-5 h-14">
            <div className="hidden lg:flex items-center gap-4 shrink-0">
              <Menu className="h-5 w-5 text-textPrimary" aria-hidden />
              <div>
                <p className="text-lg font-bold leading-tight text-textPrimary">{pageTitle}</p>
                <p className="text-[11px] text-textSecondary">Resumen general de tu contenido</p>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 -ml-1 rounded-lg hover:bg-muted transition-colors focus-ring"
              aria-label={t('header.openMenu')}
            >
              <Menu className="h-5 w-5" />
            </button>

            <Link href="/" className="lg:hidden flex items-center gap-1.5 shrink-0" aria-label={brandName}>
              <img src={brandIcon} alt="" className="h-7 w-auto" />
            </Link>

            {/* Search — desktop */}
            <div className="hidden md:flex flex-1 max-w-md relative lg:ml-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-textSecondary pointer-events-none" aria-hidden />
              <input
                type="search"
                placeholder={t('search.placeholder')}
                aria-label={t('search.placeholder')}
                className="w-full h-9 pl-9 pr-3 rounded-lg border border-border bg-surface-secondary text-sm placeholder:text-textSecondary focus-ring"
              />
            </div>

            <div className="flex-1 md:hidden" />

            <div className="flex items-center gap-0.5 md:gap-1 shrink-0">
              <button
                onClick={themeCycle}
                className="p-2 rounded-lg hover:bg-muted transition-colors focus-ring"
                aria-label={`${t('header.theme')}: ${theme}`}
                title={theme}
              >
                <ThemeIcon className="h-5 w-5" />
              </button>

              <div className="relative">
                <button
                  onClick={() => setShowNotifications((v) => !v)}
                  className="relative p-2 rounded-lg hover:bg-muted transition-colors focus-ring"
                  aria-label={`${t('header.notifications')}${unreadCount > 0 ? ` (${unreadCount})` : ''}`}
                  aria-expanded={showNotifications}
                >
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 h-4 min-w-4 px-0.5 rounded-full bg-error text-white text-[10px] font-bold flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </button>
                {showNotifications && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowNotifications(false)} aria-hidden />
                    <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-1.5rem)] z-20 bg-card border border-border rounded-xl shadow-lg p-2">
                      <p className="text-sm font-semibold px-2 py-1.5">{t('notifications.title')}</p>
                      <ul className="space-y-0.5">
                        <li>
                          <Link href="/review" onClick={() => setShowNotifications(false)} className="block px-2 py-2 rounded-lg hover:bg-muted text-sm">
                            {t('notifications.reviewPendingCount').replace('{count}', '3')}
                          </Link>
                        </li>
                        <li>
                          <Link href="/content" onClick={() => setShowNotifications(false)} className="block px-2 py-2 rounded-lg hover:bg-muted text-sm">
                            {t('notifications.videoGenerated')}
                          </Link>
                        </li>
                        <li>
                          <Link href="/publications" onClick={() => setShowNotifications(false)} className="block px-2 py-2 rounded-lg hover:bg-muted text-sm">
                            {t('notifications.publicationSucceeded')}
                          </Link>
                        </li>
                        <li>
                          <Link href="/costs" onClick={() => setShowNotifications(false)} className="block px-2 py-2 rounded-lg hover:bg-muted text-sm">
                            {t('notifications.budgetReached')}
                          </Link>
                        </li>
                      </ul>
                      <Link href="/notifications" onClick={() => setShowNotifications(false)} className="block text-center text-xs text-primary py-2 hover:underline">
                        {t('notifications.title')} →
                      </Link>
                    </div>
                  </>
                )}
              </div>

              <Link
                href="/content/generate"
                className="ml-1 inline-flex items-center gap-1.5 h-9 px-3 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm focus-ring whitespace-nowrap"
              >
                <Plus className="h-4 w-4" aria-hidden />
                <span className="hidden sm:inline">{t('header.generateContent')}</span>
                <span className="sm:hidden">{t('dashboard.generate')}</span>
              </Link>

              <button
                className="p-1.5 ml-1 rounded-full hover:bg-muted transition-colors focus-ring"
                aria-label={t('header.userMenu')}
              >
                <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-secondary/20 text-primary text-xs font-bold">
                  AD
                </span>
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 pb-20 lg:pb-0">{children}</main>

        {/* Mobile bottom navigation */}
        <nav
          className="lg:hidden fixed bottom-0 left-0 right-0 bg-surface border-t border-border z-30"
          aria-label={t('sidebar.mainNav')}
        >
          <div className="max-w-xl mx-auto grid grid-cols-5 px-1 py-1.5">
            {(primaryNav.length >= 4
              ? primaryNav.slice(0, 4)
              : [...primaryNav, ...secondaryNav].slice(0, 4)
            ).map((item) => {
              const Icon = iconMap[item.icon] ?? FileText
              const active = pathname === item.href
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={`flex flex-col items-center gap-0.5 rounded-lg px-1 py-1.5 min-h-[48px] text-[11px] transition-colors ${
                    active ? 'text-primary' : 'text-textSecondary hover:text-primary'
                  }`}
                  aria-current={active ? 'page' : undefined}
                  aria-label={t(item.labelKey, item.defaultLabel)}
                >
                  <Icon className="h-5 w-5" />
                  <span className="leading-none truncate max-w-full">{t(item.labelKey, item.defaultLabel)}</span>
                </Link>
              )
            })}
            {/* "Más" abre sheet con el resto */}
            <button
              onClick={() => setShowMoreOptions(true)}
              className={`flex flex-col items-center gap-0.5 rounded-lg px-1 py-1.5 min-h-[48px] text-[11px] transition-colors ${
                showMoreOptions ? 'text-primary' : 'text-textSecondary hover:text-primary'
              }`}
              aria-label="Más"
            >
              <ChevronUp className="h-5 w-5" />
              <span className="leading-none">Más</span>
            </button>
          </div>
        </nav>

        {/* More options sheet (mobile) */}
        {showMoreOptions && (
          <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
            <div className="absolute inset-0 bg-black/50" onClick={() => setShowMoreOptions(false)} />
            <div className="absolute bottom-0 left-0 right-0 bg-surface border-t border-border rounded-t-2xl p-4 pb-6 max-h-[75vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-medium">Más</h2>
                <button
                  onClick={() => setShowMoreOptions(false)}
                  className="p-2 -mr-1 rounded-md hover:bg-muted transition-colors focus-ring"
                  aria-label="Cerrar"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <nav className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {secondaryNav.map((item) => {
                  const Icon = iconMap[item.icon] ?? FileText
                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      onClick={() => setShowMoreOptions(false)}
                      className="flex flex-col items-center gap-1.5 rounded-xl border border-border bg-surface-secondary p-3 text-center hover:border-primary/40 transition-colors"
                    >
                      <Icon className="h-5 w-5 text-primary" />
                      <span className="text-[11px] leading-tight text-textPrimary">{t(item.labelKey, item.defaultLabel)}</span>
                    </Link>
                  )
                })}
              </nav>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/* ===== Sidebar content (shared desktop + mobile drawer) ===== */

type SidebarContentProps = {
  brandName: string
  brandIcon: string
  mainNav: Array<{ id: string; href: string; labelKey: string; defaultLabel: string; icon: NavIcon }>
  adminNav: Array<{ id: string; href: string; labelKey: string; defaultLabel: string; icon: NavIcon }>
  iconMap: Record<string, React.ComponentType<{ className?: string }>>
  pathname: string
  t: (key: string, defaults?: string) => string
  onNavigate: () => void
  hideHeader?: boolean
}

function SidebarContent({
  brandName,
  brandIcon,
  mainNav,
  adminNav,
  iconMap,
  pathname,
  t,
  onNavigate,
  hideHeader,
}: SidebarContentProps) {
  const { language, setLanguage } = useLanguage()
  const nextLanguage = language === 'es' ? 'en' : 'es'
  return (
    <>
      {!hideHeader && (
        <div className="h-32 border-b border-sidebar-border bg-sidebar">
          <Link href="/" aria-label={brandName} className="block h-full w-full">
            <img src="/brand/Logo_Bible-sidebar.png" alt={brandName} className="h-full w-full object-contain" />
          </Link>
        </div>
      )}

      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-6" aria-label={t('sidebar.mainNav')}>
        <section aria-label={t('sidebar.mainNav')}>
          <ul className="space-y-0.5">
            {mainNav.map((item) => {
              const Icon = iconMap[item.icon] ?? FileText
              const active = pathname === item.href
              return (
                <li key={item.id}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={active ? 'page' : undefined}
                    className={`flex items-center gap-2.5 w-full rounded-lg px-3 py-2 text-sm min-h-[40px] transition-colors focus-ring ${
                      active
                        ? 'bg-primary text-white font-medium shadow-sm'
                        : 'text-sidebar-text hover:bg-sidebar-hover hover:text-textPrimary'
                    }`}
                  >
                    <Icon className={`h-4 w-4 shrink-0 ${active ? 'text-accent' : ''}`} />
                    <span className="truncate">{t(item.labelKey, item.defaultLabel)}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </section>

        {adminNav.length > 0 && (
          <section aria-label={t('sidebar.adminNav')}>
            <p className="px-3 mb-1 text-[11px] font-semibold uppercase tracking-wider text-sidebar-text/60">
              {t('sidebar.adminNav')}
            </p>
            <ul className="space-y-0.5">
              {adminNav.map((item) => {
                const Icon = iconMap[item.icon] ?? FileText
                const active = pathname === item.href
                return (
                  <li key={item.id}>
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      aria-current={active ? 'page' : undefined}
                      className={`flex items-center gap-2.5 w-full rounded-lg px-3 py-2 text-sm min-h-[40px] transition-colors focus-ring ${
                        active
                        ? 'bg-primary text-white font-medium shadow-sm'
                        : 'text-sidebar-text hover:bg-sidebar-hover hover:text-textPrimary'
                      }`}
                    >
                      <Icon className={`h-4 w-4 shrink-0 ${active ? 'text-accent' : ''}`} />
                      <span className="truncate">{t(item.labelKey, item.defaultLabel)}</span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </section>
        )}
      </nav>

      {/* Footer: proyecto / usuario / idioma / plan */}
      <div className="border-t border-sidebar-border p-3 space-y-2">
        <div className="rounded-lg bg-sidebar-hover/70 p-2.5">
          <p className="text-[10px] uppercase tracking-wide text-sidebar-text/60">{t('sidebar.currentProject')}</p>
          <p className="text-sm font-medium text-textPrimary truncate mt-0.5">{brandName}</p>
          <p className="text-[11px] text-sidebar-text/75 capitalize">Christian</p>
        </div>
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2 min-w-0">
            <span className="inline-flex items-center justify-center h-7 w-7 rounded-full bg-primary text-white text-[10px] font-bold shrink-0">
              AD
            </span>
            <div className="min-w-0">
              <p className="text-[12px] text-textPrimary truncate leading-tight">{t('sidebar.administrator')}</p>
              <p className="text-[10px] text-sidebar-text/75 leading-tight">{t('sidebar.planPro')}</p>
            </div>
          </div>
          <button
            onClick={() => setLanguage(nextLanguage)}
            className="inline-flex items-center gap-1 px-2 h-7 rounded-md text-[11px] font-medium text-sidebar-text hover:bg-sidebar-hover hover:text-textPrimary transition-colors focus-ring"
            aria-label={`${t('sidebar.language')}: Español`}
          >
            <Globe className="h-3.5 w-3.5" />
            {language === 'es' ? 'ES' : 'EN'}
          </button>
        </div>
      </div>
    </>
  )
}
