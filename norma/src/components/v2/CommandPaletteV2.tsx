'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  CornerDownLeft,
  Command as CommandIcon,
  ArrowUp,
  ArrowDown,
  X,
  FileText,
  Users,
  Briefcase,
  ListChecks,
  Clock3,
  CircleDollarSign,
  Crown,
  Plus,
  LayoutDashboard,
  Settings,
  type LucideIcon,
} from 'lucide-react'

// Inspirado em Linear / Vercel / Raycast: palette com grupos, navegação por teclado e atalhos.
// Adicione/edite comandos abaixo conforme novas telas V2 forem entrando.

type CommandItem = {
  id: string
  label: string
  hint?: string
  group: 'Ir para' | 'Criar' | 'Sistema'
  icon: LucideIcon
  href?: string
  onSelect?: () => void
  keywords?: string
  accent?: string
}

const baseCommands: CommandItem[] = [
  // Ir para — V2
  { id: 'go-processos-v2', label: 'Processos (V2)', hint: 'Pipeline processual', group: 'Ir para', icon: FileText, href: '/processos-v2', keywords: 'casos pasta autos', accent: '#B8962A' },
  { id: 'go-clientes-v2', label: 'Clientes (V2)', hint: 'Base de clientes', group: 'Ir para', icon: Users, href: '/clientes-v2', keywords: 'pessoa contato', accent: '#3B82F6' },
  { id: 'go-prazos-v2', label: 'Prazos (V2)', hint: 'Controladoria de prazos', group: 'Ir para', icon: Clock3, href: '/prazos-v2', keywords: 'agenda vencimento prazo legal', accent: '#F59E0B' },
  { id: 'go-tarefas-v2', label: 'Tarefas (V2)', hint: 'Kanban operacional', group: 'Ir para', icon: ListChecks, href: '/tarefas-v2', keywords: 'kanban todo', accent: '#22C55E' },
  { id: 'go-comercial-v2', label: 'Comercial (V2)', hint: 'CRM e leads', group: 'Ir para', icon: Briefcase, href: '/comercial-v2', keywords: 'lead crm funil pipeline', accent: '#EC4899' },
  { id: 'go-financeiro-v2', label: 'Financeiro (V2)', hint: 'Lançamentos e fluxo', group: 'Ir para', icon: CircleDollarSign, href: '/financeiro-v2', keywords: 'receita despesa caixa dinheiro', accent: '#22C55E' },
  { id: 'go-usuarios-v2', label: 'Usuários (V2)', hint: 'Equipe e perfis', group: 'Ir para', icon: Crown, href: '/usuarios-v2', keywords: 'time equipe perfil rbac', accent: '#B8962A' },

  // Ir para — V1 (canônicas / produção)
  { id: 'go-dashboard', label: 'Dashboard', hint: 'Visão geral', group: 'Ir para', icon: LayoutDashboard, href: '/dashboard', keywords: 'home inicio kpi', accent: '#94A3B8' },
  { id: 'go-controladoria', label: 'Controladoria', hint: 'Visão executiva', group: 'Ir para', icon: LayoutDashboard, href: '/controladoria', keywords: 'gerencial', accent: '#94A3B8' },
  { id: 'go-relatorios', label: 'Relatórios', hint: 'Análises e exportação', group: 'Ir para', icon: LayoutDashboard, href: '/relatorios', keywords: 'analitico bi', accent: '#94A3B8' },

  // Criar
  { id: 'new-processo', label: 'Novo processo', group: 'Criar', icon: Plus, href: '/processos/novo', keywords: 'cadastrar caso', accent: '#B8962A' },
  { id: 'new-cliente', label: 'Novo cliente', group: 'Criar', icon: Plus, href: '/clientes/novo', keywords: 'cadastrar pessoa', accent: '#3B82F6' },
  { id: 'new-prazo', label: 'Novo prazo', group: 'Criar', icon: Plus, href: '/prazos/novo', keywords: 'cadastrar agenda', accent: '#F59E0B' },
  { id: 'new-tarefa', label: 'Nova tarefa', group: 'Criar', icon: Plus, href: '/tarefas/novo', keywords: 'cadastrar todo', accent: '#22C55E' },
  { id: 'new-lead', label: 'Novo lead', group: 'Criar', icon: Plus, href: '/comercial/novo', keywords: 'cadastrar crm', accent: '#EC4899' },
  { id: 'new-lancamento', label: 'Novo lançamento financeiro', group: 'Criar', icon: Plus, href: '/financeiro/novo', keywords: 'cadastrar receita despesa', accent: '#22C55E' },
  { id: 'new-usuario', label: 'Novo usuário', group: 'Criar', icon: Plus, href: '/usuarios/novo', keywords: 'cadastrar equipe', accent: '#B8962A' },

  // Sistema
  { id: 'sys-config', label: 'Configurações', group: 'Sistema', icon: Settings, href: '/configuracoes', keywords: 'preferencias escritorio', accent: '#94A3B8' },
]

const GROUP_ORDER: CommandItem['group'][] = ['Ir para', 'Criar', 'Sistema']

function normalize(s: string) {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
}

