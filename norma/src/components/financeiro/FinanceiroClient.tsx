'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, X, TrendingUp, TrendingDown, DollarSign, AlertCircle, Pencil, Trash2 } from 'lucide-react'

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
  PENDENTE: { label: 'Pendente', color: 'bg-amber-100 text-amber-800' },
  PAGO: { label: 'Pago', color: 'bg-green-100 text-green-800' },
  ATRASADO: { label: 'Atrasado', color: 'bg-red-100 text-red-800' },
  CANCELADO: { label: 'Cancelado', color: 'bg-gray-100 text-gray-500' },
}

const inputClass = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent"
const labelClass = "block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1"

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
  const router = useRouter()
  const [lancamentos, setLancamentos] = useState(inicial)
  const [modalAberto, setModalAberto] = useState(false)
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [filtro, setFiltro] = useState<'TODOS' | 'ENTRADA' | 'SAIDA'>('TODOS')
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  // Maps id -> 'confirming' | undefined for inline delete confirmation
  const [confirmandoDeletar, setConfirmandoDeletar] = useState<Record<string, boolean>>({})

  const [form, setForm] = useState({
    descricao: '',
    tipo: 'ENTRADA',
    categoria: '',
    valor: '',
    dataVencimento: '',
    dataPagamento: '',
    status: 'PENDENTE',
    observacoes: '',
    clienteId: '',
    recorrente: false,
  })

  const filtrados = useMemo(() => (
    lancamentos
      .filter((l) => filtro === 'TODOS' ? true : l.tipo === filtro)
      .slice()
      .sort((a, b) => new Date(b.dataVencimento).getTime() - new Date(a.dataVencimento).getTime())
  ), [filtro, lancamentos])

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

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value, type } = e.target
    if (type === 'checkbox') {
      setForm(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }))
    } else {
      setForm(prev => ({ ...prev, [name]: value }))
    }
  }

  function abrirModalNovo() {
    setForm({
      descricao: '', tipo: 'ENTRADA', categoria: '', valor: '',
      dataVencimento: '', dataPagamento: '', status: 'PENDENTE',
      observacoes: '', clienteId: '', recorrente: false,
    })
    setEditandoId(null)
    setErro('')
    setModalAberto(true)
  }

  function abrirModalEditar(l: Lancamento) {
    setForm({
      descricao: l.descricao,
      tipo: l.tipo,
      categoria: l.categoria ?? '',
      valor: String(l.valor),
      dataVencimento: l.dataVencimento.slice(0, 10),
      dataPagamento: l.dataPagamento ? l.dataPagamento.slice(0, 10) : '',
      status: l.status,
      observacoes: l.observacoes ?? '',
      clienteId: l.clienteId ?? '',
      recorrente: l.recorrente,
    })
    setEditandoId(l.id)
    setErro('')
    setModalAberto(true)
  }

  function fecharModal() {
    setModalAberto(false)
    setEditandoId(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    setLoading(true)

    try {
      const payload = {
        ...form,
        valor: parseFloat(form.valor),
        clienteId: form.clienteId || null,
        dataPagamento: form.dataPagamento || null,
        recorrente: form.recorrente,
      }

      if (editandoId) {
        // PUT
        const res = await fetch(`/api/financeiro/${editandoId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!res.ok) throw new Error()

        const cliente = clientes.find(c => c.id === form.clienteId) ?? null
        setLancamentos(prev => prev.map(l =>
          l.id === editandoId
            ? {
                ...l,
                ...payload,
                valor: Number(payload.valor),
                dataVencimento: new Date(form.dataVencimento).toISOString(),
                dataPagamento: form.dataPagamento ? new Date(form.dataPagamento).toISOString() : null,
                cliente,
              }
            : l
        ))
      } else {
        // POST
        const res = await fetch('/api/financeiro', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!res.ok) throw new Error()

        const novo = await res.json()
        const cliente = clientes.find(c => c.id === form.clienteId) ?? null
        setLancamentos(prev => [{ ...novo, valor: Number(novo.valor), recorrente: form.recorrente, cliente }, ...prev])
      }

      fecharModal()
      router.refresh()
    } catch {
      setErro('Erro ao salvar. Verifique os dados.')
    } finally {
      setLoading(false)
    }
  }

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
      <div className="grid grid-cols-4 gap-5 mb-8">
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="w-8 h-8 bg-green-50 text-green-700 rounded-lg flex items-center justify-center mb-3">
            <TrendingUp size={16} />
          </div>
          <div className="text-2xl font-bold text-green-700">{fmt(totalEntradas)}</div>
          <div className="text-xs text-gray-500 mt-1 uppercase tracking-wide font-medium">Receitas pagas</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="w-8 h-8 bg-red-50 text-red-700 rounded-lg flex items-center justify-center mb-3">
            <TrendingDown size={16} />
          </div>
          <div className="text-2xl font-bold text-red-700">{fmt(totalSaidas)}</div>
          <div className="text-xs text-gray-500 mt-1 uppercase tracking-wide font-medium">Despesas pagas</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="w-8 h-8 bg-blue-50 text-blue-700 rounded-lg flex items-center justify-center mb-3">
            <DollarSign size={16} />
          </div>
          <div className="text-2xl font-bold text-blue-700">{fmt(aReceber)}</div>
          <div className="text-xs text-gray-500 mt-1 uppercase tracking-wide font-medium">A receber</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="w-8 h-8 bg-amber-50 text-amber-700 rounded-lg flex items-center justify-center mb-3">
            <AlertCircle size={16} />
          </div>
          <div className="text-2xl font-bold text-amber-700">{fmt(inadimplencia)}</div>
          <div className="text-xs text-gray-500 mt-1 uppercase tracking-wide font-medium">Inadimplência</div>
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between gap-4">
          <div className="flex gap-1">
            {(['TODOS', 'ENTRADA', 'SAIDA'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFiltro(f)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  filtro === f
                    ? 'bg-green-800 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {f === 'TODOS' ? 'Todos' : f === 'ENTRADA' ? 'Receitas' : 'Despesas'}
              </button>
            ))}
          </div>
          <button
            onClick={abrirModalNovo}
            className="flex items-center gap-2 bg-green-800 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            <Plus size={14} />
            Novo Lançamento
          </button>
        </div>

        {filtrados.length === 0 ? (
          <div className="p-16 text-center">
            <div className="text-gray-300 text-5xl mb-4">💰</div>
            <div className="text-gray-500 font-medium">Nenhum lançamento</div>
            <div className="text-gray-400 text-sm mt-1">Clique em &quot;Novo Lançamento&quot; para começar</div>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-5 py-3">Descrição</th>
                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-5 py-3">Tipo</th>
                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-5 py-3">Cliente</th>
                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-5 py-3">Valor</th>
                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-5 py-3">Vencimento</th>
                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wide">Ações</th>
              </tr>
            </thead>
            <tbody>
              {grupos.map(grupo => (
                <>
                  {/* Month group header */}
                  <tr key={`header-${grupo.key}`} className="sticky top-0 z-10">
                    <td
                      colSpan={7}
                      className="px-5 py-2 text-xs font-semibold uppercase tracking-widest"
                      style={{ backgroundColor: '#f0fdf4', color: '#166534', borderTop: '1px solid #dcfce7', borderBottom: '1px solid #dcfce7' }}
                    >
                      {grupo.label.charAt(0).toUpperCase() + grupo.label.slice(1)}
                    </td>
                  </tr>

                  {/* Rows for this month */}
                  {grupo.items.map(l => {
                    const status = statusConfig[l.status] ?? { label: l.status, color: 'bg-gray-100 text-gray-500' }
                    const vencido = l.status === 'PENDENTE' && new Date(l.dataVencimento) < new Date()
                    const confirmando = !!confirmandoDeletar[l.id]

                    return (
                      <tr
                        key={l.id}
                        className={`border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors ${vencido ? 'bg-red-50' : ''}`}
                      >
                        <td className="px-5 py-3">
                          <div className="text-sm font-medium text-gray-900 flex items-center gap-1.5">
                            {l.descricao}
                            {l.recorrente && (
                              <span className="text-xs text-blue-500 font-normal" title="Recorrente">
                                ↻
                              </span>
                            )}
                          </div>
                          {l.categoria && <div className="text-xs text-gray-400">{l.categoria}</div>}
                        </td>
                        <td className="px-5 py-3">
                          <span className={`text-xs font-medium px-2 py-1 rounded-full ${l.tipo === 'ENTRADA' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {l.tipo === 'ENTRADA' ? 'Receita' : 'Despesa'}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-sm text-gray-600">
                          {l.cliente?.nomeCompleto || '—'}
                        </td>
                        <td className={`px-5 py-3 text-sm font-bold ${l.tipo === 'ENTRADA' ? 'text-green-700' : 'text-red-700'}`}>
                          {l.tipo === 'ENTRADA' ? '+' : '-'}{fmt(l.valor)}
                        </td>
                        <td className={`px-5 py-3 text-sm ${vencido ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
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
                                className="text-xs text-green-700 hover:underline font-medium whitespace-nowrap"
                              >
                                Marcar pago
                              </button>
                            )}
                            <button
                              onClick={() => abrirModalEditar(l)}
                              title="Editar"
                              className="p-1.5 rounded-lg text-gray-400 hover:text-green-700 hover:bg-green-50 transition-colors"
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              onClick={() => handleDeletar(l.id)}
                              title={confirmando ? 'Clique para confirmar exclusão' : 'Excluir'}
                              className={`p-1.5 rounded-lg transition-colors text-xs font-medium ${
                                confirmando
                                  ? 'bg-red-100 text-red-700 hover:bg-red-200 px-2'
                                  : 'text-gray-400 hover:text-red-600 hover:bg-red-50'
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
        )}
      </div>

      {/* Modal */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white">
              <h2 className="text-base font-semibold text-gray-900">
                {editandoId ? 'Editar Lançamento' : 'Novo Lançamento'}
              </h2>
              <button onClick={fecharModal} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className={labelClass}>Descrição *</label>
                  <input name="descricao" value={form.descricao} onChange={handleChange} className={inputClass} required placeholder="Ex: Honorários João Silva" />
                </div>
                <div>
                  <label className={labelClass}>Tipo *</label>
                  <select name="tipo" value={form.tipo} onChange={handleChange} className={inputClass}>
                    <option value="ENTRADA">Receita (Entrada)</option>
                    <option value="SAIDA">Despesa (Saída)</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Categoria</label>
                  <input name="categoria" value={form.categoria} onChange={handleChange} className={inputClass} placeholder="Ex: Honorários" />
                </div>
                <div>
                  <label className={labelClass}>Valor (R$) *</label>
                  <input type="number" name="valor" value={form.valor} onChange={handleChange} className={inputClass} required step="0.01" min="0" placeholder="0,00" />
                </div>
                <div>
                  <label className={labelClass}>Status</label>
                  <select name="status" value={form.status} onChange={handleChange} className={inputClass}>
                    <option value="PENDENTE">Pendente</option>
                    <option value="PAGO">Pago</option>
                    <option value="ATRASADO">Atrasado</option>
                    <option value="CANCELADO">Cancelado</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Data de Vencimento *</label>
                  <input type="date" name="dataVencimento" value={form.dataVencimento} onChange={handleChange} className={inputClass} required />
                </div>
                <div>
                  <label className={labelClass}>Data de Pagamento</label>
                  <input type="date" name="dataPagamento" value={form.dataPagamento} onChange={handleChange} className={inputClass} />
                </div>
                <div className="col-span-2">
                  <label className={labelClass}>Cliente (opcional)</label>
                  <select name="clienteId" value={form.clienteId} onChange={handleChange} className={inputClass}>
                    <option value="">Nenhum</option>
                    {clientes.map(c => (
                      <option key={c.id} value={c.id}>{c.nomeCompleto}</option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className={labelClass}>Observações</label>
                  <textarea name="observacoes" value={form.observacoes} onChange={handleChange} className={inputClass} rows={2} />
                </div>
                <div className="col-span-2">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      name="recorrente"
                      checked={form.recorrente}
                      onChange={handleChange}
                      className="w-4 h-4 rounded border-gray-300 text-green-700 focus:ring-green-600 accent-green-700"
                    />
                    <span className="text-sm text-gray-700 font-medium">Lançamento recorrente</span>
                    <span className="text-xs text-gray-400">(cria próximo mês automaticamente ao marcar como pago)</span>
                  </label>
                </div>
              </div>

              {erro && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mt-4">{erro}</div>
              )}

              <div className="flex gap-3 mt-6">
                <button type="button" onClick={fecharModal} className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                  Cancelar
                </button>
                <button type="submit" disabled={loading} className="flex-1 px-4 py-2 text-sm font-medium text-white bg-green-800 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50">
                  {loading ? 'Salvando...' : editandoId ? 'Salvar Alterações' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

