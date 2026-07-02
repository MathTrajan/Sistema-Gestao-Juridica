'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, TrendingUp, TrendingDown, DollarSign, AlertCircle, Pencil, Trash2, Search } from 'lucide-react'

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
  clienteId: string | null
  cliente: { id: string; nomeCompleto: string } | null
  recorrente: boolean
  createdAt: string
}

interface Props {
  lancamentos: Lancamento[]
  clientes: { id: string; nomeCompleto: string }[]
}

const statusConfig: Record<string, { label: string; color: string }> = {
  PENDENTE: { label: 'Pendente', color: 'bg-warning-bg text-warning' },
  PAGO: { label: 'Pago', color: 'bg-success-bg text-success' },
  ATRASADO: { label: 'Atrasado', color: 'bg-danger-bg text-danger' },
  CANCELADO: { label: 'Cancelado', color: 'bg-white/8 text-muted-foreground' },
}

function mesAnoLabel(isoDate: string): string {
  const d = new Date(isoDate)
  return d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
}

function mesAnoKey(isoDate: string): string {
  const d = new Date(isoDate)
  // zero-padded "YYYY-MM" for reliable sorting
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

function addOneMonth(isoDate: string): string {
  const d = new Date(isoDate)
  d.setMonth(d.getMonth() + 1)
  return d.toISOString().slice(0, 10)
}

export default function FinanceiroClient({ lancamentos: inicial, clientes }: Props) {
  void clientes
  const router = useRouter()
  const [lancamentos, setLancamentos] = useState(inicial)
  const [filtro, setFiltro] = useState<'TODOS' | 'ENTRADA' | 'SAIDA'>('TODOS')
  const [filtroStatus, setFiltroStatus] = useState<'TODOS' | 'PENDENTE' | 'PAGO' | 'ATRASADO' | 'CANCELADO'>('TODOS')
  const [busca, setBusca] = useState('')
  const [confirmandoDeletar, setConfirmandoDeletar] = useState<Record<string, boolean>>({})

  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase()
    return lancamentos
      .filter((l) => {
        const matchTipo = filtro === 'TODOS' || l.tipo === filtro
        const matchStatus = filtroStatus === 'TODOS' || l.status === filtroStatus
        const matchBusca = !q ||
          l.descricao.toLowerCase().includes(q) ||
          l.cliente?.nomeCompleto.toLowerCase().includes(q) ||
          l.categoria?.toLowerCase().includes(q)
        return matchTipo && matchStatus && matchBusca
      })
      .slice()
      .sort((a, b) => new Date(b.dataVencimento).getTime() - new Date(a.dataVencimento).getTime())
  }, [filtro, filtroStatus, busca, lancamentos])

  const grupos = useMemo(() => {
    const grouped: { key: string; label: string; items: Lancamento[] }[] = []
    for (const lancamento of filtrados) {
      const key = mesAnoKey(lancamento.dataVencimento)
      const last = grouped[grouped.length - 1]
      if (last && last.key === key) {
        last.items.push(lancamento)
      } else {
        grouped.push({ key, label: mesAnoLabel(lancamento.dataVencimento), items: [lancamento] })
      }
    }
    return grouped
  }, [filtrados])

  const { totalEntradas, totalSaidas, aReceber, inadimplencia } = useMemo(() => ({
    totalEntradas: lancamentos
      .filter((l) => l.tipo === 'ENTRADA' && l.status === 'PAGO')
      .reduce((acc, l) => acc + l.valor, 0),
    totalSaidas: lancamentos
      .filter((l) => l.tipo === 'SAIDA' && l.status === 'PAGO')
      .reduce((acc, l) => acc + l.valor, 0),
    aReceber: lancamentos
      .filter((l) => l.tipo === 'ENTRADA' && l.status === 'PENDENTE')
      .reduce((acc, l) => acc + l.valor, 0),
    inadimplencia: lancamentos
      .filter((l) => l.tipo === 'ENTRADA' && l.status === 'ATRASADO')
      .reduce((acc, l) => acc + l.valor, 0),
  }), [lancamentos])

  async function marcarPago(id: string) {
    const l = lancamentos.find(x => x.id === id)
    if (!l) return

    const agora = new Date().toISOString()

    setLancamentos(prev => prev.map(x =>
      x.id === id ? { ...x, status: 'PAGO', dataPagamento: agora } : x
    ))

    await fetch(`/api/financeiro/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...l,
        status: 'PAGO',
        dataPagamento: agora,
        clienteId: l.clienteId || null,
      }),
    })

    // Auto-create next month's entry if recorrente
    if (l.recorrente) {
      const novaDataVencimento = addOneMonth(l.dataVencimento)
      const res = await fetch('/api/financeiro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          descricao: l.descricao,
          tipo: l.tipo,
          categoria: l.categoria,
          valor: l.valor,
          dataVencimento: novaDataVencimento,
          dataPagamento: null,
          status: 'PENDENTE',
          observacoes: l.observacoes,
          clienteId: l.clienteId || null,
          recorrente: true,
        }),
      })
      if (res.ok) {
        const novo = await res.json()
        setLancamentos(prev => [
          { ...novo, valor: Number(novo.valor), recorrente: true, cliente: l.cliente },
          ...prev,
        ])
      }
    }

    router.refresh()
  }

  async function handleDeletar(id: string) {
    if (!confirmandoDeletar[id]) {
      // First click: enter confirmation mode, auto-reset after 3s
      setConfirmandoDeletar(prev => ({ ...prev, [id]: true }))
      setTimeout(() => {
        setConfirmandoDeletar(prev => {
          const next = { ...prev }
          delete next[id]
          return next
        })
      }, 3000)
      return
    }

    // Second click: actually delete
    setConfirmandoDeletar(prev => {
      const next = { ...prev }
      delete next[id]
      return next
    })

    const res = await fetch(`/api/financeiro/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setLancamentos(prev => prev.filter(l => l.id !== id))
      router.refresh()
    }
  }

  function fmt(valor: number) {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  }

  return (
    <>
      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-8 xl:grid-cols-4">
        <div className="rounded-xl border border-white/10 bg-white/5 p-5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-3" style={{ background: 'rgba(34,197,94,0.12)', color: '#4ade80' }}>
            <TrendingUp size={16} />
          </div>
          <div className="text-2xl font-bold text-success">{fmt(totalEntradas)}</div>
          <div className="text-xs text-muted-foreground mt-1 uppercase tracking-wide font-medium">Receitas pagas</div>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-3" style={{ background: 'rgba(239,68,68,0.12)', color: '#f87171' }}>
            <TrendingDown size={16} />
          </div>
          <div className="text-2xl font-bold text-danger">{fmt(totalSaidas)}</div>
          <div className="text-xs text-muted-foreground mt-1 uppercase tracking-wide font-medium">Despesas pagas</div>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-3" style={{ background: 'rgba(59,130,246,0.12)', color: '#60a5fa' }}>
            <DollarSign size={16} />
          </div>
          <div className="text-2xl font-bold text-info">{fmt(aReceber)}</div>
          <div className="text-xs text-muted-foreground mt-1 uppercase tracking-wide font-medium">A receber</div>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-3" style={{ background: 'rgba(245,158,11,0.12)', color: '#fbbf24' }}>
            <AlertCircle size={16} />
          </div>
          <div className="text-2xl font-bold text-warning">{fmt(inadimplencia)}</div>
          <div className="text-xs text-muted-foreground mt-1 uppercase tracking-wide font-medium">Inadimplência</div>
        </div>
      </div>

      {/* Tabela */}
      <div className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
        <div className="border-b border-white/10 px-5 py-4 flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-1">
              {(['TODOS', 'ENTRADA', 'SAIDA'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFiltro(f)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                    filtro === f ? 'text-black' : 'bg-white/5 text-muted-foreground hover:bg-white/10'
                  }`}
                  style={filtro === f ? { background: 'linear-gradient(135deg,#B8962A,#E4C874)' } : {}}
                >
                  {f === 'TODOS' ? 'Todos' : f === 'ENTRADA' ? 'Receitas' : 'Despesas'}
                </button>
              ))}
              <div className="w-px bg-white/10 mx-1" />
              {(['TODOS', 'PENDENTE', 'PAGO', 'ATRASADO', 'CANCELADO'] as const).map(s => (
                <button
                  key={s}
                  onClick={() => setFiltroStatus(s)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                    filtroStatus === s
                      ? s === 'PAGO' ? 'bg-success-bg text-success'
                        : s === 'ATRASADO' ? 'bg-danger-bg text-danger'
                        : s === 'PENDENTE' ? 'bg-warning-bg text-warning'
                        : s === 'CANCELADO' ? 'bg-white/10 text-muted-foreground'
                        : 'text-black'
                      : 'bg-white/5 text-muted-foreground hover:bg-white/10'
                  }`}
                  style={filtroStatus === s && s === 'TODOS' ? { background: 'linear-gradient(135deg,#B8962A,#E4C874)' } : {}}
                >
                  {s === 'TODOS' ? 'Qualquer status' : s === 'PAGO' ? 'Pagos' : s === 'PENDENTE' ? 'Pendentes' : s === 'ATRASADO' ? 'Atrasados' : 'Cancelados'}
                </button>
              ))}
            </div>
            <button
              onClick={() => router.push('/financeiro/novo')}
              className="flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-lg transition-opacity hover:opacity-90 text-black shrink-0"
              style={{ background: 'linear-gradient(135deg,#B8962A,#E4C874)' }}
            >
              <Plus size={14} />
              Novo Lançamento
            </button>
          </div>
          <div className="relative">
            <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={busca}
              onChange={e => setBusca(e.target.value)}
              placeholder="Buscar por descrição, cliente, categoria..."
              className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-sm text-foreground outline-none transition focus:border-gold/35 focus:bg-white/8"
            />
          </div>
        </div>

        {filtrados.length === 0 ? (
          <div className="p-16 text-center">
            <div className="text-4xl mb-4">💰</div>
            <div className="text-foreground font-medium">Nenhum lançamento</div>
            <div className="text-muted-foreground text-sm mt-1">Clique em &quot;Novo Lançamento&quot; para começar</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr className="border-b border-white/10 bg-white/3">
                  <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.24em] px-5 py-3">Descrição</th>
                  <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.24em] px-5 py-3 hidden sm:table-cell">Tipo</th>
                  <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.24em] px-5 py-3 hidden lg:table-cell">Cliente</th>
                  <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.24em] px-5 py-3">Valor</th>
                  <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.24em] px-5 py-3 hidden md:table-cell">Vencimento</th>
                  <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.24em] px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.24em]">Ações</th>
                </tr>
              </thead>
              <tbody>
                {grupos.map(grupo => (
                  <>
                    <tr key={`header-${grupo.key}`} className="sticky top-0 z-10">
                      <td
                        colSpan={7}
                        className="px-5 py-2 text-xs font-semibold uppercase tracking-widest text-gold"
                        style={{ background: 'rgba(184,150,42,0.06)', borderTop: '1px solid rgba(184,150,42,0.12)', borderBottom: '1px solid rgba(184,150,42,0.12)' }}
                      >
                        {grupo.label.charAt(0).toUpperCase() + grupo.label.slice(1)}
                      </td>
                    </tr>

                    {grupo.items.map(l => {
                      const status = statusConfig[l.status] ?? { label: l.status, color: 'bg-white/8 text-muted-foreground' }
                      const vencido = l.status === 'PENDENTE' && new Date(l.dataVencimento) < new Date()
                      const confirmando = !!confirmandoDeletar[l.id]

                      return (
                        <tr
                          key={l.id}
                          className={`border-b border-white/6 transition-colors hover:bg-white/4 ${vencido ? 'bg-danger-bg' : ''}`}
                        >
                          <td className="px-5 py-3">
                            <div className="text-sm font-medium text-foreground flex items-center gap-1.5">
                              {l.descricao}
                              {l.recorrente && (
                                <span className="text-xs text-info font-normal" title="Recorrente">↻</span>
                              )}
                            </div>
                            {l.categoria && <div className="text-xs text-muted-foreground">{l.categoria}</div>}
                          </td>
                          <td className="px-5 py-3 hidden sm:table-cell">
                            <span className={`text-xs font-medium px-2 py-1 rounded-full ${l.tipo === 'ENTRADA' ? 'bg-success-bg text-success' : 'bg-danger-bg text-danger'}`}>
                              {l.tipo === 'ENTRADA' ? 'Receita' : 'Despesa'}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-sm text-muted-foreground hidden lg:table-cell">
                            {l.cliente?.nomeCompleto || '—'}
                          </td>
                          <td className={`px-5 py-3 text-sm font-bold ${l.tipo === 'ENTRADA' ? 'text-success' : 'text-danger'}`}>
                            {l.tipo === 'ENTRADA' ? '+' : '-'}{fmt(l.valor)}
                          </td>
                          <td className={`px-5 py-3 text-sm hidden md:table-cell ${vencido ? 'text-danger font-medium' : 'text-muted-foreground'}`}>
                            {new Date(l.dataVencimento).toLocaleDateString('pt-BR')}
                            {vencido && ' ⚠️'}
                          </td>
                          <td className="px-5 py-3">
                            <span className={`text-xs font-medium px-2 py-1 rounded-full ${status.color}`}>
                              {status.label}
                            </span>
                          </td>
                          <td className="px-5 py-3">
                            <div className="flex items-center justify-end gap-2">
                              {l.status === 'PENDENTE' && (
                                <button
                                  onClick={() => marcarPago(l.id)}
                                  className="text-xs text-success hover:underline font-medium whitespace-nowrap"
                                >
                                  Marcar pago
                                </button>
                              )}
                              <button
                                onClick={() => router.push(`/financeiro/${l.id}/editar`)}
                                title="Editar"
                                className="p-1.5 rounded-lg text-muted-foreground hover:text-gold hover:bg-gold/8 transition-colors"
                              >
                                <Pencil size={14} />
                              </button>
                              <button
                                onClick={() => handleDeletar(l.id)}
                                title={confirmando ? 'Clique para confirmar exclusão' : 'Excluir'}
                                className={`p-1.5 rounded-lg transition-colors text-xs font-medium ${
                                  confirmando
                                    ? 'bg-danger-bg text-danger px-2'
                                    : 'text-muted-foreground hover:text-danger hover:bg-danger-bg'
                                }`}
                              >
                                {confirmando ? 'Confirmar?' : <Trash2 size={14} />}
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </>
  )
}
