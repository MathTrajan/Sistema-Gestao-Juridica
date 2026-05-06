'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { AnimatePresence, motion } from 'framer-motion'
import { Cinzel, Inter } from 'next/font/google'
import { cn } from '@/lib/utils'
import { useSidebar } from './SidebarContext'
import {
  LayoutDashboard, Users, FileText, CheckSquare, Clock,
  TrendingUp, DollarSign, BookOpen, Megaphone, BarChart2,
  Settings, LogOut, UserCog, ChevronLeft, ChevronRight,
  Pin, PinOff, MousePointer2,
} from 'lucide-react'

const cinzel = Cinzel({
  subsets: ['latin'],
  weight: ['600', '700', '800'],
})

const inter = Inter({
  subsets: ['latin'],
})

interface SidebarProps {
  user: { nome: string; perfil: string; area?: string | null } | null
  badgeTarefas: number
  badgePrazos: number
}

const perfilLabels: Record<string, string> = {
  GESTOR_GERAL: 'Gestor Geral',
  GERENTE: 'Gerente',
  COLABORADOR: 'Colaborador',
}

const navItems = [
  { label: 'Dashboard',  href: '/dashboard',  icon: LayoutDashboard },
  { label: 'Clientes',   href: '/clientes',   icon: Users },
  { label: 'Processos',  href: '/processos',  icon: FileText },
  { label: 'Tarefas',    href: '/tarefas',    icon: CheckSquare },
  { label: 'Prazos',     href: '/prazos',     icon: Clock },
]

const deptItems = [
  { label: 'Comercial / CRM', href: '/comercial',     icon: TrendingUp },
  { label: 'Financeiro',      href: '/financeiro',    icon: DollarSign },
  { label: 'Controladoria',   href: '/controladoria', icon: BookOpen },
  { label: 'Marketing',       href: '/marketing',     icon: Megaphone },
]

const systemItems = [
  { label: 'Usuários',       href: '/usuarios',      icon: UserCog },
  { label: 'Relatórios',     href: '/relatorios',    icon: BarChart2 },
  { label: 'Configurações',  href: '/configuracoes', icon: Settings },
]

const AREA_ROUTES: Record<string, string[]> = {
  JURIDICO:      ['/dashboard', '/clientes', '/processos', '/tarefas', '/prazos'],
  COMERCIAL:     ['/dashboard', '/clientes', '/comercial'],
  FINANCEIRO:    ['/dashboard', '/financeiro'],
  CONTROLADORIA: ['/dashboard', '/controladoria'],
  MARKETING:     ['/dashboard', '/marketing'],
}

function canSee(href: string, perfil: string, area?: string | null) {
  if (perfil === 'GESTOR_GERAL') return true
  if (perfil === 'GERENTE') return href !== '/configuracoes'
  const allowed = area ? (AREA_ROUTES[area] ?? ['/dashboard']) : ['/dashboard']
  return allowed.includes(href)
}

function getInitials(nome: string) {
  const parts = nome.trim().split(' ').filter(Boolean)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
}

// ─── Tooltip wrapper (used in collapsed mode) ────────────────────────────────
function Tooltip({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="relative group flex justify-center">
      {children}
      <div
        className="pointer-events-none absolute left-full ml-3 top-1/2 -translate-y-1/2 z-50
                   whitespace-nowrap rounded-lg px-3 py-2 text-xs font-semibold
                   opacity-0 group-hover:opacity-100 transition-opacity duration-150"
        style={{
          background: 'rgba(10,10,14,0.96)',
          border: '1px solid rgba(255,255,255,0.1)',
          color: '#ffffff',
          boxShadow: '0 10px 30px rgba(0,0,0,0.45)',
        }}
      >
        {label}
      </div>
    </div>
  )
}