export function CommandPaletteV2({
  open,
  onClose,
  extraCommands = [],
}: {
  open: boolean
  onClose: () => void
  extraCommands?: CommandItem[]
}) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const commands = useMemo(() => [...baseCommands, ...extraCommands], [extraCommands])

  const filtered = useMemo(() => {
    const q = normalize(query.trim())
    if (!q) return commands
    return commands.filter((c) => {
      const hay = normalize([c.label, c.hint ?? '', c.keywords ?? '', c.group].join(' '))
      return hay.includes(q)
    })
  }, [commands, query])

  const grouped = useMemo(() => {
    const map = new Map<CommandItem['group'], CommandItem[]>()
    for (const cmd of filtered) {
      const arr = map.get(cmd.group) ?? []
      arr.push(cmd)
      map.set(cmd.group, arr)
    }
    return GROUP_ORDER.filter((g) => map.has(g)).map((g) => [g, map.get(g)!] as const)
  }, [filtered])

  // Reset ao abrir / focar input
  useEffect(() => {
    if (!open) return
    setQuery('')
    setActive(0)
    const t = setTimeout(() => inputRef.current?.focus(), 30)
    return () => clearTimeout(t)
  }, [open])

  // Mantém o item ativo dentro do range quando o filtro muda
  useEffect(() => {
    if (active >= filtered.length) setActive(Math.max(0, filtered.length - 1))
  }, [filtered.length, active])

  // Scroll do item ativo para a área visível
  useEffect(() => {
    if (!open) return
    const el = listRef.current?.querySelector<HTMLElement>(`[data-cmd-index="${active}"]`)
    el?.scrollIntoView({ block: 'nearest' })
  }, [active, open])

  const runCommand = (cmd: CommandItem) => {
    onClose()
    if (cmd.onSelect) cmd.onSelect()
    else if (cmd.href) router.push(cmd.href)
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((a) => Math.min(filtered.length - 1, a + 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((a) => Math.max(0, a - 1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const cmd = filtered[active]
      if (cmd) runCommand(cmd)
    } else if (e.key === 'Escape') {
      onClose()
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-[60]"
            style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            className="fixed left-1/2 top-[18%] z-[61] w-[92vw] max-w-[640px] -translate-x-1/2"
            initial={{ opacity: 0, y: -12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 420, damping: 32 }}
          >
            <div
              className="overflow-hidden rounded-2xl border border-white/10 shadow-2xl shadow-black/60"
              style={{ background: '#0F0F0F' }}
              onKeyDown={onKeyDown}
            >
              {/* Header / input */}
              <div className="relative border-b border-white/8">
                <Search size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value)
                    setActive(0)
                  }}
                  placeholder="Buscar ações, telas e atalhos…"
                  className="w-full bg-transparent py-4 pl-12 pr-24 text-sm text-foreground outline-none placeholder:text-muted-foreground"
                  spellCheck={false}
                  autoComplete="off"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  <kbd className="hidden items-center gap-1 rounded-md border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground sm:inline-flex">
                    <CommandIcon size={10} /> K
                  </kbd>
                  <button
                    onClick={onClose}
                    aria-label="Fechar"
                    className="rounded-md p-1 text-muted-foreground hover:bg-white/5 hover:text-foreground"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>

              {/* Lista */}
              <div ref={listRef} className="max-h-[60vh] overflow-y-auto px-2 py-2">
                {filtered.length === 0 ? (
                  <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-muted-foreground">
                      <Search size={18} />
                    </div>
                    <p className="text-sm font-semibold text-foreground">Nenhum resultado</p>
                    <p className="mt-1 text-xs text-muted-foreground">Tente outra palavra ou comando.</p>
                  </div>
                ) : (
                  grouped.map(([group, items]) => (
                    <div key={group} className="px-1 pb-1">
                      <div className="px-3 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                        {group}
                      </div>
                      {items.map((cmd) => {
                        const idx = filtered.indexOf(cmd)
                        const isActive = idx === active
                        const Icon = cmd.icon
                        return (
                          <button
                            key={cmd.id}
                            data-cmd-index={idx}
                            onMouseEnter={() => setActive(idx)}
                            onClick={() => runCommand(cmd)}
                            className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${
                              isActive ? 'bg-gold/10 ring-1 ring-gold/30' : 'hover:bg-white/5'
                            }`}
                          >
                            <div
                              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                              style={{
                                background: `${cmd.accent ?? '#94A3B8'}1A`,
                                color: cmd.accent ?? '#94A3B8',
                                border: `1px solid ${cmd.accent ?? '#94A3B8'}33`,
                              }}
                            >
                              <Icon size={14} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="truncate text-sm font-medium text-foreground">{cmd.label}</div>
                              {cmd.hint && (
                                <div className="truncate text-[11px] text-muted-foreground">{cmd.hint}</div>
                              )}
                            </div>
                            {isActive && (
                              <span className="hidden items-center gap-1 text-[10px] uppercase tracking-wider text-muted-foreground sm:inline-flex">
                                <CornerDownLeft size={11} /> Abrir
                              </span>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  ))
                )}
              </div>

              {/* Footer dicas */}
              <div className="flex items-center justify-between border-t border-white/8 bg-white/[0.02] px-4 py-2 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center gap-1">
                    <kbd className="inline-flex items-center rounded-md border border-white/10 bg-white/5 px-1 py-0.5 text-[10px]">
                      <ArrowUp size={9} />
                    </kbd>
                    <kbd className="inline-flex items-center rounded-md border border-white/10 bg-white/5 px-1 py-0.5 text-[10px]">
                      <ArrowDown size={9} />
                    </kbd>
                    navegar
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <kbd className="inline-flex items-center rounded-md border border-white/10 bg-white/5 px-1 py-0.5 text-[10px]">
                      <CornerDownLeft size={9} />
                    </kbd>
                    abrir
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <kbd className="inline-flex items-center rounded-md border border-white/10 bg-white/5 px-1 py-0.5 text-[10px]">esc</kbd>
                    fechar
                  </span>
                </div>
                <span className="hidden text-gold sm:inline">Norma · v2</span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export type { CommandItem }
