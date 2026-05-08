'use client'

import { useSidebar } from './SidebarContext'

export function MainWrapper({ children }: { children: React.ReactNode }) {
  const { isExpanded } = useSidebar()
  const ml = isExpanded ? 256 : 72

  return (
    <main
      className="main-content relative z-10 flex min-w-0 flex-1 flex-col"
      style={{ ['--sidebar-w' as string]: `${ml}px` }}
    >
      {children}
    </main>
  )
}