// ─── Nav link ─────────────────────────────────────────────────────────────────
function NavLink({
  href, label, Icon, badge, badgeRed, collapsed,
}: {
  href: string; label: string; Icon: React.ElementType
  badge?: number; badgeRed?: boolean; collapsed: boolean
}) {
  const pathname = usePathname()
  const active = pathname === href || pathname.startsWith(`${href}/`)

  const inner = (
    <Link
      href={href}
      className={cn(
        'relative flex items-center gap-3 rounded-[10px] transition-all duration-150',
        collapsed ? 'justify-center px-0 py-3 w-12 mx-auto' : 'px-3.5 py-2.5',
        active
          ? 'font-semibold'
          : 'font-medium',
      )}
      style={
        active
          ? { color: '#C89B3C', background: 'rgba(200,155,60,0.09)', border: '1px solid rgba(200,155,60,0.15)' }
          : { color: 'rgba(255,255,255,0.62)', border: '1px solid transparent' }
      }
    >
      {/* Left indicator bar */}
      {active && !collapsed && (
        <motion.div
          layoutId="sidebar-indicator"
          className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full"
          style={{ background: 'linear-gradient(180deg, #C89B3C, #E0B96C)' }}
          transition={{ type: 'spring', stiffness: 380, damping: 28 }}
        />
      )}

      {/* Icon */}
      <Icon size={17} style={{ flexShrink: 0, opacity: active ? 1 : 0.7 }} />

      {/* Label + badge */}
      {!collapsed && (
        <>
          <span className="flex-1 text-[13px] leading-none">{label}</span>
          {badge ? (
            <motion.span
              className="rounded-full px-2 py-0.5 text-[10px] font-bold"
              style={
                badgeRed
                  ? { background: 'rgba(239,68,68,0.9)', color: '#fff', boxShadow: '0 0 8px rgba(239,68,68,0.5)' }
                  : { background: '#C89B3C', color: '#000' }
              }
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
            >
              {badge}
            </motion.span>
          ) : null}
        </>
      )}

      {/* Badge dot in collapsed mode */}
      {collapsed && badge ? (
        <span
          className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold"
          style={badgeRed
            ? { background: '#ef4444', color: '#fff', boxShadow: '0 0 6px rgba(239,68,68,0.6)' }
            : { background: '#C89B3C', color: '#000' }
          }
        >
          {badge > 9 ? '9+' : badge}
        </span>
      ) : null}
    </Link>
  )

  if (collapsed) {
    return <Tooltip label={label}><div className="w-full">{inner}</div></Tooltip>
  }
  return inner
}

// ─── Section title ─────────────────────────────────────────────────────────────
function SectionLabel({ children, collapsed }: { children: React.ReactNode; collapsed: boolean }) {
  if (collapsed) return <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '8px 12px' }} />
  return (
    <p className="px-3.5 pt-4 pb-1.5 text-[10px] font-bold uppercase tracking-[1.2px]"
      style={{ color: 'rgba(255,255,255,0.3)' }}>
      {children}
    </p>
  )
}

// ─── Control button ────────────────────────────────────────────────────────────
function CtrlBtn({
  onClick, title, children, active = false,
}: {
  onClick: () => void; title: string; children: React.ReactNode; active?: boolean
}) {
  return (
    <Tooltip label={title}>
      <button
        onClick={onClick}
        title={title}
        className="flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-150"
        style={active
          ? { color: '#C89B3C', background: 'rgba(200,155,60,0.12)', border: '1px solid rgba(200,155,60,0.25)' }
          : { color: 'rgba(255,255,255,0.4)', background: 'transparent', border: '1px solid rgba(255,255,255,0.07)' }
        }
      >
        {children}
      </button>
    </Tooltip>
  )
}

