'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Search, Bell, Plus, Menu, Clock, CheckSquare } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useSidebar } from './SidebarContext'

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
  const { toggle } = useSidebar()

  const config =
    Object.entries(pageConfig).find(
      ([path]) => pathname === path || pathname.startsWith(path + '/')
    )?.[1] ?? { title: 'Norma' }

  const [busca, setBusca] = useState('')
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([])
  const [dropdownAberto, setDropdownAberto] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch('/api/notificacoes')
      .then(r => r.ok ? r.json() : [])
      .then(setNotificacoes)
      .catch(() => {})
  }, [pathname])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownAberto(false)
      }
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

  return (
    <header style={{
      background: 'var(--surface)',
      borderBottom: '1px solid var(--border)',
      height: '60px',
      padding: '0 20px',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      position: 'sticky',
      top: 0,
      zIndex: 40,
    }}>
      {/* Hambúrguer (mobile) */}
      <button
        onClick={toggle}
        className="md:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors flex-shrink-0"
        aria-label="Abrir menu"
      >
        <Menu size={20} />
      </button>

      <span style={{ fontSize: '17px', fontWeight: 600, color: 'var(--text)' }} className="hidden md:block">
        {config.title}
      </span>
      <span style={{ fontSize: '17px', fontWeight: 600, color: 'var(--text)' }} className="md:hidden">
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
        }} className="hidden sm:flex">
          <Search size={14} style={{ color: 'var(--text3)', flexShrink: 0 }} />
          <input
            type="text"
            placeholder="Buscar clientes..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
            onKeyDown={handleBuscaKeyDown}
            style={{
              border: 'none', background: 'transparent', outline: 'none',
              fontSize: '13px', color: 'var(--text)', width: '160px',
              fontFamily: 'inherit',
            }}
          />
        </div>

        {/* Notificações */}
        <div ref={dropdownRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setDropdownAberto(o => !o)}
            style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: '34px', height: '34px',
              borderRadius: 'var(--radius)',
              border: 'none',
              background: dropdownAberto ? 'var(--surface2)' : 'transparent',
              cursor: 'pointer',
              position: 'relative',
              color: 'var(--text2)',
            }}
            title={`${total} notificação${total !== 1 ? 'ões' : ''}`}
          >
            <Bell size={18} />
            {total > 0 && (
              <span style={{
                position: 'absolute', top: '5px', right: '5px',
                minWidth: '16px', height: '16px',
                background: urgentes > 0 ? 'var(--red)' : 'var(--accent2)',
                color: '#fff',
                borderRadius: '8px',
                border: '1.5px solid var(--surface)',
                fontSize: '9px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0 3px',
              }}>
                {total > 9 ? '9+' : total}
              </span>
            )}
          </button>

          {dropdownAberto && (
            <div style={{
              position: 'absolute', top: '42px', right: 0,
              width: '340px',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
              zIndex: 100,
              overflow: 'hidden',
            }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>Notificações</span>
                {total > 0 && (
                  <span style={{ fontSize: '11px', color: 'var(--text3)' }}>{total} item{total !== 1 ? 'ns' : ''}</span>
                )}
              </div>
              {notificacoes.length === 0 ? (
                <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text3)', fontSize: '13px' }}>
                  Nenhuma notificação pendente
                </div>
              ) : (
                <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
                  {notificacoes.map(n => (
                    <Link
                      key={n.id}
                      href={n.href}
                      onClick={() => setDropdownAberto(false)}
                      style={{
                        display: 'flex', gap: '10px', padding: '12px 16px',
                        borderBottom: '1px solid var(--surface2)',
                        textDecoration: 'none',
                        background: n.urgente ? 'var(--red-light)' : 'transparent',
                        transition: 'background 0.1s',
                      }}
                    >
                      <div style={{
                        width: '28px', height: '28px', borderRadius: '8px', flexShrink: 0,
                        background: n.tipo === 'prazo' ? (n.urgente ? 'var(--red)' : 'var(--amber)') : 'var(--accent2)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#fff',
                      }}>
                        {n.tipo === 'prazo' ? <Clock size={13} /> : <CheckSquare size={13} />}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {n.titulo}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text3)', marginTop: '2px' }}>
                          {n.descricao}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Botão Novo */}
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
              whiteSpace: 'nowrap',
            }}
          >
            <Plus size={14} />
            <span className="hidden sm:inline">{config.btnLabel}</span>
          </Link>
        )}
      </div>
    </header>
  )
}
