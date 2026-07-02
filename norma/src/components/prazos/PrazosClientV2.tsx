'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  CalendarDays,
  AlertTriangle,
  AlarmClock,
  CheckCircle2,
  X,
  Search,
  Filter,
  Briefcase,
  Clock,
} from 'lucide-react'

// Calendário mensal estilo Google Calendar / Notion Calendar.
// Cada célula = um dia. Prazos aparecem como pílulas semafóricas.

const TIPO_LABELS: Record<string, string> = {
  RECURSO: 'Recurso',
  CONTESTACAO: 'Contestação',
  MANIFESTACAO: 'Manifestação',
  REPLICA: 'Réplica',
  TREPLICA: 'Tréplica',
  ALEGACOES_FINAIS: 'Aleg. finais',
  AUDIENCIA: 'Audiência',
  PERICIA: 'Perícia',
  OUTRO: 'Outro',
}

const STATUS_COLORS: Record<string, string> = {
  ABERTO: '#3B82F6',
  CUMPRIDO: '#22C55E',
  PERDIDO: '#EF4444',
  SUSPENSO: '#94A3B8',
}

interface Tarefa {
  id: string
  titulo: string
  status: string
  dataVencimento: string | null
}

interface Prazo {
  id: string
  titulo: string
  tipo: string
  dataInicio: string
  dataFinal: string
  diasUteis: number | null
  status: string
  observacoes: string | null
  createdAt: string
  processo: { id: string; numero: string | null; cliente: { nomeCompleto: string } }
  tarefas: Tarefa[]
}

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

