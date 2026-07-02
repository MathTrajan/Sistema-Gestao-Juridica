'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  FileText,
  Clock3,
  Scale,
  ExternalLink,
  Plus,
  Rows3,
  Rows,
  CheckCircle2,
  XCircle,
  X,
  ArrowUpDown,
  Sparkles,
  Calendar,
  AlertTriangle,
  Archive,
  UserCog,
  CheckSquare,
  Square,
  AlarmClock,
  ChevronRight,
} from 'lucide-react'

const areaLabels: Record<string, string> = {
  TRABALHISTA: 'Trabalhista',
  CIVIL: 'Cível',
  TRIBUTARIO: 'Tributário',
  PREVIDENCIARIO: 'Previdenciário',
  CRIMINAL: 'Criminal',
  FAMILIA: 'Família',
  EMPRESARIAL: 'Empresarial',
  CONSUMIDOR: 'Consumidor',
  AMBIENTAL: 'Ambiental',
  OUTRO: 'Outro',
}

const faseConfig: Record<string, { label: string; dot: string; chip: string }> = {
  CONHECIMENTO: { label: 'Conhecimento', dot: '#3B82F6', chip: 'bg-info-bg text-info border border-info/20' },
  RECURSAL: { label: 'Recursal', dot: '#F59E0B', chip: 'bg-warning-bg text-warning border border-warning/20' },
  EXECUCAO: { label: 'Execução', dot: '#B8962A', chip: 'bg-gold/12 text-gold border border-gold/25' },
  ENCERRADO: { label: 'Encerrado', dot: '#9CA3AF', chip: 'bg-white/8 text-muted-foreground border border-white/10' },
}

const statusConfig: Record<string, { label: string; dot: string; chip: string }> = {
  EM_ANDAMENTO: { label: 'Em andamento', dot: '#22C55E', chip: 'bg-success-bg text-success border border-success/20' },
  AGUARDANDO_PECA: { label: 'Aguard. peça', dot: '#F59E0B', chip: 'bg-warning-bg text-warning border border-warning/20' },
  AGUARDANDO_CLIENTE: { label: 'Aguard. cliente', dot: '#3B82F6', chip: 'bg-info-bg text-info border border-info/20' },
  SUSPENSO: { label: 'Suspenso', dot: '#9CA3AF', chip: 'bg-white/8 text-muted-foreground border border-white/10' },
  ENCERRADO_PROCEDENTE: { label: 'Procedente', dot: '#22C55E', chip: 'bg-success-bg text-success border border-success/20' },
  ENCERRADO_IMPROCEDENTE: { label: 'Improcedente', dot: '#EF4444', chip: 'bg-danger-bg text-danger border border-danger/20' },
  ARQUIVADO: { label: 'Arquivado', dot: '#9CA3AF', chip: 'bg-white/8 text-muted-foreground border border-white/10' },
}

const statusOptions = [
  { value: 'EM_ANDAMENTO', label: 'Em andamento' },
  { value: 'AGUARDANDO_PECA', label: 'Aguard. peça' },
  { value: 'AGUARDANDO_CLIENTE', label: 'Aguard. cliente' },
  { value: 'SUSPENSO', label: 'Suspenso' },
  { value: 'ENCERRADO_PROCEDENTE', label: 'Procedente' },
  { value: 'ENCERRADO_IMPROCEDENTE', label: 'Improcedente' },
  { value: 'ARQUIVADO', label: 'Arquivado' },
]

interface ProximoPrazo {
  id: string
  titulo: string
  dataFinal: string
  tipo: string
}

interface TarefaAberta {
  id: string
  titulo: string
  status: string
  prioridade: string
  dataVencimento: string | null
}

interface Processo {
  id: string
  numero: string | null
  tipoAcao: string | null
  areaJuridica: string | null
  tribunal: string | null
  fase: string
  status: string
  createdAt: string
  cliente: { id: string; nomeCompleto: string }
  responsavel: { nome: string } | null
  _count: { prazos: number; tarefas: number }
  proximoPrazo: ProximoPrazo | null
  tarefasAbertas: TarefaAberta[]
}

type SortKey = 'numero' | 'cliente' | 'tribunal' | 'fase' | 'status' | 'prazo'

