'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Search, Bell, Plus } from 'lucide-react'

const pageConfig: Record<string, { title: string; btnLabel?: string; btnHref?: string }> = {
  '/dashboard':    { title: 'Dashboard' },
  '/clientes':     { title: 'Clientes',        btnLabel: 'Novo Cliente',     btnHref: '/clientes/novo' },
  '/processos':    { title: 'Processos',        btnLabel: 'Novo Processo',    btnHref: '/processos/novo' },
  '/tarefas':      { title: 'Tarefas',          btnLabel: 'Nova Tarefa',      btnHref: '/tarefas/novo' },
  '/prazos':       { title: 'Prazos',           btnLabel: 'Novo Prazo',       btnHref: '/prazos/novo' },
  '/comercial':    { title: 'Comercial / CRM' },
  '/financeiro':   { title: 'Financeiro' },
  '/controladoria':{ title: 'Controladoria' },
  '/marketing':    { title: 'Marketing' },
  '/usuarios':     { title: 'Usuários' },
  '/relatorios':   { title: 'Relatórios' },
  '/configuracoes':{ title: 'Configurações' },
}

export default function Topbar() {
  const pathname = usePathname()

  const config =
    Object.entries(pageConfig).find(
      ([path]) => pathname === path || pathname.startsWith(path + '/')
    )?.[1] ?? { title: 'JurisFlow' }

  return (
    <header style={{
      background: 'var(--surface)',
      borderBottom: '1px solid var(--border)',
      height: '60px',
      padding: '0 28px',
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      position: 'sticky',
      top: 0,
      zIndex: 50,
    }}>
      <span style={{ fontSize: '17px', fontWeight: 600, color: 'var(--text)' }}>
        {config.title}
      </span>

      <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px', alignItems: 'center' }}>

        {/* Barra de busca */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: '7px 12px',
          background: 'var(--surface2)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
        }}>
          <Search size={14} style={{ color: 'var(--text3)', flexShrink: 0 }} />
          <input
            type="text"
            placeholder="Buscar..."
            style={{
              border: 'none', background: 'transparent', outline: 'none',
              fontSize: '13px', color: 'var(--text)', width: '160px',
              fontFamily: 'inherit',
            }}
          />
        </div>

        {/* Notificações */}
        <button style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: '34px', height: '34px',
          borderRadius: 'var(--radius)',
          border: 'none',
          background: 'transparent',
          cursor: 'pointer',
          position: 'relative',
          color: 'var(--text2)',
        }}>
          <Bell size={18} />
          <span style={{
            position: 'absolute', top: '7px', right: '7px',
            width: '7px', height: '7px',
            background: 'var(--red)',
            borderRadius: '50%',
            border: '1.5px solid var(--surface)',
          }} />
        </button>

        {/* Botão Novo — apenas para páginas com rota /novo */}
        {config.btnLabel && config.btnHref && (
          <Link
            href={config.btnHref}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              padding: '7px 14px',
              borderRadius: 'var(--radius)',
              background: 'var(--accent2)',
              color: '#fff',
              fontSize: '13px',
              fontWeight: 500,
              textDecoration: 'none',
              transition: 'background 0.15s',
            }}
          >
            <Plus size={14} />
            {config.btnLabel}
          </Link>
        )}
      </div>
    </header>
  )
}
