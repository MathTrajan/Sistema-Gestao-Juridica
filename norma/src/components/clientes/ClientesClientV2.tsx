'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, Plus, X, XCircle, Rows, Rows3, CheckSquare, Square,
  Users, FileText, UserCheck, ExternalLink, ChevronRight,
  Mail, Phone, IdCard, Archive, Tag,
} from 'lucide-react'
import {
  PageHeader, KpiCard, ThSort, AvatarInicial, NovoBadge,
  DrawerShell, DrawerInfo, isNovo, fmtData, useDensidade,
} from '@/components/v2/shared'
import { formatDocumento, formatTelefone } from '@/lib/utils'

const areaLabels: Record<string, string> = {
  TRABALHISTA: 'Trabalhista', CIVIL: 'Cível', TRIBUTARIO: 'Tributário',
  PREVIDENCIARIO: 'Previdenciário', CRIMINAL: 'Criminal', FAMILIA: 'Família',
  EMPRESARIAL: 'Empresarial', CONSUMIDOR: 'Consumidor', AMBIENTAL: 'Ambiental', OUTRO: 'Outro',
}

const statusConfig: Record<string, { label: string; color: string; bg: string; border: string }> = {
  ATIVO:                  { label: 'Ativo',         color: '#22C55E', bg: 'rgba(34,197,94,0.12)',   border: 'rgba(34,197,94,0.35)' },
  INATIVO:                { label: 'Inativo',       color: '#9CA3AF', bg: 'rgba(156,163,175,0.12)', border: 'rgba(156,163,175,0.30)' },
  PROSPECTO:              { label: 'Prospecto',     color: '#3B82F6', bg: 'rgba(59,130,246,0.12)',  border: 'rgba(59,130,246,0.35)' },
  DOCUMENTACAO_PENDENTE:  { label: 'Doc. pendente', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)',  border: 'rgba(245,158,11,0.35)' },
}

interface Processo { id: string; numero: string | null; status: string; areaJuridica: string | null }
interface Cliente {
  id: string
  nomeCompleto: string
  tipo: string
  cpf: string | null
  cnpj: string | null
  email: string | null
  telefone: string | null
  status: string
  areaJuridica: string | null
  createdAt: string
  _count: { processos: number }
  processos: Processo[]
}

type SortKey = 'nome' | 'status' | 'processos' | 'created'

