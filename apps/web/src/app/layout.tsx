import './globals.css'
import type { Metadata, Viewport } from 'next'
import { PWARegister } from '@/components/shell/pwa-register'
import { LanguageProvider } from '@/theme/i18n'
import { ThemeProvider } from '@/theme/theme'
import { WorkspaceProvider } from '@/context/workspace'

export const metadata: Metadata = {
  title: 'BibleShorts',
  description: 'Plataforma de Automatización de Contenido Cristiano',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'BibleShorts',
  },
  icons: {
    icon: '/brand/logo-icon.png',
    apple: '/brand/logo-icon.png',
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f7e9c8' },
    { media: '(prefers-color-scheme: dark)', color: '#221c11' },
  ],
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className="font-sans antialiased bg-background text-textPrimary">
        <LanguageProvider>
          <ThemeProvider>
            <WorkspaceProvider>
              <PWARegister />
              {children}
            </WorkspaceProvider>
          </ThemeProvider>
        </LanguageProvider>
      </body>
    </html>
  )
}
