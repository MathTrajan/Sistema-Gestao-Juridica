'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Search, Bell, Plus, Menu, Clock, Sparkles, Sun, Moon } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useSidebar } from './SidebarContext'

const pageConfig: Record<string, {
  title: string
  subtitle?: string
  btnLabel?: string
  btnHref?: string
}> = {
  '/dashboard':     { title: 'Dashboard',       subtitle: 'Painel de controle' },
  '/clientes':      { title: 'Clientes',         subtitle: 'Gestão de clientes',    btnLabel: 'Novo Cliente',  btnHref: '/clientes/novo'  },
  '/processos':     { title: 'Processos',        subtitle: 'Pipeline processual',   btnLabel: 'Novo Processo', btnHref: '/processos/novo' },
  '/tarefas':       { title: 'Tarefas',          subtitle: 'Gestão de atividades',  btnLabel: 'Nova Tarefa',   btnHref: '/tarefas/novo'   },
  '/prazos':        { title: 'Prazos',           subtitle: 'Controle de prazos',    btnLabel: 'Novo Prazo',    btnHref: '/prazos/novo'    },
  '/comercial':     { title: 'Comercial / CRM',  subtitle: 'Pipeline comercial' },
  '/financeiro':    { title: 'Financeiro',       subtitle: 'Gestão financeira' },
  '/controladoria': { title: 'Controladoria',    subtitle: 'Relatórios e controle' },
  '/marketing':     { title: 'Marketing',        subtitle: 'Campanhas e leads' },
  '/usuarios':      { title: 'Usuários',         subtitle: 'Gestão de acesso' },
  '/relatorios':    { title: 'Relatórios',       subtitle: 'Análises e exportações' },
  '/configuracoes': { title: 'Configurações',    subtitle: 'Preferências do sistema' },
}

interface Notificacao {
  id: string
  tipo: 'prazo' | 'tarefa'
  titulo: string
  descricao: string
  urgente: boolean
  href: string
}