export default function ClientesClientV2({ clientes }: { clientes: Cliente[] }) {
  const [busca, setBusca] = useState('')
  const [statusFiltro, setStatusFiltro] = useState<string[]>([])
  const [areaFiltro, setAreaFiltro] = useState('')
  const [tipoFiltro, setTipoFiltro] = useState<'' | 'PESSOA_FISICA' | 'PESSOA_JURIDICA'>('')
  const [densidade, setDensidade] = useDensidade('clientes-v2:densidade')
  const [sortKey, setSortKey] = useState<SortKey>('created')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set())
  const [drawer, setDrawer] = useState<Cliente | null>(null)

  const query = busca.toLowerCase().trim()
  const filtrosAtivos = (statusFiltro.length > 0 ? 1 : 0) + (areaFiltro ? 1 : 0) + (tipoFiltro ? 1 : 0) + (query ? 1 : 0)

  const filtrados = useMemo(() => {
    const arr = clientes.filter((c) => {
      const matchBusca = !query
        || c.nomeCompleto.toLowerCase().includes(query)
        || c.email?.toLowerCase().includes(query)
        || c.cpf?.includes(query)
        || c.cnpj?.includes(query)
        || c.telefone?.includes(query)
      const matchStatus = statusFiltro.length === 0 || statusFiltro.includes(c.status)
      const matchArea = !areaFiltro || c.areaJuridica === areaFiltro
      const matchTipo = !tipoFiltro || c.tipo === tipoFiltro
      return matchBusca && matchStatus && matchArea && matchTipo
    })
    const cmpStr = (a: string, b: string) => (a > b ? 1 : a < b ? -1 : 0)
    arr.sort((a, b) => {
      let r = 0
      switch (sortKey) {
        case 'nome':      r = cmpStr(a.nomeCompleto.toLowerCase(), b.nomeCompleto.toLowerCase()); break
        case 'status':    r = cmpStr(a.status, b.status); break
        case 'processos': r = a._count.processos - b._count.processos; break
        default:          r = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      }
      return sortDir === 'asc' ? r : -r
    })
    return arr
  }, [clientes, query, statusFiltro, areaFiltro, tipoFiltro, sortKey, sortDir])

  const kpis = useMemo(() => {
    const total = clientes.length
    const ativos = clientes.filter((c) => c.status === 'ATIVO').length
    const comProc = clientes.filter((c) => c._count.processos > 0).length
    const limite = Date.now() - 30 * 86_400_000
    const novos30 = clientes.filter((c) => new Date(c.createdAt).getTime() >= limite).length
    return { total, ativos, comProc, novos30, pctAtivos: total ? Math.round((ativos / total) * 100) : 0, pctComProc: total ? Math.round((comProc / total) * 100) : 0 }
  }, [clientes])

  const cards = [
    { icon: Users, value: kpis.total, label: 'Total de clientes', hint: 'carteira', color: '#B8962A', bg: 'rgba(184,150,42,0.15)', progress: 100 },
    { icon: UserCheck, value: kpis.ativos, label: 'Ativos', hint: `${kpis.pctAtivos}%`, color: '#22C55E', bg: 'rgba(34,197,94,0.12)', progress: kpis.pctAtivos },
    { icon: FileText, value: kpis.comProc, label: 'Com processos', hint: `${kpis.pctComProc}%`, color: '#3B82F6', bg: 'rgba(59,130,246,0.12)', progress: kpis.pctComProc },
    { icon: Tag, value: kpis.novos30, label: 'Novos (30d)', hint: 'crescimento', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)', progress: Math.min(100, kpis.novos30 * 5) },
  ]

  const toggleStatus = (v: string) => setStatusFiltro((p) => (p.includes(v) ? p.filter((x) => x !== v) : [...p, v]))
  const limparFiltros = () => { setBusca(''); setStatusFiltro([]); setAreaFiltro(''); setTipoFiltro('') }
  const toggleSort = (k: SortKey) => { if (sortKey === k) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc')); else { setSortKey(k); setSortDir('asc') } }
  const todosSel = filtrados.length > 0 && filtrados.every((p) => selecionados.has(p.id))
  const algunsSel = !todosSel && filtrados.some((p) => selecionados.has(p.id))
  const toggleSelAll = () => setSelecionados(todosSel ? new Set() : new Set(filtrados.map((p) => p.id)))
  const toggleSel = (id: string) => setSelecionados((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n })

  const padY = densidade === 'compacto' ? 'py-2' : 'py-3.5'

  return (
    <div className="space-y-6">
      <PageHeader
        title="Clientes"
        subtitle="Carteira completa com status, processos vinculados e cadastros recentes."
        actions={
          <>
            <Link href="/clientes" className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground transition hover:bg-white/10">
              Voltar à v1
            </Link>
            <Link href="/clientes/novo" style={{ background: 'linear-gradient(135deg, #d4af37, #B8962A)' }} className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-black shadow-lg shadow-gold/20 transition hover:shadow-gold/30">
              <Plus size={16} />
              Novo cliente
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
            <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar por nome, CPF/CNPJ, email ou telefone…"
              className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-11 pr-10 text-sm text-foreground outline-none transition focus:border-[rgba(184,150,42,0.4)] focus:bg-white/[0.08]" />
            {busca && <button onClick={() => setBusca('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"><X size={14} /></button>}
          </div>
          <div className="flex items-center gap-2">
            <select value={tipoFiltro} onChange={(e) => setTipoFiltro(e.target.value as typeof tipoFiltro)} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-[rgba(184,150,42,0.4)]">
              <option value="">PF e PJ</option>
              <option value="PESSOA_FISICA">Pessoa Física</option>
              <option value="PESSOA_JURIDICA">Pessoa Jurídica</option>
            </select>
            <select value={areaFiltro} onChange={(e) => setAreaFiltro(e.target.value)} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-[rgba(184,150,42,0.4)]">
              <option value="">Todas as áreas</option>
              {Object.entries(areaLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
            <div className="flex items-center rounded-xl border border-white/10 bg-white/5 p-1">
              <button onClick={() => setDensidade('confortavel')} className={`flex h-8 w-8 items-center justify-center rounded-lg transition ${densidade === 'confortavel' ? 'bg-white/10 text-gold' : 'text-muted-foreground hover:text-foreground'}`}><Rows size={14} /></button>
              <button onClick={() => setDensidade('compacto')} className={`flex h-8 w-8 items-center justify-center rounded-lg transition ${densidade === 'compacto' ? 'bg-white/10 text-gold' : 'text-muted-foreground hover:text-foreground'}`}><Rows3 size={14} /></button>
            </div>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          {Object.entries(statusConfig).map(([v, cfg]) => {
            const active = statusFiltro.includes(v)
            return (
              <button key={v} onClick={() => toggleStatus(v)} className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition ${active ? 'ring-1 ring-inset ring-white/15' : 'bg-white/3 text-muted-foreground hover:bg-white/8'}`}
                style={active ? { background: cfg.bg, color: cfg.color, borderColor: cfg.border } : { borderColor: 'rgba(255,255,255,0.1)' }}>
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: cfg.color }} />
                {cfg.label}
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
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-semibold uppercase tracking-[0.24em] text-foreground">Carteira</h2>
            <span className="rounded-full border border-gold/30 bg-gold/12 px-2.5 py-0.5 text-[11px] font-semibold text-gold">{filtrados.length}</span>
          </div>
        </div>

        {filtrados.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-gold/30 bg-gold/10 text-gold"><Users size={28} /></div>
            <p className="text-base font-semibold text-foreground">{clientes.length === 0 ? 'Nenhum cliente cadastrado' : 'Nenhum resultado'}</p>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">{clientes.length === 0 ? 'Cadastre o primeiro cliente no botão acima.' : 'Ajuste os filtros ou a busca.'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px]">
              <thead>
                <tr className="border-b border-white/8 bg-white/[0.02]">
                  <th className="px-3 py-4 w-10">
                    <button onClick={toggleSelAll} className="text-muted-foreground hover:text-gold">
                      {todosSel ? <CheckSquare size={16} className="text-gold" /> : algunsSel ? <CheckSquare size={16} className="text-gold/60" /> : <Square size={16} />}
                    </button>
                  </th>
                  <ThSort<SortKey> label="Cliente" k="nome" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} />
                  <th className="px-5 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground hidden lg:table-cell">Documento</th>
                  <th className="px-5 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground hidden xl:table-cell">Contato</th>
                  <th className="px-5 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground hidden md:table-cell">Área</th>
                  <ThSort<SortKey> label="Processos" k="processos" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} hide="hidden md:table-cell" />
                  <ThSort<SortKey> label="Status" k="status" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} />
                  <th className="px-5 py-4" />
                </tr>
              </thead>
              <tbody>
                <AnimatePresence initial={false}>
                  {filtrados.map((c, i) => {
                    const sel = selecionados.has(c.id)
                    const st = statusConfig[c.status]
                    const doc = c.cpf || c.cnpj
                    const novo = isNovo(c.createdAt)
                    return (
                      <motion.tr key={c.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ delay: Math.min(i * 0.02, 0.2), duration: 0.25 }}
                        onClick={() => setDrawer(c)}
                        className={`group cursor-pointer border-b border-white/[0.05] transition-colors ${sel ? 'bg-gold/[0.06]' : 'hover:bg-gold/[0.04]'}`}>
                        <td className={`px-3 ${padY}`} onClick={(e) => e.stopPropagation()}>
                          <button onClick={() => toggleSel(c.id)} className="text-muted-foreground hover:text-gold">
                            {sel ? <CheckSquare size={16} className="text-gold" /> : <Square size={16} />}
                          </button>
                        </td>
                        <td className={`px-5 ${padY}`}>
                          <div className="flex items-center gap-3">
                            <AvatarInicial nome={c.nomeCompleto} />
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="truncate text-sm font-semibold text-foreground">{c.nomeCompleto}</span>
                                {novo && <NovoBadge />}
                              </div>
                              <div className="text-xs text-muted-foreground">{c.tipo === 'PESSOA_FISICA' ? 'Pessoa física' : 'Pessoa jurídica'}</div>
                            </div>
                          </div>
                        </td>
                        <td className={`px-5 ${padY} hidden lg:table-cell text-sm text-muted-foreground font-mono`}>{doc ? formatDocumento(doc) : '—'}</td>
                        <td className={`px-5 ${padY} hidden xl:table-cell`}>
                          <div className="text-xs text-foreground">{c.telefone ? formatTelefone(c.telefone) : '—'}</div>
                          <div className="text-[11px] text-muted-foreground">{c.email || '—'}</div>
                        </td>
                        <td className={`px-5 ${padY} hidden md:table-cell`}>
                          {c.areaJuridica ? <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-muted-foreground">{areaLabels[c.areaJuridica]}</span> : <span className="text-xs text-muted-foreground">—</span>}
                        </td>
                        <td className={`px-5 ${padY} hidden md:table-cell`}>
                          <span className="inline-flex items-center gap-1 rounded-full bg-gold/10 px-2 py-0.5 text-xs font-semibold text-gold">
                            {c._count.processos}
                          </span>
                        </td>
                        <td className={`px-5 ${padY}`}>
                          {st && (
                            <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium" style={{ background: st.bg, color: st.color, border: `1px solid ${st.border}` }}>
                              <span className="h-1.5 w-1.5 rounded-full" style={{ background: st.color }} />
                              {st.label}
                            </span>
                          )}
                        </td>
                        <td className={`px-5 ${padY} text-right`} onClick={(e) => e.stopPropagation()}>
                          <Link href={`/clientes/${c.id}`} className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground opacity-70 transition group-hover:border-gold/30 group-hover:bg-gold/10 group-hover:text-gold group-hover:opacity-100">
                            Ver <ExternalLink size={11} />
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
          <span>{filtrados.length} de {clientes.length}</span>
          {filtrosAtivos > 0 && <span className="rounded-full bg-gold/10 px-2.5 py-0.5 text-gold">{filtrosAtivos} filtro{filtrosAtivos !== 1 ? 's' : ''}</span>}
        </div>
      </div>

      <AnimatePresence>
        {selecionados.size > 0 && (
          <motion.div initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }} transition={{ type: 'spring', stiffness: 380, damping: 30 }} className="fixed bottom-6 left-1/2 z-30 -translate-x-1/2">
            <div className="flex items-center gap-3 rounded-2xl border border-gold/30 bg-[#161616]/95 px-4 py-3 shadow-2xl shadow-black/60 backdrop-blur-xl">
              <span className="rounded-full bg-gold/15 px-3 py-1 text-xs font-semibold text-gold">{selecionados.size} selecionado{selecionados.size !== 1 ? 's' : ''}</span>
              <div className="h-5 w-px bg-white/10" />
              <button className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:bg-white/10 hover:text-foreground" onClick={() => alert('Em breve: arquivar em lote')}>
                <Archive size={13} /> Arquivar
              </button>
              <button onClick={() => setSelecionados(new Set())} className="rounded-lg px-2 py-1.5 text-xs text-muted-foreground hover:text-foreground"><X size={14} /></button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {drawer && (
          <DrawerShell open={!!drawer} onClose={() => setDrawer(null)}>
            <div>
              <div className="flex items-center gap-3">
                <AvatarInicial nome={drawer.nomeCompleto} />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="truncate text-lg font-bold text-foreground">{drawer.nomeCompleto}</h3>
                    {isNovo(drawer.createdAt) && <NovoBadge />}
                  </div>
                  <p className="text-xs text-muted-foreground">{drawer.tipo === 'PESSOA_FISICA' ? 'Pessoa física' : 'Pessoa jurídica'} · cadastrado em {fmtData(drawer.createdAt)}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <DrawerInfo label="Documento" value={drawer.cpf ? formatDocumento(drawer.cpf) : drawer.cnpj ? formatDocumento(drawer.cnpj) : '—'} />
              <DrawerInfo label="Status" value={statusConfig[drawer.status]?.label || drawer.status} />
              <DrawerInfo label="Área" value={drawer.areaJuridica ? areaLabels[drawer.areaJuridica] : '—'} />
              <DrawerInfo label="Processos" value={String(drawer._count.processos)} />
            </div>

            <section>
              <h4 className="text-[11px] font-semibold uppercase tracking-[0.28em] text-muted-foreground">Contato</h4>
              <div className="mt-2 space-y-2">
                {drawer.telefone && (
                  <a href={`tel:${drawer.telefone}`} className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-foreground transition hover:bg-white/10">
                    <Phone size={14} className="text-gold" />
                    {formatTelefone(drawer.telefone)}
                  </a>
                )}
                {drawer.email && (
                  <a href={`mailto:${drawer.email}`} className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-foreground transition hover:bg-white/10">
                    <Mail size={14} className="text-gold" />
                    {drawer.email}
                  </a>
                )}
                {!drawer.telefone && !drawer.email && <p className="text-sm text-muted-foreground">Sem dados de contato.</p>}
              </div>
            </section>

            <section>
              <div className="flex items-center justify-between">
                <h4 className="text-[11px] font-semibold uppercase tracking-[0.28em] text-muted-foreground">Processos recentes</h4>
                <span className="text-[11px] text-muted-foreground">{drawer._count.processos} total</span>
              </div>
              {drawer.processos.length > 0 ? (
                <ul className="mt-2 space-y-2">
                  {drawer.processos.map((p) => (
                    <li key={p.id}>
                      <Link href={`/processos/${p.id}`} className="block rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 transition hover:border-gold/30 hover:bg-gold/8">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono text-xs text-gold">{p.numero || '—'}</span>
                          <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">{p.status.toLowerCase().replace('_', ' ')}</span>
                        </div>
                        {p.areaJuridica && <p className="mt-1 text-[11px] text-muted-foreground">{areaLabels[p.areaJuridica]}</p>}
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : <p className="mt-2 text-sm text-muted-foreground">Nenhum processo vinculado.</p>}
            </section>

            <Link href={`/clientes/${drawer.id}`} style={{ background: 'linear-gradient(135deg, #d4af37, #B8962A)' }} className="inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-black shadow-lg shadow-gold/20 transition hover:shadow-gold/30">
              Abrir ficha completa <ChevronRight size={16} />
            </Link>
          </DrawerShell>
        )}
      </AnimatePresence>
    </div>
  )
}
