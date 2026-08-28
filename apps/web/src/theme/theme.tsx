'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

type Theme = 'light' | 'dark' | 'system'

const THEME_KEY = 'bible-shorts-theme'

const ThemeContext = createContext<{
  theme: Theme
  resolvedTheme: 'light' | 'dark'
  setTheme: (theme: Theme) => void
}>({
  theme: 'system',
  resolvedTheme: 'light',
  setTheme: () => {},
})

function applyTheme(theme: Theme): 'light' | 'dark' {
  const prefersDark =
    typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches
  const resolved = theme === 'system' ? (prefersDark ? 'dark' : 'light') : theme
  document.documentElement.classList.toggle('dark', resolved === 'dark')
  return resolved
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('system')
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light')

  useEffect(() => {
    const saved = localStorage.getItem(THEME_KEY) as Theme | null
    const initial: Theme = saved === 'light' || saved === 'dark' || saved === 'system' ? saved : 'system'
    setThemeState(initial)
    setResolvedTheme(applyTheme(initial))

    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => {
      if ((localStorage.getItem(THEME_KEY) as Theme | null) === 'system') {
        setResolvedTheme(applyTheme('system'))
      }
    }
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [])

  const setTheme = (next: Theme) => {
    setThemeState(next)
    localStorage.setItem(THEME_KEY, next)
    setResolvedTheme(applyTheme(next))
  }

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider')
  return ctx
}
