'use client'

import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'

export type SidebarMode = 'expanded' | 'collapsed' | 'hover' | 'pinned'
export type Theme = 'dark' | 'light'

interface SidebarContextValue {
  mode: SidebarMode
  setMode: (m: SidebarMode) => void
  mobileOpen: boolean
  toggleMobile: () => void
  theme: Theme
  toggleTheme: () => void
  hoverExpanded: boolean
  setHoverExpanded: (v: boolean) => void
  isExpanded: boolean
}

const SidebarCtx = createContext<SidebarContextValue>({
  mode: 'expanded',
  setMode: () => {},
  mobileOpen: false,
  toggleMobile: () => {},
  theme: 'dark',
  toggleTheme: () => {},
  hoverExpanded: false,
  setHoverExpanded: () => {},
  isExpanded: true,
})

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<SidebarMode>(() => {
    if (typeof window === 'undefined') return 'expanded'
    const savedMode = localStorage.getItem('norma_sidebar')
    return savedMode && ['expanded', 'collapsed', 'hover', 'pinned'].includes(savedMode)
      ? (savedMode as SidebarMode)
      : 'expanded'
  })
  const [mobileOpen, setMobileOpen] = useState(false)
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === 'undefined') return 'dark'
    const savedTheme = localStorage.getItem('norma_theme')
    return savedTheme === 'light' || savedTheme === 'dark' ? savedTheme : 'dark'
  })
  const [hoverExpanded, setHoverExpanded] = useState(false)

  useEffect(() => {
    try {
      const html = document.documentElement
      html.classList.toggle('light', theme === 'light')
      localStorage.setItem('norma_theme', theme)
    } catch {}
  }, [theme])

  const setMode = useCallback((m: SidebarMode) => {
    setModeState(m)
    try { localStorage.setItem('norma_sidebar', m) } catch {}
  }, [])

  const toggleMobile = useCallback(() => setMobileOpen(o => !o), [])

  const toggleTheme = useCallback(() => setThemeState(t => t === 'dark' ? 'light' : 'dark'), [])

  const isExpanded =
    mode === 'expanded' ||
    mode === 'pinned' ||
    (mode === 'hover' && hoverExpanded)

  const value = useMemo(() => ({
    mode,
    setMode,
    mobileOpen,
    toggleMobile,
    theme,
    toggleTheme,
    hoverExpanded,
    setHoverExpanded,
    isExpanded,
  }), [mode, setMode, mobileOpen, toggleMobile, theme, toggleTheme, hoverExpanded, isExpanded])

  return (
    <SidebarCtx.Provider value={value}>
      {children}
    </SidebarCtx.Provider>
  )
}

export const useSidebar = () => useContext(SidebarCtx)
