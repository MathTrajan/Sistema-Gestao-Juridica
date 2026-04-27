'use client'

import { createContext, useContext, useState } from 'react'

const SidebarCtx = createContext({ open: false, toggle: () => {} })

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <SidebarCtx.Provider value={{ open, toggle: () => setOpen(o => !o) }}>
      {children}
    </SidebarCtx.Provider>
  )
}

export const useSidebar = () => useContext(SidebarCtx)
