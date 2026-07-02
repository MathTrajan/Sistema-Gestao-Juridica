'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, Plus, X, XCircle, Rows, Rows3,
  Users, UserCheck, UserX, Crown, Shield, Briefcase,
  ExternalLink, ChevronRight, Mail, Phone, BadgeCheck,
} from 'lucide-react'
import {
  PageHeader, KpiCard, ThSort, AvatarInicial, NovoBadge,
  DrawerShell, DrawerInfo, isNovo, fmtData, useDensidade,
} from '@/components/v2/shared'

const perfilLabels: Record<string, string> = { GESTOR_GERAL: 'Gestor Geral', GERENTE: 'Gerente', COLABORADOR: 'Colaborador' }
const perfilConfig: Record<string, { color: string; bg: string; border: string; icon: typeof Crown }> = {
  GESTOR_GERAL: { color: '#B8962A', bg: 'rgba(184,150,42,0.15)', border: 'rgba(184,150,42,0.40)', icon: Crown },
  GERENTE:      { color: '#3B82F6', bg: 'rgba(59,130,246,0.12)', border: 'rgba(59,130,246,0.35)', icon: Shield },
  COLABORADOR:  { color: '#9CA3AF', bg: 'rgba(156,163,175,0.12)', border: 'rgba(156,163,175,0.30)', icon: Briefcase },
}
const areaLabels: Record<string, string> = { COMERCIAL: 'Comercial', CONTROLADORIA: 'Controladoria', JURIDICO: 'Jurídico', FINANCEIRO: 'Financeiro', MARKETING: 'Marketing' }

interface Usuario {
  id: string
  nome: string
  email: string
  perfil: string
  area: string | null
  oab: string | null
  telefone: string | null
  ativo: boolean
  createdAt: string
}

type SortKey = 'nome' | 'perfil' | 'created'

