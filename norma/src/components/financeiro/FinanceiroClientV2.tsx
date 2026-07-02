'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'
import {
  Plus,
  Search,
  X,
  ArrowUpCircle,
  ArrowDownCircle,
  Wallet,
  AlertTriangle,
  Receipt,
  Calendar,
  Filter,
  ChevronRight,
} from 'lucide-react'

// Cashflow visual estilo Stripe Dashboard / Mercury Bank.
// 1) KPIs do período   2) Gráfico mensal (barras receita/despesa + linha saldo)
// 3) Heatmap dos próximos 30 dias   4) Lista compacta dos vencimentos.

const STATUS_CFG: Record<string, { label: string; color: string }> = {
  PENDENTE:  { label: 'Pendente',  color: '#F59E0B' },
  PAGO:      { label: 'Pago',      color: '#22C55E' },
  ATRASADO:  { label: 'Atrasado',  color: '#EF4444' },
  CANCELADO: { label: 'Cancelado', color: '#94A3B8' },
}

interface Lancamento {
  id: string
  descricao: string
  tipo: string
  categoria: string | null
  valor: number
  dataVencimento: string
  dataPagamento: string | null
  status: string
  observacoes: string | null
  cliente: { id: string; nomeCompleto: string } | null
  createdAt: string
}

const MES_CURTO = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

function fmtMoeda(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
}
function fmtMoedaFull(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}
function fmtData(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}
function diasAte(iso: string): number {
  const a = new Date(iso); a.setHours(0, 0, 0, 0)
  const h = new Date(); h.setHours(0, 0, 0, 0)
  return Math.round((a.getTime() - h.getTime()) / 86_400_000)
}

type PeriodoKey = '30d' | '90d' | 'mes' | 'todos'
const PERIODO_LABEL: Record<PeriodoKey, string> = {
  mes: 'Mês atual',
  '30d': 'Próximos 30 dias',
  '90d': 'Próximos 90 dias',
  todos: 'Todos os lançamentos',
}