// ─── Main Sidebar component ────────────────────────────────────────────────────
export default function Sidebar({ user, badgeTarefas, badgePrazos }: SidebarProps) {
  const { mode, setMode, mobileOpen, toggleMobile, isExpanded, setHoverExpanded, theme } =
    useSidebar()

  const collapsed = !isExpanded
  const isDark = theme === 'dark'
  const sidebarWidth = collapsed ? 72 : 256

  const perfil = user?.perfil ?? 'COLABORADOR'
  const area = user?.area

  const navVisible    = navItems.filter(i => canSee(i.href, perfil, area))
  const deptVisible   = deptItems.filter(i => canSee(i.href, perfil, area))
  const systemVisible = systemItems.filter(i => canSee(i.href, perfil, area))

  function toggleCollapse() {
    if (mode === 'expanded') setMode('collapsed')
    else if (mode === 'collapsed') setMode('expanded')
    else setMode('collapsed')
  }

  const bgStyle = isDark
    ? { background: 'linear-gradient(180deg, #141416 0%, #0D0D10 100%)' }
    : { background: '#ffffff' }

  const borderStyle = isDark
    ? '1px solid rgba(255,255,255,0.07)'
    : '1px solid rgba(0,0,0,0.09)'

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className="fixed inset-0 z-40 md:hidden"
            style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }}
            onClick={toggleMobile}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        className={cn(
          'fixed bottom-0 left-0 top-0 z-50 flex flex-col',
          'transition-transform duration-300',
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
        )}
        style={{ ...bgStyle, borderRight: borderStyle, boxShadow: isDark ? '4px 0 24px rgba(0,0,0,0.4)' : '2px 0 16px rgba(0,0,0,0.08)' }}
        animate={{ width: sidebarWidth }}
        transition={{ type: 'spring', stiffness: 300, damping: 32 }}
        onMouseEnter={() => mode === 'hover' && setHoverExpanded(true)}
        onMouseLeave={() => mode === 'hover' && setHoverExpanded(false)}
      >

        {/* ── Logo / Brand ─────────────────────────────────────── */}
        <div
          className="flex items-center gap-3 overflow-hidden"
          style={{
            padding: collapsed ? '20px 0' : '20px 20px',
            justifyContent: collapsed ? 'center' : 'flex-start',
            borderBottom: isDark ? '1px solid rgba(255,255,255,0.07)' : '1px solid rgba(0,0,0,0.07)',
            minHeight: 96,
          }}
        >
          <div style={{ flexShrink: 0, width: 56, height: 56, position: 'relative' }}>
            <Image
              src="/logo-norma-icon.png"
              alt="Norma Logo"
              width={56}
              height={56}
              style={{ objectFit: 'contain' }}
              priority
            />
          </div>

          <AnimatePresence>
            {!collapsed && (
              <motion.div
                className="min-w-0 overflow-hidden"
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.22 }}
              >
                <div style={{ marginTop: 2, display: 'flex', flexDirection: 'column' }}>
                  <p
                    className={cinzel.className}
                    style={{
                      fontSize: 22,
                      fontWeight: 700,
                      color: '#D4B86F',
                      letterSpacing: '4px',
                      textTransform: 'uppercase',
                      margin: 0,
                      lineHeight: 1,
                      textShadow: '0 0 18px rgba(212,184,111,0.18)',
                    }}
                  >
                    NORMA
                  </p>
                  <p
                    className={inter.className}
                    style={{
                      marginTop: 6,
                      fontSize: 8,
                      fontWeight: 600,
                      color: 'rgba(212,184,111,0.78)',
                      letterSpacing: '2.5px',
                      textTransform: 'uppercase',
                      marginBottom: 0,
                      lineHeight: 1.2,
                    }}
                  >
                    Sistema Jurídico
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Nav ──────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto" style={{ padding: collapsed ? '12px 0' : '12px' }}>

          <SectionLabel collapsed={collapsed}>Principal</SectionLabel>
          <div className={cn('flex flex-col', collapsed ? 'gap-1 items-center' : 'gap-0.5')}>
            {navVisible.map(item => (
              <NavLink
                key={item.href}
                href={item.href}
                label={item.label}
                Icon={item.icon}
                badge={item.href === '/tarefas' ? badgeTarefas || undefined : item.href === '/prazos' ? badgePrazos || undefined : undefined}
                badgeRed={item.href === '/prazos'}
                collapsed={collapsed}
              />
            ))}
          </div>

          {deptVisible.length > 0 && (
            <>
              <SectionLabel collapsed={collapsed}>Departamentos</SectionLabel>
              <div className={cn('flex flex-col', collapsed ? 'gap-1 items-center' : 'gap-0.5')}>
                {deptVisible.map(item => (
                  <NavLink key={item.href} href={item.href} label={item.label} Icon={item.icon} collapsed={collapsed} />
                ))}
              </div>
            </>
          )}

          {systemVisible.length > 0 && (
            <>
              <SectionLabel collapsed={collapsed}>Sistema</SectionLabel>
              <div className={cn('flex flex-col', collapsed ? 'gap-1 items-center' : 'gap-0.5')}>
                {systemVisible.map(item => (
                  <NavLink key={item.href} href={item.href} label={item.label} Icon={item.icon} collapsed={collapsed} />
                ))}
              </div>
            </>
          )}
        </div>

        {/* ── User footer ───────────────────────────────────────── */}
        <div
          style={{
            borderTop: isDark ? '1px solid rgba(255,255,255,0.07)' : '1px solid rgba(0,0,0,0.07)',
            padding: collapsed ? '12px 0' : '16px',
          }}
        >
          {user && (
            <div
              className={cn('flex items-center gap-3 mb-3', collapsed && 'justify-center')}
            >
              <motion.div
                className="flex-shrink-0 flex items-center justify-center rounded-full text-xs font-bold"
                style={{
                  width: 36, height: 36,
                  background: 'linear-gradient(135deg, #C89B3C, #E0B96C)',
                  color: '#000',
                  boxShadow: '0 0 14px rgba(200,155,60,0.3)',
                }}
                whileHover={{ scale: 1.07 }}
              >
                {getInitials(user.nome)}
              </motion.div>

              <AnimatePresence>
                {!collapsed && (
                  <motion.div
                    className="min-w-0 overflow-hidden"
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <p className="truncate text-[13px] font-semibold whitespace-nowrap"
                      style={{ color: isDark ? '#ffffff' : '#111111' }}>
                      {user.nome}
                    </p>
                    <p className="text-[11px] whitespace-nowrap" style={{ color: '#C89B3C' }}>
                      {perfilLabels[user.perfil] ?? user.perfil}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Sign out */}
          {collapsed ? (
            <Tooltip label="Sair">
              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="flex h-10 w-10 mx-auto items-center justify-center rounded-lg transition-all duration-150"
                style={{ color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                <LogOut size={15} />
              </button>
            </Tooltip>
          ) : (
            <motion.button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-[13px] font-semibold transition-all duration-150"
              style={{
                color: isDark ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.5)',
                border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.09)',
                background: 'transparent',
              }}
              whileHover={{ background: 'rgba(200,155,60,0.08)', borderColor: 'rgba(200,155,60,0.2)', color: '#C89B3C' }}
              whileTap={{ scale: 0.98 }}
            >
              <LogOut size={14} />
              Sair
            </motion.button>
          )}
        </div>

        {/* ── Controls bar ─────────────────────────────────────── */}
        <div
          className="flex items-center"
          style={{
            padding: '8px',
            borderTop: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.06)',
            background: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.03)',
            justifyContent: collapsed ? 'center' : 'flex-end',
            gap: 6,
          }}
        >
          {collapsed ? (
            <CtrlBtn onClick={toggleCollapse} title="Expandir sidebar">
              <ChevronRight size={14} />
            </CtrlBtn>
          ) : (
            <>
              <CtrlBtn onClick={toggleCollapse} title="Recolher sidebar">
                <ChevronLeft size={14} />
              </CtrlBtn>
              <CtrlBtn
                onClick={() => setMode(mode === 'hover' ? 'expanded' : 'hover')}
                title={mode === 'hover' ? 'Desativar modo hover' : 'Modo hover (aparece ao passar o mouse)'}
                active={mode === 'hover'}
              >
                <MousePointer2 size={13} />
              </CtrlBtn>
              <CtrlBtn
                onClick={() => setMode(mode === 'pinned' ? 'expanded' : 'pinned')}
                title={mode === 'pinned' ? 'Desafixar sidebar' : 'Fixar sidebar (sempre visível)'}
                active={mode === 'pinned'}
              >
                {mode === 'pinned' ? <PinOff size={13} /> : <Pin size={13} />}
              </CtrlBtn>
            </>
          )}
        </div>

      </motion.aside>
    </>
  )
}