const DENSIDADE_KEY = 'processos-v2:densidade'

function getInitials(nome: string) {
  const parts = nome.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '–'
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase()
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase()
}

function diasAte(iso: string): number {
  const alvo = new Date(iso)
  const hoje = new Date()
  alvo.setHours(0, 0, 0, 0)
  hoje.setHours(0, 0, 0, 0)
  return Math.round((alvo.getTime() - hoje.getTime()) / 86_400_000)
}

function isNovo(iso: string): boolean {
  return Date.now() - new Date(iso).getTime() < 86_400_000
}

function fmtData(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })
}

function prazoBadge(d: number): { label: string; color: string; bg: string; border: string; icon: typeof AlarmClock } {
  if (d < 0) return { label: `${Math.abs(d)}d vencido`, color: '#EF4444', bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.3)', icon: AlertTriangle }
  if (d === 0) return { label: 'Hoje', color: '#EF4444', bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.3)', icon: AlarmClock }
  if (d <= 3) return { label: `Em ${d}d`, color: '#F59E0B', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)', icon: AlarmClock }
  if (d <= 7) return { label: `Em ${d}d`, color: '#F59E0B', bg: 'rgba(245,158,11,0.10)', border: 'rgba(245,158,11,0.25)', icon: Calendar }
  return { label: `Em ${d}d`, color: '#9CA3AF', bg: 'rgba(156,163,175,0.10)', border: 'rgba(156,163,175,0.20)', icon: Calendar }
}

