'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Command as CommandIcon, Keyboard, Sparkles, X } from 'lucide-react'
import { CommandPaletteV2, type CommandItem } from './CommandPaletteV2'

// Wrapper de telas V2. Adiciona:
//  - Command Palette (Cmd/Ctrl + K)
//  - Atalhos de navegação no estilo GitHub (g + letra)
//  - Overlay de ajuda (?)
//  - Trigger visual (botão flutuante) sutil para descobrir atalhos
//
// Inspirado em Linear / Vercel / Raycast.

const NAV_SHORTCUTS: { keys: string; label: string; href: string }[] = [
  { keys: 'g d', label: 'Dashboard', href: '/dashboard' },
  { keys: 'g p', label: 'Processos (V2)', href: '/processos-v2' },
  { keys: 'g c', label: 'Clientes (V2)', href: '/clientes-v2' },
  { keys: 'g r', label: 'Prazos (V2)', href: '/prazos-v2' },
  { keys: 'g t', label: 'Tarefas (V2)', href: '/tarefas-v2' },
  { keys: 'g k', label: 'Comercial / CRM (V2)', href: '/comercial-v2' },
  { keys: 'g f', label: 'Financeiro (V2)', href: '/financeiro-v2' },
  { keys: 'g u', label: 'Usuários (V2)', href: '/usuarios-v2' },
]

const ACTION_SHORTCUTS = [
  { keys: '⌘ K', label: 'Abrir Command Palette' },
  { keys: '/', label: 'Focar busca' },
  { keys: 'n', label: 'Nova entidade (se a tela suportar)' },
  { keys: '?', label: 'Mostrar atalhos' },
  { keys: 'Esc', label: 'Fechar modais / drawers' },
]

function isTypingTarget(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false
  const tag = el.tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true
  if (el.isContentEditable) return true
  return false
}