export default function Topbar() {
  const pathname = usePathname()
  const router = useRouter()
  const { toggleMobile, theme, toggleTheme } = useSidebar()
  const isDark = theme === 'dark'

  const config =
    Object.entries(pageConfig).find(
      ([path]) => pathname === path || pathname.startsWith(`${path}/`)
    )?.[1] ?? { title: 'Norma', subtitle: 'Sistema jurídico' }

  const [busca, setBusca] = useState('')
  const [buscaFocused, setBuscaFocused] = useState(false)
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([])
  const [dropdownAberto, setDropdownAberto] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch('/api/notificacoes')
      .then(r => (r.ok ? r.json() : []))
      .then(setNotificacoes)
      .catch(() => {})
  }, [pathname])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node))
        setDropdownAberto(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleBuscaKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && busca.trim()) {
      router.push(`/clientes?search=${encodeURIComponent(busca.trim())}`)
      setBusca('')
    }
  }

  const urgentes = notificacoes.filter(n => n.urgente).length
  const total = notificacoes.length

  const topbarBg = isDark
    ? 'rgba(20,20,20,0.88)'
    : 'rgba(255,255,255,0.92)'
  const topbarBorder = isDark
    ? '1px solid rgba(255,255,255,0.07)'
    : '1px solid rgba(0,0,0,0.08)'
  const titleColor = isDark ? '#ffffff' : '#111111'
  const subtitleColor = isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)'
  const iconBtnStyle = isDark
    ? { border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.75)' }
    : { border: '1px solid rgba(0,0,0,0.1)', background: 'rgba(0,0,0,0.03)', color: 'rgba(0,0,0,0.6)' }

  return (
    <header
      className="sticky top-0 z-40"
      style={{
        background: topbarBg,
        backdropFilter: 'blur(28px)',
        WebkitBackdropFilter: 'blur(28px)',
        borderBottom: topbarBorder,
      }}
    >
      <motion.div
        className="mx-auto flex min-h-[68px] w-full items-center gap-3 px-4 py-2 sm:px-6"
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* Hamburger (mobile) */}
        <button
          onClick={toggleMobile}
          className="inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl transition-all duration-150 md:hidden"
          style={iconBtnStyle}
          aria-label="Menu"
        >
          <Menu size={18} />
        </button>

        {/* Page title */}
        <motion.div
          key={pathname}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="min-w-0"
        >
          <p className="text-[10px] font-semibold uppercase tracking-[0.36em]" style={{ color: subtitleColor }}>
            {config.subtitle ?? 'Navegação'}
          </p>
          <h2 className="text-[17px] font-semibold leading-tight" style={{ color: titleColor }}>
            {config.title}
          </h2>
        </motion.div>

        <div className="ml-auto flex flex-1 items-center justify-end gap-2.5">

          {/* Search */}
          <motion.div
            className="hidden sm:flex items-center gap-2.5 rounded-xl px-3.5 py-2 transition-all duration-200"
            style={{
              border: buscaFocused
                ? '1px solid rgba(200,155,60,0.5)'
                : isDark ? '1px solid rgba(255,255,255,0.09)' : '1px solid rgba(0,0,0,0.1)',
              background: buscaFocused
                ? 'rgba(200,155,60,0.07)'
                : isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
              boxShadow: buscaFocused ? '0 0 18px rgba(200,155,60,0.15)' : 'none',
            }}
          >
            <Search size={14} style={{ color: buscaFocused ? '#C89B3C' : subtitleColor, flexShrink: 0 }} />
            <input
              value={busca}
              onChange={e => setBusca(e.target.value)}
              onKeyDown={handleBuscaKeyDown}
              onFocus={() => setBuscaFocused(true)}
              onBlur={() => setBuscaFocused(false)}
              placeholder="Buscar clientes..."
              className="h-8 w-[200px] bg-transparent text-[13px] outline-none placeholder:text-muted-foreground"
              style={{ color: titleColor }}
            />
          </motion.div>

          {/* Theme toggle */}
          <motion.button
            onClick={toggleTheme}
            className="inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl transition-all duration-150"
            style={iconBtnStyle}
            title={isDark ? 'Modo claro' : 'Modo escuro'}
            whileHover={{ scale: 1.06, y: -1 }}
            whileTap={{ scale: 0.95 }}
            aria-label="Alternar tema"
          >
            <AnimatePresence mode="wait" initial={false}>
              {isDark ? (
                <motion.span
                  key="sun"
                  initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
                  animate={{ rotate: 0, opacity: 1, scale: 1 }}
                  exit={{ rotate: 90, opacity: 0, scale: 0.5 }}
                  transition={{ duration: 0.22 }}
                >
                  <Sun size={17} style={{ color: '#C89B3C' }} />
                </motion.span>
              ) : (
                <motion.span
                  key="moon"
                  initial={{ rotate: 90, opacity: 0, scale: 0.5 }}
                  animate={{ rotate: 0, opacity: 1, scale: 1 }}
                  exit={{ rotate: -90, opacity: 0, scale: 0.5 }}
                  transition={{ duration: 0.22 }}
                >
                  <Moon size={17} />
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>

          {/* Notifications */}
          <div ref={dropdownRef} className="relative flex-shrink-0">
            <motion.button
              onClick={() => setDropdownAberto(v => !v)}
              className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-150"
              style={iconBtnStyle}
              aria-label="Notificações"
              whileHover={{ scale: 1.06, y: -1 }}
              whileTap={{ scale: 0.95 }}
            >
              <motion.div
                animate={total > 0 ? { rotate: [0, -8, 8, -5, 5, 0] } : {}}
                transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 6 }}
              >
                <Bell size={17} />
              </motion.div>
              {total > 0 && (
                <motion.span
                  className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[9px] font-bold text-white"
                  style={{ background: '#ef4444', boxShadow: '0 0 8px rgba(239,68,68,0.6)' }}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                >
                  {total > 9 ? '9+' : total}
                </motion.span>
              )}
            </motion.button>

            <AnimatePresence>
              {dropdownAberto && (
                <motion.div
                  className="absolute right-0 top-[calc(100%+10px)] z-50 w-80 overflow-hidden rounded-2xl"
                  style={{
                    background: isDark ? '#1A1A1A' : '#ffffff',
                    backdropFilter: 'blur(28px)',
                    border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)',
                    boxShadow: '0 24px 80px rgba(0,0,0,0.45)',
                  }}
                  initial={{ opacity: 0, y: -8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.96 }}
                  transition={{ duration: 0.18 }}
                >
                  <div className="px-5 py-4"
                    style={{ borderBottom: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.08)' }}>
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold" style={{ color: titleColor }}>Notificações</p>
                        <p className="text-xs" style={{ color: subtitleColor }}>Atualizações do sistema</p>
                      </div>
                      {urgentes > 0 && (
                        <motion.span
                          className="rounded-full px-2.5 py-1 text-[11px] font-semibold text-white"
                          style={{ background: '#ef4444', boxShadow: '0 0 10px rgba(239,68,68,0.4)' }}
                          animate={{ scale: [1, 1.05, 1] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                        >
                          {urgentes} urgente{urgentes > 1 ? 's' : ''}
                        </motion.span>
                      )}
                    </div>
                  </div>

                  <div className="max-h-72 overflow-y-auto">
                    {notificacoes.length === 0 ? (
                      <div className="p-6 text-center text-sm" style={{ color: subtitleColor }}>
                        <Sparkles size={20} className="mx-auto mb-2 opacity-40" />
                        Nenhuma notificação pendente
                      </div>
                    ) : (
                      notificacoes.map((item, index) => (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.04 }}
                        >
                          <Link
                            href={item.href}
                            onClick={() => setDropdownAberto(false)}
                            className="flex gap-3 px-5 py-4 transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                            style={{ borderBottom: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.05)' }}
                          >
                            <div
                              className={cn('flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl')}
                              style={item.urgente
                                ? { background: '#ef4444', color: '#fff', boxShadow: '0 0 10px rgba(239,68,68,0.4)' }
                                : { background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)', color: subtitleColor }
                              }
                            >
                              {item.tipo === 'prazo' ? <Clock size={13} /> : <Sparkles size={13} />}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium" style={{ color: titleColor }}>{item.titulo}</p>
                              <p className="mt-0.5 text-xs" style={{ color: subtitleColor }}>{item.descricao}</p>
                            </div>
                          </Link>
                        </motion.div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Action button */}
          {config.btnLabel && config.btnHref && (
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Link
                href={config.btnHref}
                className="inline-flex h-10 items-center gap-2 rounded-xl px-4 text-[13px] font-semibold text-black transition-all"
                style={{
                  background: 'linear-gradient(135deg, #C89B3C, #E0B96C)',
                  boxShadow: '0 0 22px rgba(200,155,60,0.3)',
                }}
              >
                <Plus size={14} />
                {config.btnLabel}
              </Link>
            </motion.div>
          )}
        </div>
      </motion.div>
    </header>
  )
}