export default function ProcessosClientV2({ processos }: { processos: Processo[] }) {
  const [busca, setBusca] = useState('')
  const [statusFiltro, setStatusFiltro] = useState<string[]>([])
  const [areaFiltro, setAreaFiltro] = useState<string>('')
  const [densidade, setDensidade] = useState<'confortavel' | 'compacto'>('confortavel')
  const [sortKey, setSortKey] = useState<SortKey>('numero')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set())
  const [drawerProcesso, setDrawerProcesso] = useState<Processo | null>(null)

  // Lembrar densidade
  useEffect(() => {
    const saved = localStorage.getItem(DENSIDADE_KEY)
    if (saved === 'compacto' || saved === 'confortavel') setDensidade(saved)
  }, [])
  useEffect(() => { localStorage.setItem(DENSIDADE_KEY, densidade) }, [densidade])

  // ESC fecha o drawer
  useEffect(() => {
    if (!drawerProcesso) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setDrawerProcesso(null) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [drawerProcesso])

  const query = busca.toLowerCase().trim()
  const filtrosAtivos = (statusFiltro.length > 0 ? 1 : 0) + (areaFiltro ? 1 : 0) + (query ? 1 : 0)

  const filtrados = useMemo(() => {
    const arr = processos.filter((processo) => {
      const matchBusca =
        !query ||
        processo.numero?.toLowerCase().includes(query) ||
        processo.cliente.nomeCompleto.toLowerCase().includes(query) ||
        processo.tribunal?.toLowerCase().includes(query) ||
        processo.tipoAcao?.toLowerCase().includes(query)
      const matchStatus = statusFiltro.length === 0 || statusFiltro.includes(processo.status)
      const matchArea = !areaFiltro || processo.areaJuridica === areaFiltro
      return matchBusca && matchStatus && matchArea
    })

    const cmpStr = (a: string, b: string) => (a > b ? 1 : a < b ? -1 : 0)
    arr.sort((a, b) => {
      let r = 0
      switch (sortKey) {
        case 'cliente':  r = cmpStr(a.cliente.nomeCompleto.toLowerCase(), b.cliente.nomeCompleto.toLowerCase()); break
        case 'tribunal': r = cmpStr((a.tribunal ?? '').toLowerCase(), (b.tribunal ?? '').toLowerCase()); break
        case 'fase':     r = cmpStr(a.fase, b.fase); break
        case 'status':   r = cmpStr(a.status, b.status); break
        case 'prazo': {
          const da = a.proximoPrazo ? new Date(a.proximoPrazo.dataFinal).getTime() : Number.POSITIVE_INFINITY
          const db = b.proximoPrazo ? new Date(b.proximoPrazo.dataFinal).getTime() : Number.POSITIVE_INFINITY
          r = da - db
          break
        }
        default:         r = cmpStr((a.numero ?? '').toLowerCase(), (b.numero ?? '').toLowerCase())
      }
      return sortDir === 'asc' ? r : -r
    })
    return arr
  }, [processos, query, statusFiltro, areaFiltro, sortKey, sortDir])

  const kpis = useMemo(() => {
    const total = processos.length || 1
    const emAndamento = processos.filter((p) => p.status === 'EM_ANDAMENTO').length
    const aguardando = processos.filter((p) => ['AGUARDANDO_PECA', 'AGUARDANDO_CLIENTE'].includes(p.status)).length
    const encerrados = processos.filter((p) => p.status.includes('ENCERRADO') || p.status === 'ARQUIVADO').length
    return {
      total: processos.length,
      emAndamento,
      aguardando,
      encerrados,
      pctAndamento: Math.round((emAndamento / total) * 100),
      pctAguardando: Math.round((aguardando / total) * 100),
      pctEncerrados: Math.round((encerrados / total) * 100),
    }
  }, [processos])

  const cards = [
    { icon: FileText,      value: kpis.total,       label: 'Total de processos', hint: 'base completa',                 color: '#B8962A', bg: 'rgba(184,150,42,0.15)', progress: 100 },
    { icon: Scale,         value: kpis.emAndamento, label: 'Em andamento',       hint: `${kpis.pctAndamento}% do total`,  color: '#22C55E', bg: 'rgba(34,197,94,0.12)',  progress: kpis.pctAndamento },
    { icon: Clock3,        value: kpis.aguardando,  label: 'Aguardando ação',    hint: `${kpis.pctAguardando}% do total`, color: '#F59E0B', bg: 'rgba(245,158,11,0.15)', progress: kpis.pctAguardando },
    { icon: CheckCircle2,  value: kpis.encerrados,  label: 'Encerrados',         hint: `${kpis.pctEncerrados}% do total`, color: '#9CA3AF', bg: 'rgba(156,163,175,0.12)', progress: kpis.pctEncerrados },
  ]

  const toggleStatus = (val: string) => setStatusFiltro((prev) => (prev.includes(val) ? prev.filter((s) => s !== val) : [...prev, val]))
  const limparFiltros = () => { setBusca(''); setStatusFiltro([]); setAreaFiltro('') }
  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortKey(key); setSortDir('asc') }
  }

  const todosSelecionados = filtrados.length > 0 && filtrados.every((p) => selecionados.has(p.id))
  const algunsSelecionados = !todosSelecionados && filtrados.some((p) => selecionados.has(p.id))
  const toggleSelAll = () => {
    if (todosSelecionados) setSelecionados(new Set())
    else setSelecionados(new Set(filtrados.map((p) => p.id)))
  }
  const toggleSel = (id: string) => {
    setSelecionados((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  const padY = densidade === 'compacto' ? 'py-2' : 'py-3.5'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.36em] text-slate-500">
            <Sparkles size={11} className="text-gold" />
            <span>Pré-visualização · v2</span>
          </div>
          <h1 className="mt-2 text-3xl font-bold text-foreground">Processos</h1>
          <p className="mt-1 text-sm text-muted-foreground">Acompanhe o pipeline processual, ações pendentes e responsáveis.</p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/processos" className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground transition hover:bg-white/10">
            Voltar à v1
          </Link>
          <Link href="/processos/novo" style={{ background: 'linear-gradient(135deg, #d4af37, #B8962A)' }} className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-black shadow-lg shadow-gold/20 transition hover:shadow-gold/30">
            <Plus size={16} />
            Novo processo
          </Link>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ icon: Icon, value, label, hint, color, bg, progress }, i) => (
          <motion.div key={label} className="glass-card hover-lift relative overflow-hidden rounded-3xl p-5"
            initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}>
            <div className="flex items-start justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl" style={{ background: bg, color, border: `1px solid ${color}40` }}>
                <Icon size={18} />
              </div>
              <span className="text-[10px] font-semibold uppercase tracking-[0.22em]" style={{ color }}>{hint}</span>
            </div>
            <div className="mt-4">
              <p className="text-3xl font-bold" style={{ background: `linear-gradient(135deg, #FFFFFF, ${color})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{value}</p>
              <p className="mt-1 text-[11px] uppercase tracking-[0.22em] text-muted-foreground">{label}</p>
            </div>
            <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/5">
              <motion.div className="h-full rounded-full" style={{ background: `linear-gradient(90deg, ${color}66, ${color})` }}
                initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 0.9, delay: 0.2 + i * 0.06, ease: [0.22, 1, 0.36, 1] }} />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="sticky top-2 z-10 glass-card rounded-2xl p-4 backdrop-blur-xl">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar por número, cliente, tribunal ou tipo de ação…"
              className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-11 pr-10 text-sm text-foreground outline-none transition focus:border-[rgba(184,150,42,0.4)] focus:bg-white/[0.08]" />
            {busca && (
              <button onClick={() => setBusca('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" aria-label="Limpar busca">
                <X size={14} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <select value={areaFiltro} onChange={(e) => setAreaFiltro(e.target.value)}
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-[rgba(184,150,42,0.4)]">
              <option value="">Todas as áreas</option>
              {Object.entries(areaLabels).map(([v, l]) => (<option key={v} value={v}>{l}</option>))}
            </select>

            <div className="flex items-center rounded-xl border border-white/10 bg-white/5 p-1">
              <button onClick={() => setDensidade('confortavel')} title="Densidade confortável"
                className={`flex h-8 w-8 items-center justify-center rounded-lg transition ${densidade === 'confortavel' ? 'bg-white/10 text-gold' : 'text-muted-foreground hover:text-foreground'}`}>
                <Rows size={14} />
              </button>
              <button onClick={() => setDensidade('compacto')} title="Densidade compacta"
                className={`flex h-8 w-8 items-center justify-center rounded-lg transition ${densidade === 'compacto' ? 'bg-white/10 text-gold' : 'text-muted-foreground hover:text-foreground'}`}>
                <Rows3 size={14} />
              </button>
            </div>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          {statusOptions.map((opt) => {
            const active = statusFiltro.includes(opt.value)
            const cfg = statusConfig[opt.value]!
            return (
              <button key={opt.value} onClick={() => toggleStatus(opt.value)}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition ${active ? cfg.chip + ' ring-1 ring-inset ring-white/15' : 'border border-white/10 bg-white/3 text-muted-foreground hover:bg-white/8'}`}>
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: cfg.dot }} />
                {opt.label}
              </button>
            )
          })}
          {filtrosAtivos > 0 && (
            <button onClick={limparFiltros} className="ml-auto inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-muted-foreground transition hover:bg-white/10 hover:text-foreground">
              <XCircle size={12} />
              Limpar filtros
            </button>
          )}
        </div>
      </div>

      {/* Tabela */}
      <div className="glass-card overflow-hidden rounded-3xl">
        <div className="flex items-center justify-between border-b border-white/8 px-5 py-4">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-semibold uppercase tracking-[0.24em] text-foreground">Pipeline processual</h2>
            <span className="rounded-full border border-gold/30 bg-gold/12 px-2.5 py-0.5 text-[11px] font-semibold text-gold">
              {filtrados.length} {filtrados.length === 1 ? 'processo' : 'processos'}
            </span>
          </div>
          <span className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
            ordenado por {sortKey} · {sortDir === 'asc' ? 'A→Z' : 'Z→A'}
          </span>
        </div>

        {filtrados.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-gold/30 bg-gold/10 text-gold">
              <FileText size={28} />
            </div>
            <p className="text-base font-semibold text-foreground">
              {processos.length === 0 ? 'Nenhum processo cadastrado' : 'Nenhum resultado encontrado'}
            </p>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              {processos.length === 0 ? 'Comece criando o primeiro processo do escritório clicando no botão dourado acima.' : 'Tente remover algum filtro ou usar outros termos na busca.'}
            </p>
            {filtrosAtivos > 0 && (
              <button onClick={limparFiltros} className="mt-5 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground hover:bg-white/10 hover:text-foreground">
                Limpar filtros
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px]">
              <thead>
                <tr className="border-b border-white/8 bg-white/[0.02]">
                  <th className="px-3 py-4 w-10">
                    <button onClick={toggleSelAll} className="text-muted-foreground transition hover:text-gold" title={todosSelecionados ? 'Desmarcar todos' : 'Selecionar todos'}>
                      {todosSelecionados ? <CheckSquare size={16} className="text-gold" /> : algunsSelecionados ? <CheckSquare size={16} className="text-gold/60" /> : <Square size={16} />}
                    </button>
                  </th>
                  <ThSort label="Número / Cliente" k="numero" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} />
                  <Th label="Área" hide="hidden sm:table-cell" />
                  <ThSort label="Próximo prazo" k="prazo" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} hide="hidden md:table-cell" />
                  <ThSort label="Tribunal" k="tribunal" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} hide="hidden xl:table-cell" />
                  <ThSort label="Fase" k="fase" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} hide="hidden lg:table-cell" />
                  <ThSort label="Status" k="status" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} />
                  <Th label="Resp." hide="hidden lg:table-cell" />
                  <th className="px-5 py-4" />
                </tr>
              </thead>
              <tbody>
                <AnimatePresence initial={false}>
                  {filtrados.map((processo, index) => {
                    const fase = faseConfig[processo.fase]
                    const status = statusConfig[processo.status]
                    const novo = isNovo(processo.createdAt)
                    const sel = selecionados.has(processo.id)
                    const prazoInfo = processo.proximoPrazo
                      ? prazoBadge(diasAte(processo.proximoPrazo.dataFinal))
                      : null

                    return (
                      <motion.tr
                        key={processo.id}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: Math.min(index * 0.02, 0.2), duration: 0.25 }}
                        onClick={() => setDrawerProcesso(processo)}
                        className={`group cursor-pointer border-b border-white/[0.05] transition-colors ${sel ? 'bg-gold/[0.06]' : 'hover:bg-gold/[0.04]'}`}
                      >
                        <td className={`px-3 ${padY} w-10`} onClick={(e) => e.stopPropagation()}>
                          <button onClick={() => toggleSel(processo.id)} className="text-muted-foreground transition hover:text-gold" aria-label="Selecionar">
                            {sel ? <CheckSquare size={16} className="text-gold" /> : <Square size={16} />}
                          </button>
                        </td>
                        <td className={`px-5 ${padY}`}>
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[11px] font-bold uppercase"
                              style={{ background: 'rgba(184,150,42,0.12)', color: '#d4af37', border: '1px solid rgba(184,150,42,0.25)' }}>
                              {getInitials(processo.cliente.nomeCompleto)}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-sm font-semibold text-gold">{processo.numero || '—'}</span>
                                {novo && (
                                  <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-400">
                                    Novo
                                  </span>
                                )}
                              </div>
                              <div className="truncate text-xs text-muted-foreground">{processo.cliente.nomeCompleto}</div>
                            </div>
                          </div>
                        </td>
                        <td className={`px-5 ${padY} hidden sm:table-cell`}>
                          {processo.areaJuridica ? (
                            <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-muted-foreground">{areaLabels[processo.areaJuridica]}</span>
                          ) : (<span className="text-xs text-muted-foreground">—</span>)}
                        </td>
                        <td className={`px-5 ${padY} hidden md:table-cell`}>
                          {prazoInfo && processo.proximoPrazo ? (
                            <div className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
                              style={{ background: prazoInfo.bg, color: prazoInfo.color, border: `1px solid ${prazoInfo.border}` }}>
                              <prazoInfo.icon size={12} />
                              <span>{prazoInfo.label}</span>
                              <span className="text-muted-foreground/70">·</span>
                              <span className="text-muted-foreground/80">{fmtData(processo.proximoPrazo.dataFinal)}</span>
                            </div>
                          ) : (<span className="text-xs text-muted-foreground">—</span>)}
                        </td>
                        <td className={`px-5 ${padY} hidden xl:table-cell text-sm text-muted-foreground`}>{processo.tribunal || '—'}</td>
                        <td className={`px-5 ${padY} hidden lg:table-cell`}>
                          {fase && (
                            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${fase.chip}`}>
                              <span className="h-1.5 w-1.5 rounded-full" style={{ background: fase.dot }} />
                              {fase.label}
                            </span>
                          )}
                        </td>
                        <td className={`px-5 ${padY}`}>
                          {status && (
                            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${status.chip}`}>
                              <span className="h-1.5 w-1.5 rounded-full" style={{ background: status.dot }} />
                              {status.label}
                            </span>
                          )}
                        </td>
                        <td className={`px-5 ${padY} hidden lg:table-cell text-sm text-muted-foreground`}>{processo.responsavel?.nome || '—'}</td>
                        <td className={`px-5 ${padY} text-right`} onClick={(e) => e.stopPropagation()}>
                          <Link href={`/processos/${processo.id}`}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground opacity-70 transition group-hover:border-gold/30 group-hover:bg-gold/10 group-hover:text-gold group-hover:opacity-100">
                            Abrir
                            <ExternalLink size={11} />
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
          <span>{filtrados.length} de {processos.length} processo{processos.length !== 1 ? 's' : ''}</span>
          {filtrosAtivos > 0 && (
            <span className="rounded-full bg-gold/10 px-2.5 py-0.5 text-gold">
              {filtrosAtivos} filtro{filtrosAtivos !== 1 ? 's' : ''} ativo{filtrosAtivos !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      {/* Bulk action bar */}
      <AnimatePresence>
        {selecionados.size > 0 && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            className="fixed bottom-6 left-1/2 z-30 -translate-x-1/2"
          >
            <div className="flex items-center gap-3 rounded-2xl border border-gold/30 bg-[#161616]/95 px-4 py-3 shadow-2xl shadow-black/60 backdrop-blur-xl">
              <span className="rounded-full bg-gold/15 px-3 py-1 text-xs font-semibold text-gold">
                {selecionados.size} selecionado{selecionados.size !== 1 ? 's' : ''}
              </span>
              <div className="h-5 w-px bg-white/10" />
              <button className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:bg-white/10 hover:text-foreground"
                onClick={() => alert('Em breve: atribuir responsável em lote')}>
                <UserCog size={13} />
                Atribuir
              </button>
              <button className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:bg-white/10 hover:text-foreground"
                onClick={() => alert('Em breve: arquivar em lote')}>
                <Archive size={13} />
                Arquivar
              </button>
              <button onClick={() => setSelecionados(new Set())}
                className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs text-muted-foreground hover:text-foreground" aria-label="Limpar seleção">
                <X size={14} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Drawer */}
      <AnimatePresence>
        {drawerProcesso && (
          <>
            <motion.div
              className="fixed inset-0 z-40"
              style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setDrawerProcesso(null)}
            />
            <motion.aside
              className="fixed right-0 top-0 z-50 h-full w-full max-w-[480px] overflow-y-auto border-l border-white/10"
              style={{ background: '#0F0F0F' }}
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 400, damping: 36 }}
            >
              <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/8 px-6 py-4" style={{ background: '#0F0F0F' }}>
                <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.32em] text-muted-foreground">
                  <Sparkles size={11} className="text-gold" />
                  Detalhe rápido
                </div>
                <button onClick={() => setDrawerProcesso(null)} className="text-muted-foreground hover:text-foreground" aria-label="Fechar">
                  <X size={18} />
                </button>
              </div>

              <div className="px-6 py-6 space-y-6">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-lg font-bold text-gold">{drawerProcesso.numero || '—'}</span>
                    {isNovo(drawerProcesso.createdAt) && (
                      <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-400">Novo</span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{drawerProcesso.cliente.nomeCompleto}</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <DrawerInfo label="Tipo de ação" value={drawerProcesso.tipoAcao || '—'} />
                  <DrawerInfo label="Área" value={drawerProcesso.areaJuridica ? areaLabels[drawerProcesso.areaJuridica] ?? drawerProcesso.areaJuridica : '—'} />
                  <DrawerInfo label="Tribunal" value={drawerProcesso.tribunal || '—'} />
                  <DrawerInfo label="Responsável" value={drawerProcesso.responsavel?.nome || '—'} />
                </div>

                <div className="flex flex-wrap gap-2">
                  {faseConfig[drawerProcesso.fase] && (
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${faseConfig[drawerProcesso.fase]!.chip}`}>
                      <span className="h-1.5 w-1.5 rounded-full" style={{ background: faseConfig[drawerProcesso.fase]!.dot }} />
                      {faseConfig[drawerProcesso.fase]!.label}
                    </span>
                  )}
                  {statusConfig[drawerProcesso.status] && (
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${statusConfig[drawerProcesso.status]!.chip}`}>
                      <span className="h-1.5 w-1.5 rounded-full" style={{ background: statusConfig[drawerProcesso.status]!.dot }} />
                      {statusConfig[drawerProcesso.status]!.label}
                    </span>
                  )}
                </div>

                <section>
                  <h3 className="text-[11px] font-semibold uppercase tracking-[0.28em] text-muted-foreground">Próximo prazo</h3>
                  {drawerProcesso.proximoPrazo ? (
                    <div className="mt-2 rounded-2xl border border-white/10 bg-white/5 p-4">
                      {(() => {
                        const info = prazoBadge(diasAte(drawerProcesso.proximoPrazo!.dataFinal))
                        return (
                          <>
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-semibold text-foreground">{drawerProcesso.proximoPrazo!.titulo}</span>
                              <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium"
                                style={{ background: info.bg, color: info.color, border: `1px solid ${info.border}` }}>
                                <info.icon size={11} />
                                {info.label}
                              </span>
                            </div>
                            <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                              <Calendar size={12} />
                              <span>{fmtData(drawerProcesso.proximoPrazo!.dataFinal)}</span>
                              <span>·</span>
                              <span>{drawerProcesso.proximoPrazo!.tipo}</span>
                            </div>
                          </>
                        )
                      })()}
                    </div>
                  ) : (
                    <p className="mt-2 text-sm text-muted-foreground">Nenhum prazo em aberto.</p>
                  )}
                </section>

                <section>
                  <div className="flex items-center justify-between">
                    <h3 className="text-[11px] font-semibold uppercase tracking-[0.28em] text-muted-foreground">Tarefas abertas</h3>
                    <span className="text-[11px] text-muted-foreground">{drawerProcesso._count.tarefas} no total</span>
                  </div>
                  {drawerProcesso.tarefasAbertas.length > 0 ? (
                    <ul className="mt-2 space-y-2">
                      {drawerProcesso.tarefasAbertas.map((t) => (
                        <li key={t.id} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5">
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-sm text-foreground">{t.titulo}</span>
                            <span className="shrink-0 rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                              {t.status.replace('_', ' ').toLowerCase()}
                            </span>
                          </div>
                          {t.dataVencimento && (
                            <p className="mt-1 text-[11px] text-muted-foreground">Vence em {fmtData(t.dataVencimento)}</p>
                          )}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-2 text-sm text-muted-foreground">Nenhuma tarefa aberta.</p>
                  )}
                </section>

                <Link href={`/processos/${drawerProcesso.id}`}
                  style={{ background: 'linear-gradient(135deg, #d4af37, #B8962A)' }}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-black shadow-lg shadow-gold/20 transition hover:shadow-gold/30">
                  Abrir processo completo
                  <ChevronRight size={16} />
                </Link>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

function DrawerInfo({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5">
      <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">{label}</p>
      <p className="mt-1 truncate text-sm text-foreground">{value}</p>
    </div>
  )
}

function Th({ label, hide = '' }: { label: string; hide?: string }) {
  return (
    <th className={`px-5 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground ${hide}`}>{label}</th>
  )
}

function ThSort({
  label, k, sortKey, sortDir, onClick, hide = '',
}: {
  label: string; k: SortKey; sortKey: SortKey; sortDir: 'asc' | 'desc'; onClick: (k: SortKey) => void; hide?: string
}) {
  const active = sortKey === k
  return (
    <th className={`px-5 py-4 text-left ${hide}`}>
      <button onClick={() => onClick(k)}
        className={`inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.24em] transition ${active ? 'text-gold' : 'text-muted-foreground hover:text-foreground'}`}>
        {label}
        <ArrowUpDown size={11} className={active ? '' : 'opacity-50'} />
        {active && <span className="text-[9px]">{sortDir === 'asc' ? '↑' : '↓'}</span>}
      </button>
    </th>
  )
}
