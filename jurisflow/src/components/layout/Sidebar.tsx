'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import {
  LayoutDashboard,
  Users,
  FileText,
  CheckSquare,
  Clock,
  TrendingUp,
  DollarSign,
  BookOpen,
  Megaphone,
  BarChart2,
  Settings,
  LogOut,
  UserCog,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface SidebarProps {
  user: { nome: string; perfil: string } | null
  badgeTarefas: number
  badgePrazos: number
}

const perfilLabels: Record<string, string> = {
  GESTOR_GERAL: 'Gestor Geral',
  GERENTE: 'Gerente',
  COLABORADOR: 'Colaborador',
}

function getInitials(nome: string) {
  const parts = nome.trim().split(' ').filter(Boolean)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
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
  { label: 'Financeiro',      href: '/financeiro',     icon: DollarSign },
  { label: 'Controladoria',   href: '/controladoria',  icon: BookOpen },
  { label: 'Marketing',       href: '/marketing',      icon: Megaphone },
]

const systemItems = [
  { label: 'Usuários',       href: '/usuarios',      icon: UserCog },
  { label: 'Relatórios',     href: '/relatorios',    icon: BarChart2 },
  { label: 'Configurações',  href: '/configuracoes', icon: Settings },
]

export default function Sidebar({ user, badgeTarefas, badgePrazos }: SidebarProps) {
  const pathname = usePathname()

  function NavLink({
    href, label, icon: Icon, badge, badgeRed,
  }: {
    href: string; label: string; icon: React.ElementType
    badge?: number; badgeRed?: boolean
  }) {
    const active = pathname === href || pathname.startsWith(href + '/')
    return (
      <Link
        href={href}
        className={cn(
          'flex items-center gap-2.5 px-5 py-[9px] text-[13.5px] transition-all border-l-2',
          active
            ? 'text-white bg-white/10 border-l-[#a8c8b4] font-medium'
            : 'text-white/60 border-transparent hover:text-white hover:bg-white/[0.06]'
        )}
      >
        <Icon size={15} style={{ opacity: active ? 1 : 0.8, flexShrink: 0 }} />
        <span>{label}</span>
        {badge != null && badge > 0 && (
          <span style={{
            marginLeft: 'auto',
            background: badgeRed ? 'var(--red)' : 'var(--gold)',
            color: '#fff',
            fontSize: '10px',
            fontWeight: 600,
            padding: '1px 6px',
            borderRadius: '20px',
            minWidth: '18px',
            textAlign: 'center' as const,
          }}>
            {badge}
          </span>
        )}
      </Link>
    )
  }

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-60 bg-[#1a3a2a] flex flex-col z-50">

      {/* Logo */}
      <div style={{ padding: '28px 20px 24px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <span style={{
          fontFamily: '"DM Serif Display", serif',
          fontSize: '22px',
          color: '#fff',
          letterSpacing: '-0.3px',
          display: 'block',
        }}>
          JurisFlow
        </span>
        <span style={{
          fontSize: '11px',
          color: 'rgba(255,255,255,0.45)',
          marginTop: '2px',
          letterSpacing: '0.5px',
          textTransform: 'uppercase',
          display: 'block',
        }}>
          Gestão Jurídica
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4">
        <div className="px-5 mb-1.5">
          <span className="text-white/30 text-[10px] uppercase tracking-widest font-semibold">
            Principal
          </span>
        </div>
        {navItems.map((item) => (
          <NavLink
            key={item.href}
            href={item.href}
            label={item.label}
            icon={item.icon}
            badge={
              item.href === '/tarefas' ? badgeTarefas
              : item.href === '/prazos' ? badgePrazos
              : undefined
            }
            badgeRed={item.href === '/prazos'}
          />
        ))}

        <div className="px-5 mt-4 mb-1.5">
          <span className="text-white/30 text-[10px] uppercase tracking-widest font-semibold">
            Departamentos
          </span>
        </div>
        {deptItems.map((item) => (
          <NavLink key={item.href} href={item.href} label={item.label} icon={item.icon} />
        ))}

        <div className="px-5 mt-4 mb-1.5">
          <span className="text-white/30 text-[10px] uppercase tracking-widest font-semibold">
            Sistema
          </span>
        </div>
        {systemItems.map((item) => (
          <NavLink key={item.href} href={item.href} label={item.label} icon={item.icon} />
        ))}
      </nav>

      {/* Usuário + Logout */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', padding: '16px 20px' }}>
        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <div style={{
              width: '34px', height: '34px', borderRadius: '50%',
              background: 'var(--accent3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '13px', fontWeight: 600, color: '#fff', flexShrink: 0,
            }}>
              {getInitials(user.nome)}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{
                fontSize: '13px', color: 'rgba(255,255,255,0.85)',
                fontWeight: 500, lineHeight: 1.2,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {user.nome}
              </div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '1px' }}>
                {perfilLabels[user.perfil] ?? user.perfil}
              </div>
            </div>
          </div>
        )}
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="flex items-center gap-2 text-white/40 hover:text-white text-sm transition-colors"
        >
          <LogOut size={14} />
          Sair
        </button>
      </div>

    </aside>
  )
}
