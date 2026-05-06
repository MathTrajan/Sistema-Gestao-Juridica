'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const tipoOptions = [
  { value: 'RECURSO', label: 'Recurso' },
  { value: 'CONTESTACAO', label: 'Contestação' },
  { value: 'MANIFESTACAO', label: 'Manifestação' },
  { value: 'REPLICA', label: 'Réplica' },
  { value: 'APELACAO', label: 'Apelação' },
  { value: 'CONTRARRAZOES', label: 'Contrarrazões' },
  { value: 'EMBARGOS', label: 'Embargos' },
  { value: 'OUTRO', label: 'Outro' },
]

interface Props {
  processos: { id: string; numero: string | null; cliente: { nomeCompleto: string } }[]
  processoIdInicial?: string
}

export default function PrazoForm({ processos, processoIdInicial }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')

  const [form, setForm] = useState({
    processoId: processoIdInicial || '',
    titulo: '',
    tipo: 'MANIFESTACAO',
    dataInicio: '',
    dataFinal: '',
    diasUteis: '',
    status: 'ABERTO',
    observacoes: '',
  })

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    setLoading(true)

    try {
      const res = await fetch('/api/prazos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      if (!res.ok) throw new Error()

      router.push('/prazos')
      router.refresh()
    } catch {
      setErro('Erro ao salvar. Verifique os dados e tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const inputClass = "w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-foreground outline-none transition focus:border-[rgba(184,150,42,0.4)] focus:bg-white/[0.08]"
  const labelClass = "block text-xs font-semibold uppercase tracking-wide mb-1 text-muted-foreground"
  const sectionClass = "rounded-xl border border-white/10 bg-white/5 p-6 mb-5"

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl">
      <div className={sectionClass}>
        <h2 className="text-sm font-semibold text-foreground mb-4">Vínculo</h2>
        <div>
          <label className={labelClass}>Processo *</label>
          <select name="processoId" value={form.processoId} onChange={handleChange} className={inputClass} required>
            <option value="">Selecione o processo</option>
            {processos.map(p => (
              <option key={p.id} value={p.id}>
                {p.numero || 'Sem número'} — {p.cliente.nomeCompleto}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className={sectionClass}>
        <h2 className="text-sm font-semibold text-foreground mb-4">Dados do Prazo</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className={labelClass}>Título *</label>
            <input name="titulo" value={form.titulo} onChange={handleChange} className={inputClass} placeholder="Ex: Recurso Ordinário" required />
          </div>
          <div>
            <label className={labelClass}>Tipo *</label>
            <select name="tipo" value={form.tipo} onChange={handleChange} className={inputClass} required>
              {tipoOptions.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Dias Úteis</label>
            <input type="number" name="diasUteis" value={form.diasUteis} onChange={handleChange} className={inputClass} placeholder="Ex: 15" />
          </div>
          <div>
            <label className={labelClass}>Data de Início *</label>
            <input type="date" name="dataInicio" value={form.dataInicio} onChange={handleChange} className={inputClass} required />
          </div>
          <div>
            <label className={labelClass}>Data Final *</label>
            <input type="date" name="dataFinal" value={form.dataFinal} onChange={handleChange} className={inputClass} required />
          </div>
          <div>
            <label className={labelClass}>Status</label>
            <select name="status" value={form.status} onChange={handleChange} className={inputClass}>
              <option value="ABERTO">Aberto</option>
              <option value="CUMPRIDO">Cumprido</option>
              <option value="SUSPENSO">Suspenso</option>
            </select>
          </div>
          <div className="col-span-2">
            <label className={labelClass}>Observações</label>
            <textarea name="observacoes" value={form.observacoes} onChange={handleChange} className={inputClass} rows={3} />
          </div>
        </div>
      </div>

      {erro && (
        <div className="rounded-lg border border-red-400/30 bg-red-400/10 text-red-400 text-sm px-4 py-3 mb-4">
          {erro}
        </div>
      )}

      <div className="flex gap-3">
        <button type="button" onClick={() => router.back()} className="px-5 py-2 text-sm font-medium text-muted-foreground border border-white/10 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
          Cancelar
        </button>
        <button type="submit" disabled={loading} className="px-5 py-2 text-sm font-semibold text-black rounded-lg transition-all disabled:opacity-50" style={{ background: 'linear-gradient(135deg, #d4af37, #B8962A)' }}>
          {loading ? 'Salvando...' : 'Salvar Prazo'}
        </button>
      </div>
    </form>
  )
}