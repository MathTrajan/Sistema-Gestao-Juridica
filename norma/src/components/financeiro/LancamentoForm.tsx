'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  lancamentoId?: string
  initialData?: Partial<FormState>
  clientes: { id: string; nomeCompleto: string }[]
}

interface FormState {
  descricao: string
  tipo: string
  categoria: string
  valor: string
  dataVencimento: string
  dataPagamento: string
  status: string
  observacoes: string
  clienteId: string
  recorrente: boolean
}

const inputClass = "w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-foreground outline-none transition focus:border-[rgba(184,150,42,0.4)] focus:bg-white/[0.08]"
const labelClass = "block text-xs font-semibold uppercase tracking-wide mb-1 text-muted-foreground"
const sectionClass = "rounded-xl border border-white/10 bg-white/5 p-6 mb-5"

export default function LancamentoForm({ lancamentoId, initialData, clientes }: Props) {
  const router = useRouter()
  const isEdit = !!lancamentoId
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')

  const [form, setForm] = useState<FormState>({
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
    ...initialData,
  })

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value, type } = e.target
    if (type === 'checkbox') {
      setForm(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }))
    } else {
      setForm(prev => ({ ...prev, [name]: value }))
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.descricao.trim()) { setErro('Descrição é obrigatória.'); return }
    if (!form.valor || isNaN(parseFloat(form.valor))) { setErro('Valor inválido.'); return }
    if (!form.dataVencimento) { setErro('Data de vencimento é obrigatória.'); return }
    setErro('')
    setLoading(true)

    try {
      const payload = {
        ...form,
        valor: parseFloat(form.valor),
        clienteId: form.clienteId || null,
        dataPagamento: form.dataPagamento || null,
      }

      const res = await fetch(
        isEdit ? `/api/financeiro/${lancamentoId}` : '/api/financeiro',
        {
          method: isEdit ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      )

      if (!res.ok) throw new Error()
      router.push('/financeiro')
      router.refresh()
    } catch {
      setErro('Erro ao salvar. Verifique os dados.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl">

      {/* Dados principais */}
      <div className={sectionClass}>
        <h2 className="text-sm font-semibold text-foreground mb-4">Dados do Lançamento</h2>
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
        </div>
      </div>

      {/* Datas */}
      <div className={sectionClass}>
        <h2 className="text-sm font-semibold text-foreground mb-4">Datas</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Data de Vencimento *</label>
            <input type="date" name="dataVencimento" value={form.dataVencimento} onChange={handleChange} className={inputClass} required />
          </div>
          <div>
            <label className={labelClass}>Data de Pagamento</label>
            <input type="date" name="dataPagamento" value={form.dataPagamento} onChange={handleChange} className={inputClass} />
          </div>
        </div>
      </div>

      {/* Vínculo e extras */}
      <div className={sectionClass}>
        <h2 className="text-sm font-semibold text-foreground mb-4">Vínculo e Detalhes</h2>
        <div className="grid grid-cols-2 gap-4">
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
            <textarea name="observacoes" value={form.observacoes} onChange={handleChange} className={inputClass} rows={3} />
          </div>
          <div className="col-span-2">
            <label className="flex items-center gap-3 cursor-pointer select-none p-3 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/5 transition-colors">
              <input
                type="checkbox"
                name="recorrente"
                checked={form.recorrente}
                onChange={handleChange}
                className="w-4 h-4 rounded cursor-pointer accent-[#B8962A] flex-shrink-0"
              />
              <div>
                <div className="text-sm text-foreground font-medium">Lançamento recorrente</div>
                <div className="text-xs text-muted-foreground">Cria próximo mês automaticamente ao marcar como pago</div>
              </div>
            </label>
          </div>
        </div>
      </div>

      {erro && (
        <div className="rounded-lg border border-red-400/30 bg-red-400/10 text-red-400 text-sm px-4 py-3 mb-4">
          {erro}
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-5 py-2 text-sm font-medium text-muted-foreground border border-white/10 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-5 py-2 text-sm font-semibold text-black rounded-lg transition-all disabled:opacity-50"
          style={{ background: 'linear-gradient(135deg, #d4af37, #B8962A)' }}
        >
          {loading ? 'Salvando...' : isEdit ? 'Salvar Alterações' : 'Salvar Lançamento'}
        </button>
      </div>
    </form>
  )
}