export default function FinanceiroClientV2({ lancamentos }: { lancamentos: Lancamento[] }) {
  const [busca, setBusca] = useState('')
  const [tipoFiltro, setTipoFiltro] = useState<string>('')
  const [statusFiltro, setStatusFiltro] = useState<string>('')
  const [periodo, setPeriodo] = useState<PeriodoKey>('mes')

  const hoje = useMemo(() => { const d = new Date(); d.setHours(0,0,0,0); return d }, [])

  const noPeriodo = useMemo(() => {
    if (periodo === 'todos') return lancamentos
    const hojeMs = hoje.getTime()
    if (periodo === 'mes') {
      const y = hoje.getFullYear(); const m = hoje.getMonth()
      return lancamentos.filter((l) => {
        const d = new Date(l.dataVencimento)
        return d.getFullYear() === y && d.getMonth() === m
      })
    }
    const dias = periodo === '30d' ? 30 : 90
    const limite = hojeMs + dias * 86_400_000
    return lancamentos.filter((l) => {
      const t = new Date(l.dataVencimento).getTime()
      return t >= hojeMs - 30 * 86_400_000 && t <= limite
    })
  }, [lancamentos, periodo, hoje])

  const filtrados = useMemo(() => {
    const q = busca.toLowerCase().trim()
    return noPeriodo.filter((l) => {
      if (q && !l.descricao.toLowerCase().includes(q) && !l.cliente?.nomeCompleto.toLowerCase().includes(q) && !l.categoria?.toLowerCase().includes(q)) return false
      if (tipoFiltro && l.tipo !== tipoFiltro) return false
      if (statusFiltro && l.status !== statusFiltro) return false
      return true
    })
  }, [noPeriodo, busca, tipoFiltro, statusFiltro])

  // KPIs do período filtrado
  const kpis = useMemo(() => {
    const ativos = filtrados.filter((l) => l.status !== 'CANCELADO')
    const receitas = ativos.filter((l) => l.tipo === 'RECEITA').reduce((s, l) => s + l.valor, 0)
    const despesas = ativos.filter((l) => l.tipo === 'DESPESA').reduce((s, l) => s + l.valor, 0)
    const aReceber = ativos.filter((l) => l.tipo === 'RECEITA' && l.status === 'PENDENTE').reduce((s, l) => s + l.valor, 0)
    const aPagar = ativos.filter((l) => l.tipo === 'DESPESA' && l.status === 'PENDENTE').reduce((s, l) => s + l.valor, 0)
    const atrasado = ativos.filter((l) => l.status === 'ATRASADO').reduce((s, l) => s + l.valor, 0)
    return { receitas, despesas, saldo: receitas - despesas, aReceber, aPagar, atrasado }
  }, [filtrados])

  // Série mensal: últimos 6 meses + 1 (mês atual)
  const serieMensal = useMemo(() => {
    const out: { mes: string; receita: number; despesa: number; saldo: number }[] = []
    const refY = hoje.getFullYear()
    const refM = hoje.getMonth()
    let acumulado = 0
    for (let i = 5; i >= -1; i--) {
      const m = refM - i
      const target = new Date(refY, m, 1)
      const y = target.getFullYear()
      const mes = target.getMonth()
      const receita = lancamentos
        .filter((l) => l.tipo === 'RECEITA' && l.status !== 'CANCELADO')
        .filter((l) => {
          const d = new Date(l.dataVencimento)
          return d.getFullYear() === y && d.getMonth() === mes
        })
        .reduce((s, l) => s + l.valor, 0)
      const despesa = lancamentos
        .filter((l) => l.tipo === 'DESPESA' && l.status !== 'CANCELADO')
        .filter((l) => {
          const d = new Date(l.dataVencimento)
          return d.getFullYear() === y && d.getMonth() === mes
        })
        .reduce((s, l) => s + l.valor, 0)
      const liquido = receita - despesa
      acumulado += liquido
      out.push({ mes: `${MES_CURTO[mes]}/${String(y).slice(2)}`, receita, despesa: -despesa, saldo: acumulado })
    }
    return out
  }, [lancamentos, hoje])

  // Heatmap dos próximos 30 dias (apenas pendentes + atrasados)
  const heatmap = useMemo(() => {
    const cells: { date: Date; receita: number; despesa: number; total: number }[] = []
    for (let i = 0; i < 30; i++) {
      const d = new Date(hoje)
      d.setDate(hoje.getDate() + i)
      const dStr = d.toISOString().slice(0, 10)
      const noDia = lancamentos.filter((l) => l.dataVencimento.slice(0, 10) === dStr && l.status !== 'PAGO' && l.status !== 'CANCELADO')
      const receita = noDia.filter((l) => l.tipo === 'RECEITA').reduce((s, l) => s + l.valor, 0)
      const despesa = noDia.filter((l) => l.tipo === 'DESPESA').reduce((s, l) => s + l.valor, 0)
      cells.push({ date: d, receita, despesa, total: receita + despesa })
    }
    return cells
  }, [lancamentos, hoje])

  const maxHeat = useMemo(() => Math.max(1, ...heatmap.map((c) => c.total)), [heatmap])

  // Próximos vencimentos: até 7 itens ordenados por data
  const proximos = useMemo(() => {
    return [...filtrados]
      .filter((l) => l.status === 'PENDENTE' || l.status === 'ATRASADO')
      .sort((a, b) => new Date(a.dataVencimento).getTime() - new Date(b.dataVencimento).getTime())
      .slice(0, 8)
  }, [filtrados])

  const filtrosAtivos = (busca ? 1 : 0) + (tipoFiltro ? 1 : 0) + (statusFiltro ? 1 : 0)
  const limparFiltros = () => { setBusca(''); setTipoFiltro(''); setStatusFiltro('') }

  return (
    <div className="space-y-5">
      {/* Header com identidade Cashflow */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.3em]">
            <span
              className="inline-flex items-center gap-1 rounded-md border px-2 py-0.5 font-semibold"
              style={{ background: 'rgba(34,197,94,0.10)', color: '#22C55E', borderColor: 'rgba(34,197,94,0.30)' }}
            >
              <Wallet size={10} /> Cashflow
            </span>
            <span className="text-slate-500">Stripe-style · fluxo + agenda de vencimentos</span>
          </div>
          <h1 className="mt-2 text-3xl font-bold text-foreground">Financeiro</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Saldo, receitas, despesas e vencimentos. Período: <span className="text-foreground">{PERIODO_LABEL[periodo]}</span>.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/financeiro"
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground transition hover:bg-white/10"
          >
            Voltar à v1
          </Link>
          <Link
            href="/financeiro/novo"
            style={{ background: 'linear-gradient(135deg, #d4af37, #B8962A)' }}
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-black shadow-lg shadow-gold/20"
          >
            <Plus size={16} /> Novo lançamento
          </Link>
        </div>
      </div>

      {/* Saldo destaque + KPIs */}
      <div className="grid gap-3 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div className="glass-card rounded-2xl px-5 py-4">
          <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Saldo do período</p>
          <p
            className="mt-1 text-3xl font-bold"
            style={{
              background: kpis.saldo >= 0
                ? 'linear-gradient(135deg, #FFFFFF, #22C55E)'
                : 'linear-gradient(135deg, #FFFFFF, #EF4444)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            {fmtMoedaFull(kpis.saldo)}
          </p>
          <div className="mt-2 flex items-center gap-3 text-[11px]">
            <span className="inline-flex items-center gap-1 text-emerald-400">
              <ArrowUpCircle size={11} /> {fmtMoeda(kpis.receitas)}
            </span>
            <span className="inline-flex items-center gap-1 text-rose-400">
              <ArrowDownCircle size={11} /> {fmtMoeda(kpis.despesas)}
            </span>
          </div>
        </div>

        <div className="glass-card rounded-2xl px-4 py-3">
          <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">A receber</p>
          <p className="mt-1 text-xl font-bold text-emerald-400">{fmtMoeda(kpis.aReceber)}</p>
          <p className="text-[10px] text-muted-foreground/60">pendente</p>
        </div>

        <div className="glass-card rounded-2xl px-4 py-3">
          <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">A pagar</p>
          <p className="mt-1 text-xl font-bold text-amber-400">{fmtMoeda(kpis.aPagar)}</p>
          <p className="text-[10px] text-muted-foreground/60">pendente</p>
        </div>

        <div className="glass-card rounded-2xl px-4 py-3">
          <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Em atraso</p>
          <p className="mt-1 text-xl font-bold" style={{ color: kpis.atrasado > 0 ? '#EF4444' : '#94A3B8' }}>
            {fmtMoeda(kpis.atrasado)}
          </p>
          <p className="text-[10px] text-muted-foreground/60">requer atenção</p>
        </div>
      </div>

      {/* Toolbar: período + filtros */}
      <div className="glass-card flex flex-wrap items-center gap-2 rounded-2xl p-3">
        <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 p-1">
          {(['mes', '30d', '90d', 'todos'] as PeriodoKey[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriodo(p)}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
                periodo === p ? 'bg-gold/15 text-gold' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {p === 'mes' ? 'Mês' : p === '30d' ? '30d' : p === '90d' ? '90d' : 'Tudo'}
            </button>
          ))}
        </div>

        <div className="relative ml-1 min-w-[200px] flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar descrição, cliente ou categoria…"
            className="w-full rounded-lg border border-white/10 bg-white/5 py-2 pl-9 pr-9 text-sm outline-none focus:border-[rgba(184,150,42,0.4)]"
          />
          {busca && (
            <button onClick={() => setBusca('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X size={13} />
            </button>
          )}
        </div>

        <select
          value={tipoFiltro}
          onChange={(e) => setTipoFiltro(e.target.value)}
          className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-foreground outline-none focus:border-[rgba(184,150,42,0.4)]"
        >
          <option value="">Tipo</option>
          <option value="RECEITA">Receita</option>
          <option value="DESPESA">Despesa</option>
        </select>
        <select
          value={statusFiltro}
          onChange={(e) => setStatusFiltro(e.target.value)}
          className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-foreground outline-none focus:border-[rgba(184,150,42,0.4)]"
        >
          <option value="">Status</option>
          {Object.entries(STATUS_CFG).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
        {filtrosAtivos > 0 && (
          <button
            onClick={limparFiltros}
            className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-white/10 hover:text-foreground"
          >
            <Filter size={12} /> Limpar
          </button>
        )}
        <span className="ml-auto text-xs text-muted-foreground">{filtrados.length} lançamento{filtrados.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Gráfico + Heatmap */}
      <div className="grid gap-4 lg:grid-cols-[1.55fr_1fr]">
        {/* Cashflow chart */}
        <div className="glass-card rounded-2xl p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-[0.22em] text-foreground">Fluxo dos últimos meses</h2>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">receita · despesa · saldo acumulado</span>
          </div>
          <div className="h-[260px] min-h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={serieMensal} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="mes" tick={{ fill: '#94A3B8', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#94A3B8', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  cursor={{ fill: 'rgba(184,150,42,0.05)' }}
                  contentStyle={{
                    background: '#0F0F0F',
                    border: '1px solid rgba(184,150,42,0.30)',
                    borderRadius: 10,
                    fontSize: 12,
                  }}
                  formatter={(v, name) => {
                    const n = typeof v === 'number' ? v : Array.isArray(v) ? Number(v[0]) || 0 : Number(v) || 0
                    const label = name === 'despesa' ? 'Despesa' : name === 'receita' ? 'Receita' : 'Saldo acum.'
                    return [fmtMoeda(Math.abs(n)), label]
                  }}
                />
                <Legend
                  wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
                  iconType="circle"
                  formatter={(value) => <span className="text-muted-foreground">{value === 'receita' ? 'Receita' : value === 'despesa' ? 'Despesa' : 'Saldo acum.'}</span>}
                />
                <Bar dataKey="receita" fill="#22C55E" radius={[4, 4, 0, 0]} />
                <Bar dataKey="despesa" fill="#EF4444" radius={[4, 4, 0, 0]} />
                <Line type="monotone" dataKey="saldo" stroke="#d4af37" strokeWidth={2} dot={{ r: 3, fill: '#d4af37' }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Heatmap 30 dias */}
        <div className="glass-card rounded-2xl p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-[0.22em] text-foreground">Vencimentos · 30 dias</h2>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">heatmap</span>
          </div>
          <div className="grid grid-cols-6 gap-1.5">
            {heatmap.map((c, i) => {
              const intensidade = c.total / maxHeat
              const dominante = c.receita > c.despesa ? '#22C55E' : c.despesa > 0 ? '#EF4444' : '#94A3B8'
              const ehHoje = c.date.getTime() === hoje.getTime()
              return (
                <div
                  key={i}
                  className={`relative flex aspect-square flex-col items-center justify-center rounded-lg border text-[10px] transition ${ehHoje ? 'ring-1 ring-gold/40' : ''}`}
                  style={{
                    background: c.total > 0 ? `${dominante}${Math.round(15 + intensidade * 40).toString(16).padStart(2, '0')}` : 'rgba(255,255,255,0.02)',
                    borderColor: c.total > 0 ? `${dominante}40` : 'rgba(255,255,255,0.06)',
                  }}
                  title={
                    c.total > 0
                      ? `${c.date.toLocaleDateString('pt-BR')}\nReceita: ${fmtMoeda(c.receita)}\nDespesa: ${fmtMoeda(c.despesa)}`
                      : c.date.toLocaleDateString('pt-BR')
                  }
                >
                  <span className={`text-[9px] ${ehHoje ? 'font-bold text-gold' : 'text-muted-foreground'}`}>
                    {c.date.getDate()}
                  </span>
                  {c.total > 0 && (
                    <span className="text-[8px] font-bold" style={{ color: dominante }}>
                      {(c.total / 1000).toFixed(0)}k
                    </span>
                  )}
                </div>
              )
            })}
          </div>
          <div className="mt-3 flex items-center gap-2 text-[10px] text-muted-foreground">
            <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-sm" style={{ background: '#22C55E' }} /> receita</span>
            <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-sm" style={{ background: '#EF4444' }} /> despesa</span>
          </div>
        </div>
      </div>

      {/* Próximos vencimentos */}
      <div className="glass-card overflow-hidden rounded-2xl">
        <div className="flex items-center justify-between border-b border-white/8 px-5 py-4">
          <h2 className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.24em] text-foreground">
            <Receipt size={14} className="text-gold" /> Próximos vencimentos
          </h2>
          <Link href="/financeiro" className="text-[11px] uppercase tracking-wider text-muted-foreground hover:text-gold">
            Ver todos
            <ChevronRight className="ml-1 inline" size={12} />
          </Link>
        </div>
        {proximos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 text-center text-xs text-muted-foreground/70">
            <Calendar size={28} className="mb-3 text-muted-foreground/40" />
            <p>Nenhum vencimento pendente no período</p>
          </div>
        ) : (
          <ul className="divide-y divide-white/5">
            <AnimatePresence>
              {proximos.map((l) => {
                const dias = diasAte(l.dataVencimento)
                const venc =
                  dias < 0 ? { color: '#EF4444', label: `${Math.abs(dias)}d atraso` } :
                  dias === 0 ? { color: '#EF4444', label: 'Hoje' } :
                  dias <= 3 ? { color: '#F59E0B', label: `Em ${dias}d` } :
                  dias <= 7 ? { color: '#F59E0B', label: `Em ${dias}d` } :
                  { color: '#94A3B8', label: `Em ${dias}d` }
                const isRec = l.tipo === 'RECEITA'
                return (
                  <motion.li
                    key={l.id}
                    layout
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-3 px-5 py-3 transition hover:bg-white/[0.03]"
                  >
                    <div
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                      style={{
                        background: isRec ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
                        color: isRec ? '#22C55E' : '#EF4444',
                        border: `1px solid ${isRec ? 'rgba(34,197,94,0.30)' : 'rgba(239,68,68,0.30)'}`,
                      }}
                    >
                      {isRec ? <ArrowUpCircle size={16} /> : <ArrowDownCircle size={16} />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">{l.descricao}</p>
                      <div className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
                        <span>{fmtData(l.dataVencimento)}</span>
                        {l.cliente && (
                          <>
                            <span>·</span>
                            <span className="truncate">{l.cliente.nomeCompleto}</span>
                          </>
                        )}
                        {l.categoria && (
                          <>
                            <span>·</span>
                            <span>{l.categoria}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <span
                      className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium"
                      style={{ background: `${venc.color}15`, color: venc.color, border: `1px solid ${venc.color}40` }}
                    >
                      {l.status === 'ATRASADO' && <AlertTriangle size={9} className="mr-1 inline" />}
                      {venc.label}
                    </span>
                    <span
                      className="shrink-0 text-right text-sm font-bold tabular-nums"
                      style={{ color: isRec ? '#22C55E' : '#EF4444' }}
                    >
                      {isRec ? '+' : '−'}{fmtMoeda(l.valor)}
                    </span>
                  </motion.li>
                )
              })}
            </AnimatePresence>
          </ul>
        )}
      </div>
    </div>
  )
}