export default function UsuariosClientV2({ usuarios, sessaoId }: { usuarios: Usuario[]; sessaoId: string }) {
  const [busca, setBusca] = useState('')
  const [perfilFiltro, setPerfilFiltro] = useState<string[]>([])
  const [areaFiltro, setAreaFiltro] = useState('')
  const [ativoFiltro, setAtivoFiltro] = useState<'todos' | 'ativos' | 'inativos'>('ativos')
  const [densidade, setDensidade] = useDensidade('usuarios-v2:densidade')
  const [sortKey, setSortKey] = useState<SortKey>('created')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [drawer, setDrawer] = useState<Usuario | null>(null)

  const query = busca.toLowerCase().trim()
  const filtrosAtivos = (perfilFiltro.length > 0 ? 1 : 0) + (areaFiltro ? 1 : 0) + (ativoFiltro !== 'ativos' ? 1 : 0) + (query ? 1 : 0)

  const filtrados = useMemo(() => {
    const arr = usuarios.filter((u) => {
      const matchBusca = !query || u.nome.toLowerCase().includes(query) || u.email.toLowerCase().includes(query) || u.oab?.toLowerCase().includes(query)
      const matchPerfil = perfilFiltro.length === 0 || perfilFiltro.includes(u.perfil)
      const matchArea = !areaFiltro || u.area === areaFiltro
      const matchAtivo = ativoFiltro === 'todos' ? true : ativoFiltro === 'ativos' ? u.ativo : !u.ativo
      return matchBusca && matchPerfil && matchArea && matchAtivo
    })
    const cmpStr = (a: string, b: string) => (a > b ? 1 : a < b ? -1 : 0)
    arr.sort((a, b) => {
      let r = 0
      switch (sortKey) {
        case 'nome':   r = cmpStr(a.nome.toLowerCase(), b.nome.toLowerCase()); break
        case 'perfil': r = cmpStr(a.perfil, b.perfil); break
        default:       r = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      }
      return sortDir === 'asc' ? r : -r
    })
    return arr
  }, [usuarios, query, perfilFiltro, areaFiltro, ativoFiltro, sortKey, sortDir])

  const kpis = useMemo(() => {
    const total = usuarios.length
    const ativos = usuarios.filter((u) => u.ativo).length
    const gestores = usuarios.filter((u) => u.perfil === 'GESTOR_GERAL' || u.perfil === 'GERENTE').length
    const colab = usuarios.filter((u) => u.perfil === 'COLABORADOR').length
    return { total, ativos, gestores, colab, pctAtivos: total ? Math.round((ativos / total) * 100) : 0 }
  }, [usuarios])

  const cards = [
    { icon: Users, value: kpis.total, label: 'Total na equipe', hint: 'cadastrados', color: '#B8962A', bg: 'rgba(184,150,42,0.15)', progress: 100 },
    { icon: UserCheck, value: kpis.ativos, label: 'Ativos', hint: `${kpis.pctAtivos}%`, color: '#22C55E', bg: 'rgba(34,197,94,0.12)', progress: kpis.pctAtivos },
    { icon: Crown, value: kpis.gestores, label: 'Gestores', hint: 'admin', color: '#3B82F6', bg: 'rgba(59,130,246,0.12)', progress: kpis.total ? Math.round((kpis.gestores / kpis.total) * 100) : 0 },
    { icon: Briefcase, value: kpis.colab, label: 'Colaboradores', hint: 'operação', color: '#9CA3AF', bg: 'rgba(156,163,175,0.12)', progress: kpis.total ? Math.round((kpis.colab / kpis.total) * 100) : 0 },
  ]

  const togglePerfil = (v: string) => setPerfilFiltro((p) => (p.includes(v) ? p.filter((x) => x !== v) : [...p, v]))
  const limparFiltros = () => { setBusca(''); setPerfilFiltro([]); setAreaFiltro(''); setAtivoFiltro('ativos') }
  const toggleSort = (k: SortKey) => { if (sortKey === k) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc')); else { setSortKey(k); setSortDir('asc') } }

  const padY = densidade === 'compacto' ? 'py-2' : 'py-3.5'

  return (
    <div className="space-y-6">
      <PageHeader
        title="Usuários"
        subtitle="Equipe do escritório, perfis de acesso e áreas de atuação."
        actions={
          <>
            <Link href="/usuarios" className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground transition hover:bg-white/10">
              Voltar à v1
            </Link>
            <Link href="/usuarios/novo" style={{ background: 'linear-gradient(135deg, #d4af37, #B8962A)' }} className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-black shadow-lg shadow-gold/20 transition hover:shadow-gold/30">
              <Plus size={16} /> Novo usuário
            </Link>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((c, i) => <KpiCard key={c.label} {...c} delay={i * 0.06} />)}
      </div>

      <div className="sticky top-2 z-10 glass-card rounded-2xl p-4 backdrop-blur-xl">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar por nome, email ou OAB…"
              className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-11 pr-10 text-sm text-foreground outline-none transition focus:border-[rgba(184,150,42,0.4)] focus:bg-white/[0.08]" />
            {busca && <button onClick={() => setBusca('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"><X size={14} /></button>}
          </div>
          <div className="flex items-center gap-2">
            <select value={areaFiltro} onChange={(e) => setAreaFiltro(e.target.value)} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-[rgba(184,150,42,0.4)]">
              <option value="">Todas as áreas</option>
              {Object.entries(areaLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
            <select value={ativoFiltro} onChange={(e) => setAtivoFiltro(e.target.value as typeof ativoFiltro)} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-[rgba(184,150,42,0.4)]">
              <option value="ativos">Ativos</option>
              <option value="inativos">Inativos</option>
              <option value="todos">Todos</option>
            </select>
            <div className="flex items-center rounded-xl border border-white/10 bg-white/5 p-1">
              <button onClick={() => setDensidade('confortavel')} className={`flex h-8 w-8 items-center justify-center rounded-lg transition ${densidade === 'confortavel' ? 'bg-white/10 text-gold' : 'text-muted-foreground hover:text-foreground'}`}><Rows size={14} /></button>
              <button onClick={() => setDensidade('compacto')} className={`flex h-8 w-8 items-center justify-center rounded-lg transition ${densidade === 'compacto' ? 'bg-white/10 text-gold' : 'text-muted-foreground hover:text-foreground'}`}><Rows3 size={14} /></button>
            </div>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          {Object.entries(perfilConfig).map(([v, cfg]) => {
            const active = perfilFiltro.includes(v)
            return (
              <button key={v} onClick={() => togglePerfil(v)} className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition ${active ? 'ring-1 ring-inset ring-white/15' : 'bg-white/3 text-muted-foreground hover:bg-white/8'}`}
                style={active ? { background: cfg.bg, color: cfg.color, borderColor: cfg.border } : { borderColor: 'rgba(255,255,255,0.1)' }}>
                <cfg.icon size={11} />
                {perfilLabels[v]}
              </button>
            )
          })}
          {filtrosAtivos > 0 && (
            <button onClick={limparFiltros} className="ml-auto inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-muted-foreground transition hover:bg-white/10 hover:text-foreground">
              <XCircle size={12} /> Limpar
            </button>
          )}
        </div>
      </div>

      <div className="glass-card overflow-hidden rounded-3xl">
        <div className="flex items-center justify-between border-b border-white/8 px-5 py-4">
          <h2 className="text-sm font-semibold uppercase tracking-[0.24em] text-foreground">Equipe</h2>
          <span className="rounded-full border border-gold/30 bg-gold/12 px-2.5 py-0.5 text-[11px] font-semibold text-gold">{filtrados.length}</span>
        </div>

        {filtrados.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-gold/30 bg-gold/10 text-gold"><Users size={28} /></div>
            <p className="text-base font-semibold text-foreground">{usuarios.length === 0 ? 'Nenhum usuário' : 'Nenhum resultado'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px]">
              <thead>
                <tr className="border-b border-white/8 bg-white/[0.02]">
                  <ThSort<SortKey> label="Usuário" k="nome" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} />
                  <ThSort<SortKey> label="Perfil" k="perfil" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} />
                  <th className="px-5 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground hidden md:table-cell">Área</th>
                  <th className="px-5 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground hidden lg:table-cell">OAB</th>
                  <th className="px-5 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">Status</th>
                  <th className="px-5 py-4" />
                </tr>
              </thead>
              <tbody>
                <AnimatePresence initial={false}>
                  {filtrados.map((u, i) => {
                    const cfg = perfilConfig[u.perfil]
                    const novo = isNovo(u.createdAt)
                    const eu = u.id === sessaoId
                    return (
                      <motion.tr key={u.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ delay: Math.min(i * 0.02, 0.2), duration: 0.25 }}
                        onClick={() => setDrawer(u)}
                        className="group cursor-pointer border-b border-white/[0.05] transition-colors hover:bg-gold/[0.04]">
                        <td className={`px-5 ${padY}`}>
                          <div className="flex items-center gap-3">
                            <AvatarInicial nome={u.nome} />
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="truncate text-sm font-semibold text-foreground">{u.nome}</span>
                                {novo && <NovoBadge />}
                                {eu && <span className="rounded-full border border-gold/30 bg-gold/12 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-gold">Você</span>}
                              </div>
                              <div className="truncate text-xs text-muted-foreground">{u.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className={`px-5 ${padY}`}>
                          {cfg && (
                            <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium" style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
                              <cfg.icon size={11} />
                              {perfilLabels[u.perfil]}
                            </span>
                          )}
                        </td>
                        <td className={`px-5 ${padY} hidden md:table-cell`}>
                          {u.area ? <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-muted-foreground">{areaLabels[u.area]}</span> : <span className="text-xs text-muted-foreground">—</span>}
                        </td>
                        <td className={`px-5 ${padY} hidden lg:table-cell font-mono text-xs text-muted-foreground`}>{u.oab || '—'}</td>
                        <td className={`px-5 ${padY}`}>
                          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${u.ativo ? 'bg-emerald-400/15 text-emerald-400 border border-emerald-400/30' : 'bg-white/8 text-muted-foreground border border-white/10'}`}>
                            <span className="h-1.5 w-1.5 rounded-full" style={{ background: u.ativo ? '#22C55E' : '#9CA3AF' }} />
                            {u.ativo ? 'Ativo' : 'Inativo'}
                          </span>
                        </td>
                        <td className={`px-5 ${padY} text-right`} onClick={(e) => e.stopPropagation()}>
                          <Link href={`/usuarios/${u.id}/editar`} className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground opacity-70 transition group-hover:border-gold/30 group-hover:bg-gold/10 group-hover:text-gold group-hover:opacity-100">
                            Editar <ExternalLink size={11} />
                          </Link>
                        </td>
                      </motion.tr>
                    )
                  })}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}

        <div className="flex items-center justify-between border-t border-white/8 px-5 py-3 text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
          <span>{filtrados.length} de {usuarios.length}</span>
          {filtrosAtivos > 0 && <span className="rounded-full bg-gold/10 px-2.5 py-0.5 text-gold">{filtrosAtivos} filtro{filtrosAtivos !== 1 ? 's' : ''}</span>}
        </div>
      </div>

      <AnimatePresence>
        {drawer && (
          <DrawerShell open={!!drawer} onClose={() => setDrawer(null)}>
            <div className="flex items-center gap-3">
              <AvatarInicial nome={drawer.nome} />
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="truncate text-lg font-bold text-foreground">{drawer.nome}</h3>
                  {drawer.ativo ? <BadgeCheck size={16} className="text-emerald-400" /> : <UserX size={16} className="text-muted-foreground" />}
                </div>
                <p className="text-xs text-muted-foreground">Desde {fmtData(drawer.createdAt)}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <DrawerInfo label="Perfil" value={perfilLabels[drawer.perfil] || drawer.perfil} />
              <DrawerInfo label="Área" value={drawer.area ? areaLabels[drawer.area] : '—'} />
              <DrawerInfo label="OAB" value={drawer.oab || '—'} />
              <DrawerInfo label="Status" value={drawer.ativo ? 'Ativo' : 'Inativo'} />
            </div>

            <section>
              <h4 className="text-[11px] font-semibold uppercase tracking-[0.28em] text-muted-foreground">Contato</h4>
              <div className="mt-2 space-y-2">
                <a href={`mailto:${drawer.email}`} className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-foreground transition hover:bg-white/10">
                  <Mail size={14} className="text-gold" />{drawer.email}
                </a>
                {drawer.telefone && (
                  <a href={`tel:${drawer.telefone}`} className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-foreground transition hover:bg-white/10">
                    <Phone size={14} className="text-gold" />{drawer.telefone}
                  </a>
                )}
              </div>
            </section>

            <Link href={`/usuarios/${drawer.id}/editar`} style={{ background: 'linear-gradient(135deg, #d4af37, #B8962A)' }} className="inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-black shadow-lg shadow-gold/20">
              Editar usuário <ChevronRight size={16} />
            </Link>
          </DrawerShell>
        )}
      </AnimatePresence>
    </div>
  )
}
