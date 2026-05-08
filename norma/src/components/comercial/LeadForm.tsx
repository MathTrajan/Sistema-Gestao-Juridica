'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const inputClass = "w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-foreground outline-none transition focus:border-[rgba(184,150,42,0.4)] focus:bg-white/[0.08]"
const labelClass = "block text-xs font-semibold uppercase tracking-wide mb-1 text-muted-foreground"
const sectionClass = "rounded-xl border border-white/10 bg-white/5 p-6 mb-5"

const areaOptions = [
  { value: 'TRABALHISTA', label: 'Trabalhista' },
  { value: 'CIVIL', label: 'Cível' },
  { value: 'TRIBUTARIO', label: 'Tributário' },
  { value: 'PREVIDENCIARIO', label: 'Previdenciário' },
  { value: 'CRIMINAL', label: 'Criminal' },
  { value: 'FAMILIA', label: 'Família' },
  { value: 'EMPRESARIAL', label: 'Empresarial' },
  { value: 'OUTRO', label: 'Outro' },
]

const origemOptions = [
  { value: 'INDICACAO', label: 'Indicação' },
  { value: 'SITE', label: 'Site' },
  { value: 'INSTAGRAM', label: 'Instagram' },
  { value: 'GOOGLE', label: 'Google' },
  { value: 'WHATSAPP', label: 'WhatsApp' },
  { value: 'OUTRO', label: 'Outro' },
]

const etapas = [
  { id: 'NOVO', label: 'Novo' },
  { id: 'PRIMEIRO_CONTATO', label: '1º Contato' },
  { id: 'PROPOSTA_ENVIADA', label: 'Proposta Enviada' },
  { id: 'NEGOCIACAO', label: 'Negociação' },
  { id: 'CONVERTIDO', label: 'Convertido' },
  { id: 'PERDIDO', label: 'Perdido' },
]

export default function LeadForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const [form, setForm] = useState({
    nome: '', email: '', telefone: '',
    areaInteresse: '', origem: '', etapa: 'NOVO',
    temperatura: 'MORNO', observacoes: '', valorEstimado: '', dataContato: '',
  })

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nome.trim()) { setErro('Nome é obrigatório.'); return }
    setErro('')
    setLoading(true)
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error()
      router.push('/comercial')
      router.refresh()
    } catch {
      setErro('Erro ao salvar. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl">

      {/* Identificação */}
      <div className={sectionClass}>
        <h2 className="text-sm font-semibold text-foreground mb-4">Identificação</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className={labelClass}>Nome *</label>
            <input name="nome" value={form.nome} onChange={handleChange} className={inputClass} required />
          </div>
          <div>
            <label className={labelClass}>E-mail</label>
            <input type="email" name="email" value={form.email} onChange={handleChange} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Telefone</label>
            <input name="telefone" value={form.telefone} onChange={handleChange} className={inputClass} placeholder="(00) 00000-0000" />
          </div>
        </div>
      </div>

      {/* Interesse */}
      <div className={sectionClass}>
        <h2 className="text-sm font-semibold text-foreground mb-4">Interesse</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Área de Interesse</label>
            <select name="areaInteresse" value={form.areaInteresse} onChange={handleChange} className={inputClass}>
              <option value="">Selecione</option>
              {areaOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>Como nos conheceu</label>
            <select name="origem" value={form.origem} onChange={handleChange} className={inputClass}>
              <option value="">Selecione</option>
              {origemOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>Valor Estimado (R$)</label>
            <input type="number" name="valorEstimado" value={form.valorEstimado} onChange={handleChange} className={inputClass} step="0.01" min="0" placeholder="0,00" />
          </div>
          <div>
            <label className={labelClass}>Data de Contato</label>
            <input type="date" name="dataContato" value={form.dataContato} onChange={handleChange} className={inputClass} />
          </div>
        </div>
      </div>

      {/* Funil */}
      <div className={sectionClass}>
        <h2 className="text-sm font-semibold text-foreground mb-4">Funil de Vendas</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Etapa</label>
            <select name="etapa" value={form.etapa} onChange={handleChange} className={inputClass}>
              {etapas.map(e => <option key={e.id} value={e.id}>{e.label}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>Temperatura</label>
            <select name="temperatura" value={form.temperatura} onChange={handleChange} className={inputClass}>
              <option value="FRIO">Frio</option>
              <option value="MORNO">Morno</option>
              <option value="QUENTE">Quente</option>
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
          {loading ? 'Salvando...' : 'Salvar Lead'}
        </button>
      </div>
    </form>
  )
}