function ymd(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function isMesmoDia(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function diasAte(iso: string): number {
  const a = new Date(iso); a.setHours(0, 0, 0, 0)
  const h = new Date(); h.setHours(0, 0, 0, 0)
  return Math.round((a.getTime() - h.getTime()) / 86_400_000)
}

function urgenciaPrazo(prazo: Prazo): { color: string; bg: string; border: string; label: string } {
  if (prazo.status === 'CUMPRIDO') return { color: '#22C55E', bg: 'rgba(34,197,94,0.15)', border: 'rgba(34,197,94,0.35)', label: 'Cumprido' }
  if (prazo.status === 'PERDIDO') return { color: '#EF4444', bg: 'rgba(239,68,68,0.18)', border: 'rgba(239,68,68,0.45)', label: 'Perdido' }
  if (prazo.status === 'SUSPENSO') return { color: '#94A3B8', bg: 'rgba(148,163,184,0.15)', border: 'rgba(148,163,184,0.30)', label: 'Suspenso' }

  const d = diasAte(prazo.dataFinal)
  if (d < 0) return { color: '#EF4444', bg: 'rgba(239,68,68,0.18)', border: 'rgba(239,68,68,0.45)', label: `${Math.abs(d)}d atraso` }
  if (d === 0) return { color: '#EF4444', bg: 'rgba(239,68,68,0.15)', border: 'rgba(239,68,68,0.40)', label: 'Hoje' }
  if (d <= 3) return { color: '#F59E0B', bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.40)', label: `Em ${d}d` }
  if (d <= 7) return { color: '#F59E0B', bg: 'rgba(245,158,11,0.10)', border: 'rgba(245,158,11,0.30)', label: `Em ${d}d` }
  return { color: '#3B82F6', bg: 'rgba(59,130,246,0.10)', border: 'rgba(59,130,246,0.30)', label: `Em ${d}d` }
}

function buildMesGrid(ano: number, mes: number): Date[] {
  // Sempre 6 semanas (42 dias) começando no domingo da semana do dia 1.
  const inicio = new Date(ano, mes, 1)
  const offset = inicio.getDay() // 0 = domingo
  const startGrid = new Date(ano, mes, 1 - offset)
  const dias: Date[] = []
  for (let i = 0; i < 42; i++) {
    const d = new Date(startGrid)
    d.setDate(startGrid.getDate() + i)
    dias.push(d)
  }
  return dias
}

export default function PrazosClientV2({ prazos: prazosIniciais }: { prazos: Prazo[] }) {
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  const [cursor, setCursor] = useState(() => new Date(hoje.getFullYear(), hoje.getMonth(), 1))
  const [diaSelecionado, setDiaSelecionado] = useState<Date | null>(null)
  const [busca, setBusca] = useState('')
  const [statusFiltro, setStatusFiltro] = useState<string>('')
  const [tipoFiltro, setTipoFiltro] = useState<string>('')
  const [drawer, setDrawer] = useState<Prazo | null>(null)

  const ano = cursor.getFullYear()
  const mes = cursor.getMonth()

  const filtrados = useMemo(() => {
    const q = busca.toLowerCase().trim()
    return prazosIniciais.filter((p) => {
      if (statusFiltro && p.status !== statusFiltro) return false
      if (tipoFiltro && p.tipo !== tipoFiltro) return false
      if (!q) return true
      return (
        p.titulo.toLowerCase().includes(q) ||
        p.processo.cliente.nomeCompleto.toLowerCase().includes(q) ||
        p.processo.numero?.toLowerCase().includes(q)
      )
    })
  }, [prazosIniciais, busca, statusFiltro, tipoFiltro])

  // Indexa prazos por dia (yyyy-mm-dd)
  const prazosPorDia = useMemo(() => {
    const map = new Map<string, Prazo[]>()
    for (const p of filtrados) {
      const k = p.dataFinal.slice(0, 10)
      const arr = map.get(k) ?? []
      arr.push(p)
      map.set(k, arr)
    }
    // Ordena por urgência dentro do dia (status ABERTO primeiro)
    for (const arr of map.values()) {
      arr.sort((a, b) => {
        const ra = a.status === 'ABERTO' ? 0 : 1
        const rb = b.status === 'ABERTO' ? 0 : 1
        return ra - rb
      })
    }
    return map
  }, [filtrados])

  const diasGrid = useMemo(() => buildMesGrid(ano, mes), [ano, mes])

  // Resumo do mês
  const stats = useMemo(() => {
    const noMes = filtrados.filter((p) => {
      const d = new Date(p.dataFinal)
      return d.getFullYear() === ano && d.getMonth() === mes
    })
    const abertos = noMes.filter((p) => p.status === 'ABERTO').length
    const vencidos = noMes.filter((p) => p.status === 'ABERTO' && diasAte(p.dataFinal) < 0).length
    const hojeCount = noMes.filter((p) => p.status === 'ABERTO' && diasAte(p.dataFinal) === 0).length
    const cumpridos = noMes.filter((p) => p.status === 'CUMPRIDO').length
    return { total: noMes.length, abertos, vencidos, hojeCount, cumpridos }
  }, [filtrados, ano, mes])

  const irMes = (delta: number) => setCursor(new Date(ano, mes + delta, 1))
  const irHoje = () => {
    setCursor(new Date(hoje.getFullYear(), hoje.getMonth(), 1))
    setDiaSelecionado(hoje)
  }

  const prazosDoDia = (d: Date) => prazosPorDia.get(ymd(d)) ?? []

  return (
    <div className="space-y-5">
      {/* Header com identidade Calendário */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.3em]">
            <span
              className="inline-flex items-center gap-1 rounded-md border px-2 py-0.5 font-semibold"
              style={{ background: 'rgba(245,158,11,0.10)', color: '#F59E0B', borderColor: 'rgba(245,158,11,0.30)' }}
            >
              <CalendarDays size={10} /> Calendário
            </span>
            <span className="text-slate-500">Controladoria de prazos · visão mensal</span>
          </div>
          <h1 className="mt-2 text-3xl font-bold text-foreground">Prazos</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Clique em um dia para ver os prazos. Pílulas semafóricas mostram urgência.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/prazos"
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground transition hover:bg-white/10"
          >
            Voltar à v1
          </Link>
          <Link
            href="/prazos/novo"
            style={{ background: 'linear-gradient(135deg, #d4af37, #B8962A)' }}
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-black shadow-lg shadow-gold/20"
          >
            <Plus size={16} /> Novo prazo
          </Link>
        </div>
      </div>

      {/* Stats do mês */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="glass-card rounded-2xl px-4 py-3">
          <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">No mês</p>
          <p className="mt-1 text-xl font-bold text-foreground">{stats.total}</p>
          <p className="text-[10px] text-muted-foreground/60">{stats.abertos} aberto{stats.abertos !== 1 ? 's' : ''}</p>
        </div>
        <div className="glass-card rounded-2xl px-4 py-3">
          <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Vencendo hoje</p>
          <p className="mt-1 text-xl font-bold" style={{ color: stats.hojeCount > 0 ? '#EF4444' : '#94A3B8' }}>
            {stats.hojeCount}
          </p>
          <p className="text-[10px] text-muted-foreground/60">prazo{stats.hojeCount !== 1 ? 's' : ''}</p>
        </div>
        <div className="glass-card rounded-2xl px-4 py-3">
          <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Vencidos</p>
          <p className="mt-1 text-xl font-bold" style={{ color: stats.vencidos > 0 ? '#EF4444' : '#94A3B8' }}>
            {stats.vencidos}
          </p>
          <p className="text-[10px] text-muted-foreground/60">em atraso</p>
        </div>
        <div className="glass-card rounded-2xl px-4 py-3">
          <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Cumpridos</p>
          <p className="mt-1 text-xl font-bold text-emerald-400">{stats.cumpridos}</p>
          <p className="text-[10px] text-muted-foreground/60">no mês</p>
        </div>
      </div>

      {/* Toolbar: navegação + filtros */}
      <div className="glass-card flex flex-wrap items-center gap-2 rounded-2xl p-3">
        <button
          onClick={() => irMes(-1)}
          className="rounded-lg border border-white/10 bg-white/5 p-2 text-muted-foreground hover:bg-white/10 hover:text-foreground"
          aria-label="Mês anterior"
        >
          <ChevronLeft size={14} />
        </button>
        <button
          onClick={() => irMes(1)}
          className="rounded-lg border border-white/10 bg-white/5 p-2 text-muted-foreground hover:bg-white/10 hover:text-foreground"
          aria-label="Próximo mês"
        >
          <ChevronRight size={14} />
        </button>
        <button
          onClick={irHoje}
          className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-white/10 hover:text-foreground"
        >
          Hoje
        </button>
        <h2 className="ml-2 text-base font-bold text-foreground">
          {MESES[mes]} <span className="text-muted-foreground">{ano}</span>
        </h2>

        <div className="relative ml-auto min-w-[200px] flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar prazo…"
            className="w-full rounded-lg border border-white/10 bg-white/5 py-2 pl-9 pr-9 text-sm outline-none focus:border-[rgba(184,150,42,0.4)]"
          />
          {busca && (
            <button
              onClick={() => setBusca('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X size={13} />
            </button>
          )}
        </div>
        <select
          value={statusFiltro}
          onChange={(e) => setStatusFiltro(e.target.value)}
          className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-foreground outline-none focus:border-[rgba(184,150,42,0.4)]"
        >
          <option value="">Todos status</option>
          <option value="ABERTO">Aberto</option>
          <option value="CUMPRIDO">Cumprido</option>
          <option value="PERDIDO">Perdido</option>
          <option value="SUSPENSO">Suspenso</option>
        </select>
        <select
          value={tipoFiltro}
          onChange={(e) => setTipoFiltro(e.target.value)}
          className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-foreground outline-none focus:border-[rgba(184,150,42,0.4)]"
        >
          <option value="">Todos tipos</option>
          {Object.entries(TIPO_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>

      {/* Grid mês + painel lateral */}
      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        {/* Calendário */}
        <div className="glass-card overflow-hidden rounded-2xl">
          {/* Header dias da semana */}
          <div className="grid grid-cols-7 border-b border-white/8 bg-white/[0.02]">
            {DIAS_SEMANA.map((d, i) => (
              <div
                key={d}
                className="px-2 py-2 text-center text-[10px] font-semibold uppercase tracking-[0.18em]"
                style={{ color: i === 0 || i === 6 ? '#94A3B8' : '#cbd5e1' }}
              >
                {d}
              </div>
            ))}
          </div>

          {/* Células */}
          <div className="grid grid-cols-7 grid-rows-6">
            {diasGrid.map((d, i) => {
              const noMes = d.getMonth() === mes
              const ehHoje = isMesmoDia(d, hoje)
              const selecionado = diaSelecionado && isMesmoDia(d, diaSelecionado)
              const lista = prazosDoDia(d)
              const totalNoDia = lista.length
              const visiveis = lista.slice(0, 3)
              const rest = totalNoDia - visiveis.length
              const finalSem = d.getDay() === 0 || d.getDay() === 6

              return (
                <button
                  key={i}
                  onClick={() => setDiaSelecionado(d)}
                  className={`min-h-[88px] border-b border-r border-white/5 px-1.5 py-1 text-left transition ${
                    selecionado ? 'bg-gold/10 ring-1 ring-inset ring-gold/30' : 'hover:bg-white/[0.03]'
                  } ${!noMes ? 'opacity-40' : ''} ${finalSem ? 'bg-white/[0.02]' : ''}`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                        ehHoje ? 'bg-gold text-black' : 'text-muted-foreground'
                      }`}
                    >
                      {d.getDate()}
                    </span>
                    {totalNoDia > 0 && (
                      <span className="text-[9px] font-bold text-muted-foreground/60">{totalNoDia}</span>
                    )}
                  </div>

                  <div className="mt-1 space-y-0.5">
                    {visiveis.map((p) => {
                      const u = urgenciaPrazo(p)
                      return (
                        <span
                          key={p.id}
                          onClick={(e) => {
                            e.stopPropagation()
                            setDrawer(p)
                          }}
                          className="block truncate rounded px-1 py-0.5 text-[10px] font-medium"
                          style={{ background: u.bg, color: u.color, border: `1px solid ${u.border}` }}
                          title={`${p.titulo} — ${p.processo.cliente.nomeCompleto}`}
                        >
                          {p.titulo}
                        </span>
                      )
                    })}
                    {rest > 0 && (
                      <span className="block text-[9px] font-semibold text-gold/80">+{rest} mais</span>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Painel lateral: prazos do dia selecionado */}
        <div className="glass-card flex flex-col rounded-2xl">
          <div className="border-b border-white/8 px-4 py-3">
            <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
              {diaSelecionado ? 'Prazos do dia' : 'Selecione um dia'}
            </p>
            {diaSelecionado && (
              <p className="mt-0.5 text-sm font-semibold text-foreground">
                {diaSelecionado.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}
              </p>
            )}
          </div>
          <div className="flex-1 overflow-y-auto p-3">
            {!diaSelecionado ? (
              <div className="flex flex-col items-center justify-center py-12 text-center text-xs text-muted-foreground/70">
                <CalendarDays size={28} className="mb-3 text-muted-foreground/40" />
                <p>Clique em qualquer dia do calendário</p>
                <p className="mt-1 text-[10px]">para ver os prazos detalhados</p>
              </div>
            ) : prazosDoDia(diaSelecionado).length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center text-xs text-muted-foreground/70">
                <CheckCircle2 size={28} className="mb-3 text-emerald-400/60" />
                <p>Nenhum prazo neste dia</p>
              </div>
            ) : (
              <div className="space-y-2">
                <AnimatePresence>
                  {prazosDoDia(diaSelecionado).map((p) => {
                    const u = urgenciaPrazo(p)
                    return (
                      <motion.div
                        key={p.id}
                        layout
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setDrawer(p)}
                        className="cursor-pointer rounded-xl border bg-white/[0.02] p-3 transition hover:border-white/15 hover:bg-white/[0.05]"
                        style={{ borderColor: 'rgba(255,255,255,0.08)', borderLeftColor: u.color, borderLeftWidth: 3 }}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-semibold text-foreground">{p.titulo}</p>
                          <span
                            className="inline-flex shrink-0 items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium"
                            style={{ background: u.bg, color: u.color, border: `1px solid ${u.border}` }}
                          >
                            {p.status === 'ABERTO' && diasAte(p.dataFinal) < 0 && <AlertTriangle size={9} />}
                            {p.status === 'ABERTO' && diasAte(p.dataFinal) <= 3 && diasAte(p.dataFinal) >= 0 && <AlarmClock size={9} />}
                            {u.label}
                          </span>
                        </div>
                        <p className="mt-1 text-[11px] text-muted-foreground">{TIPO_LABELS[p.tipo] ?? p.tipo}</p>
                        <div className="mt-2 flex items-center gap-2 text-[10px] text-muted-foreground/80">
                          <span className="font-mono text-gold">{p.processo.numero?.slice(-7) ?? 'sem nº'}</span>
                          <span>·</span>
                          <span className="truncate">{p.processo.cliente.nomeCompleto}</span>
                        </div>
                      </motion.div>
                    )
                  })}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Drawer detalhe */}
      <AnimatePresence>
        {drawer && (
          <>
            <motion.div
              className="fixed inset-0 z-40"
              style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDrawer(null)}
            />
            <motion.aside
              className="fixed right-0 top-0 z-50 flex h-full w-full max-w-[460px] flex-col overflow-hidden border-l border-white/10"
              style={{ background: '#0F0F0F' }}
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 400, damping: 36 }}
            >
              <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/8 px-5 py-4" style={{ background: '#0F0F0F' }}>
                <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.32em] text-muted-foreground">
                  <CalendarDays size={11} className="text-gold" />
                  Detalhe do prazo
                </div>
                <button onClick={() => setDrawer(null)} className="text-muted-foreground hover:text-foreground" aria-label="Fechar">
                  <X size={18} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
                {(() => {
                  const u = urgenciaPrazo(drawer)
                  return (
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="text-lg font-bold text-foreground">{drawer.titulo}</h3>
                        <p className="mt-1 text-xs text-muted-foreground">{TIPO_LABELS[drawer.tipo] ?? drawer.tipo}</p>
                      </div>
                      <span
                        className="inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium"
                        style={{ background: u.bg, color: u.color, border: `1px solid ${u.border}` }}
                      >
                        {u.label}
                      </span>
                    </div>
                  )
                })()}

                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                    <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Data final</p>
                    <p className="mt-1 text-sm font-semibold text-foreground">
                      {new Date(drawer.dataFinal).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                    <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Início</p>
                    <p className="mt-1 text-sm text-foreground">
                      {new Date(drawer.dataInicio).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  {drawer.diasUteis !== null && (
                    <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                      <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Dias úteis</p>
                      <p className="mt-1 text-sm font-semibold text-foreground">{drawer.diasUteis}</p>
                    </div>
                  )}
                  <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                    <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Status</p>
                    <p className="mt-1 text-sm font-semibold" style={{ color: STATUS_COLORS[drawer.status] }}>
                      {drawer.status}
                    </p>
                  </div>
                </div>

                <Link
                  href={`/processos/${drawer.processo.id}`}
                  className="block rounded-xl border border-white/10 bg-white/5 p-3 transition hover:border-gold/30 hover:bg-gold/8"
                >
                  <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Processo vinculado</p>
                  <div className="mt-1 flex items-center gap-2">
                    <Briefcase size={12} className="text-gold" />
                    <span className="font-mono text-sm font-semibold text-gold">{drawer.processo.numero || '—'}</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{drawer.processo.cliente.nomeCompleto}</p>
                </Link>

                {drawer.observacoes && (
                  <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                    <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Observações</p>
                    <p className="mt-1 whitespace-pre-line text-sm text-foreground/90">{drawer.observacoes}</p>
                  </div>
                )}

                {drawer.tarefas.length > 0 && (
                  <section>
                    <h4 className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                      Tarefas vinculadas ({drawer.tarefas.length})
                    </h4>
                    <ul className="mt-2 space-y-1.5">
                      {drawer.tarefas.map((t) => (
                        <li
                          key={t.id}
                          className="flex items-center justify-between rounded-lg border border-white/8 bg-white/5 px-3 py-2 text-xs"
                        >
                          <span className="truncate text-foreground">{t.titulo}</span>
                          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                            {t.status.replace('_', ' ').toLowerCase()}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                <div className="flex items-center gap-2">
                  <Link
                    href={`/prazos/${drawer.id}/editar`}
                    style={{ background: 'linear-gradient(135deg, #d4af37, #B8962A)' }}
                    className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold text-black"
                  >
                    Editar prazo
                  </Link>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
