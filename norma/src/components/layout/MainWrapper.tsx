'use client'

import { useSidebar } from './SidebarContext'

export function MainWrapper({ children }: { children: React.ReactNode }) {
  const { mode } = useSidebar()
  const ml = mode === 'collapsed' || mode === 'hover' ? 72 : 256

  return (
    <main
      className="main-content relative z-10 flex min-w-0 flex-1 flex-col overflow-x-hidden"
      style={{ ['--sidebar-w' as string]: `${ml}px` }}
    >
      {children}
    </main>
  )
}