export function V2Shell({
  children,
  extraCommands,
  onNew,
  searchInputId,
}: {
  children: React.ReactNode
  extraCommands?: CommandItem[]
  /** Atalho `n` chama esta função (ex: abrir formulário "novo X" da tela). */
  onNew?: () => void
  /** id do <input> de busca da tela — atalho `/` foca nele. */
  searchInputId?: string
}) {
  const router = useRouter()
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)
  const gBuffer = useRef<{ pending: boolean; timer: ReturnType<typeof setTimeout> | null }>({ pending: false, timer: null })

  const navigateByKey = useCallback(
    (k: string) => {
      const match = NAV_SHORTCUTS.find((s) => s.keys.endsWith(k))
      if (match) router.push(match.href)
    },
    [router],
  )

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K — palette
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setPaletteOpen(true)
        return
      }

      // Ignora se está digitando em campo
      if (isTypingTarget(e.target)) return

      // Esc fecha modais geridos aqui
      if (e.key === 'Escape') {
        if (helpOpen) setHelpOpen(false)
        return
      }

      // ? (shift + /) abre help
      if (e.key === '?' || (e.key === '/' && e.shiftKey)) {
        e.preventDefault()
        setHelpOpen((v) => !v)
        return
      }

      // / focar busca
      if (e.key === '/' && !e.shiftKey && searchInputId) {
        const el = document.getElementById(searchInputId) as HTMLInputElement | null
        if (el) {
          e.preventDefault()
          el.focus()
          el.select()
        }
        return
      }

      // n novo
      if (e.key === 'n' && onNew) {
        e.preventDefault()
        onNew()
        return
      }

      // Sequência g + letra (estilo GitHub)
      if (e.key === 'g' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        if (gBuffer.current.timer) clearTimeout(gBuffer.current.timer)
        gBuffer.current.pending = true
        gBuffer.current.timer = setTimeout(() => {
          gBuffer.current.pending = false
        }, 900)
        return
      }
      if (gBuffer.current.pending) {
        const k = e.key.toLowerCase()
        if (['d', 'p', 'c', 'r', 't', 'k', 'f', 'u'].includes(k)) {
          e.preventDefault()
          navigateByKey(k)
        }
        gBuffer.current.pending = false
        if (gBuffer.current.timer) clearTimeout(gBuffer.current.timer)
        gBuffer.current.timer = null
      }
    }

    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      if (gBuffer.current.timer) clearTimeout(gBuffer.current.timer)
    }
  }, [helpOpen, navigateByKey, onNew, searchInputId])

  return (
    <>
      {children}

      <CommandPaletteV2 open={paletteOpen} onClose={() => setPaletteOpen(false)} extraCommands={extraCommands} />

      {/* Botão flutuante de descoberta */}
      <button
        onClick={() => setPaletteOpen(true)}
        title="Abrir Command Palette (Ctrl/Cmd + K)"
        className="group fixed bottom-6 right-6 z-30 flex items-center gap-2 rounded-2xl border border-white/10 px-3 py-2 text-xs font-medium text-muted-foreground shadow-2xl shadow-black/60 backdrop-blur-xl transition hover:border-gold/30 hover:text-gold"
        style={{ background: 'rgba(15,15,15,0.85)' }}
      >
        <CommandIcon size={13} className="text-gold" />
        <span className="hidden sm:inline">Comandos</span>
        <kbd className="hidden items-center gap-0.5 rounded-md border border-white/10 bg-white/5 px-1 py-0.5 text-[10px] sm:inline-flex">
          ⌘K
        </kbd>
      </button>

      {/* Help overlay */}
      <AnimatePresence>
        {helpOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-[55]"
              style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setHelpOpen(false)}
            />
            <motion.div
              className="fixed left-1/2 top-1/2 z-[56] w-[92vw] max-w-[560px] -translate-x-1/2 -translate-y-1/2"
              initial={{ opacity: 0, y: 10, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 420, damping: 32 }}
            >
              <div
                className="overflow-hidden rounded-2xl border border-white/10 shadow-2xl shadow-black/60"
                style={{ background: '#0F0F0F' }}
              >
                <div className="flex items-center justify-between border-b border-white/8 px-5 py-4">
                  <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.32em] text-muted-foreground">
                    <Sparkles size={11} className="text-gold" />
                    Atalhos de teclado
                  </div>
                  <button
                    onClick={() => setHelpOpen(false)}
                    className="rounded-md p-1 text-muted-foreground hover:bg-white/5 hover:text-foreground"
                    aria-label="Fechar"
                  >
                    <X size={14} />
                  </button>
                </div>

                <div className="grid gap-4 px-5 py-5 sm:grid-cols-2">
                  <section>
                    <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-gold">
                      <Keyboard size={11} className="mr-1 inline" />
                      Ações
                    </h3>
                    <ul className="space-y-1.5">
                      {ACTION_SHORTCUTS.map((s) => (
                        <li key={s.keys} className="flex items-center justify-between gap-3 rounded-lg px-2 py-1.5 text-xs hover:bg-white/5">
                          <span className="text-muted-foreground">{s.label}</span>
                          <kbd className="rounded-md border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] font-mono text-foreground">
                            {s.keys}
                          </kbd>
                        </li>
                      ))}
                    </ul>
                  </section>

                  <section>
                    <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-gold">
                      Navegação <span className="text-muted-foreground/70">(estilo GitHub)</span>
                    </h3>
                    <ul className="space-y-1.5">
                      {NAV_SHORTCUTS.map((s) => (
                        <li key={s.keys} className="flex items-center justify-between gap-3 rounded-lg px-2 py-1.5 text-xs hover:bg-white/5">
                          <span className="text-muted-foreground">{s.label}</span>
                          <kbd className="rounded-md border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] font-mono text-foreground">
                            {s.keys}
                          </kbd>
                        </li>
                      ))}
                    </ul>
                  </section>
                </div>

                <div className="border-t border-white/8 bg-white/[0.02] px-5 py-3 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                  Pressione <kbd className="mx-1 rounded border border-white/10 bg-white/5 px-1 py-0.5 text-[10px]">?</kbd> a qualquer momento para reabrir esta ajuda.
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
