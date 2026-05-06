'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, X, Flame, Minus, Snowflake } from 'lucide-react'

interface Lead {
  id: string
  nome: string
  email: string | null
  telefone: string | null
  areaInteresse: string | null
  origem: string | null
  etapa: string
  temperatura: string
  observacoes: string | null
  valorEstimado: number | null
  dataContato: string | null
  clienteId: string | null
  cliente: { id: string; nomeCompleto: string } | null
  createdAt: string
}

const etapas = [
  { id: 'NOVO', label: 'Novo' },
  { id: 'PRIMEIRO_CONTATO', label: '1º Contato' },
  { id: 'PROPOSTA_ENVIADA', label: 'Proposta' },
  { id: 'NEGOCIACAO', label: 'Negociação' },
  { id: 'CONVERTIDO', label: 'Convertido' },
  { id: 'PERDIDO', label: 'Perdido' },
]

const temperaturaConfig: Record<string, { label: string; color: string; icon: any }> = {
  QUENTE: { label: 'Quente', color: 'bg-red-400/15 text-red-400', icon: Flame },
  MORNO: { label: 'Morno', color: 'bg-amber-400/15 text-amber-400', icon: Minus },
  FRIO: { label: 'Frio', color: 'bg-blue-400/15 text-blue-400', icon: Snowflake },
}

const etapaColors: Record<string, string> = {
  NOVO: 'bg-white/8 text-muted-foreground',
  PRIMEIRO_CONTATO: 'bg-blue-400/15 text-blue-400',
  PROPOSTA_ENVIADA: 'bg-purple-400/15 text-purple-400',
  NEGOCIACAO: 'bg-amber-400/15 text-amber-400',
  CONVERTIDO: 'bg-emerald-400/15 text-emerald-400',
  PERDIDO: 'bg-red-400/15 text-red-400',
}

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

const inputClass = "w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-foreground outline-none transition focus:border-[rgba(184,150,42,0.4)] focus:bg-white/[0.08]"
const labelClass = "block text-xs font-semibold uppercase tracking-wide mb-1 text-muted-foreground"

export default function ComercialClient({ leads: inicial }: { leads: Lead[] }) {
  const router = useRouter()
  const [leads, setLeads] = useState(inicial)
  const [modalAberto, setModalAberto] = useState(false)
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const [abaAtiva, setAbaAtiva] = useState<'funil' | 'lista'>('funil')

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
    setErro('')
    setLoading(true)

    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      if (!res.ok) throw new Error()

      const novo = await res.json()
      setLeads(prev => [{ ...novo, cliente: null }, ...prev])
      setModalAberto(false)
      router.refresh()
    } catch {
      setErro('Erro ao salvar. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  async function atualizarEtapa(id: string, etapa: string) {
    const lead = leads.find(l => l.id === id)
    if (!lead) return

    setLeads(prev => prev.map(l => l.id === id ? { ...l, etapa } : l))

    await fetch(`/api/leads/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...lead, etapa }),
    })

    router.refresh()
  }

  const totalLeads = leads.length
  const convertidos = leads.filter(l => l.etapa === 'CONVERTIDO').length
  const taxaConversao = totalLeads > 0 ? Math.round((convertidos / totalLeads) * 100) : 0
  const valorPipeline = leads
    .filter(l => !['CONVERTIDO', 'PERDIDO'].includes(l.etapa))
    .reduce((acc, l) => acc + (l.valorEstimado || 0), 0)

  return (
    <>
      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-8 xl:grid-cols-4">
        <div className="rounded-xl border border-white/10 bg-white/5 p-5">
          <div className="text-2xl font-bold text-foreground">{totalLeads}</div>
          <div className="text-xs text-muted-foreground mt-1 uppercase tracking-wide font-medium">Leads totais</div>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-5">
          <div className="text-2xl font-bold text-amber-400">
            {leads.filter(l => l.etapa === 'NEGOCIACAO' || l.etapa === 'PROPOSTA_ENVIADA').length}
          </div>
          <div className="text-xs text-muted-foreground mt-1 uppercase tracking-wide font-medium">Em negociação</div>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-5">
          <div className="text-2xl font-bold text-emerald-400">{convertidos}</div>
          <div className="text-xs text-muted-foreground mt-1 uppercase tracking-wide font-medium">Convertidos · {taxaConversao}%</div>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-5">
          <div className="text-2xl font-bold" style={{ color: '#d4af37' }}>
            {valorPipeline.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </div>
          <div className="text-xs text-muted-foreground mt-1 uppercase tracking-wide font-medium">Pipeline estimado</div>
        </div>
      </div>

      {/* Abas + botão */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex gap-1">
          {(['funil', 'lista'] as const).map(aba => (
            <button
              key={aba}
              onClick={() => setAbaAtiva(aba)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                abaAtiva === aba
                  ? 'text-black font-semibold'
                  : 'bg-white/5 text-muted-foreground hover:bg-white/10 border border-white/10'
              }`}
              style={abaAtiva === aba ? { background: 'linear-gradient(135deg, #d4af37, #B8962A)' } : {}}
            >
              {aba === 'funil' ? 'Funil Kanban' : 'Lista'}
            </button>
          ))}
        </div>
        <button
          onClick={() => { setForm({ nome: '', email: '', telefone: '', areaInteresse: '', origem: '', etapa: 'NOVO', temperatura: 'MORNO', observacoes: '', valorEstimado: '', dataContato: '' }); setErro(''); setModalAberto(true) }}
          className="flex items-center gap-2 text-black text-sm font-semibold px-4 py-2 rounded-lg transition-all hover:opacity-90"
          style={{ background: 'linear-gradient(135deg, #d4af37, #B8962A)' }}
        >
          <Plus size={14} />
          Novo Lead
        </button>
      </div>

      {/* Funil Kanban */}
      {abaAtiva === 'funil' && (
        <div className="flex gap-4 overflow-x-auto pb-4 min-h-96">
          {etapas.map(etapa => {
            const leadsEtapa = leads.filter(l => l.etapa === etapa.id)
            return (
              <div key={etapa.id} className="flex-shrink-0 w-64 rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-foreground">{etapa.label}</span>
                  <span className="text-xs font-semibold border border-white/10 bg-white/5 text-muted-foreground px-2 py-0.5 rounded-full">
                    {leadsEtapa.length}
                  </span>
                </div>
                <div className="flex flex-col gap-2">
                  {leadsEtapa.length === 0 && (
                    <div className="text-center text-muted-foreground text-xs py-6 border-2 border-dashed border-white/10 rounded-lg">
                      Nenhum lead
                    </div>
                  )}
                  {leadsEtapa.map(lead => {
                    const temp = temperaturaConfig[lead.temperatura]
                    const TempIcon = temp.icon
                    return (
                      <div key={lead.id} className="rounded-xl border border-white/10 bg-white/5 p-3">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <span className="text-sm font-medium text-foreground leading-snug">{lead.nome}</span>
                          <span className={`inline-flex items-center gap-1 text-xs font-medium px-1.5 py-0.5 rounded-full flex-shrink-0 ${temp.color}`}>
                            <TempIcon size={9} />
                            {temp.label}
                          </span>
                        </div>
                        {lead.areaInteresse && (
                          <div className="text-xs text-muted-foreground mb-2">{lead.areaInteresse}</div>
                        )}
                        {lead.valorEstimado && (
                          <div className="text-xs font-medium mb-2" style={{ color: '#d4af37' }}>
                            {lead.valorEstimado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </div>
                        )}
                        <select
                          value={lead.etapa}
                          onChange={e => atualizarEtapa(lead.id, e.target.value)}
                          className="w-full text-xs rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-muted-foreground outline-none focus:border-[rgba(184,150,42,0.4)] mt-1"
                        >
                          {etapas.map(e => (
                            <option key={e.id} value={e.id}>{e.label}</option>
                          ))}
                        </select>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Lista */}
      {abaAtiva === 'lista' && (
        <div className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
          {leads.length === 0 ? (
            <div className="p-16 text-center">
              <div className="text-muted-foreground text-5xl mb-4">🎯</div>
              <div className="text-muted-foreground font-medium">Nenhum lead cadastrado</div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px]">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.24em] px-5 py-3">Nome</th>
                    <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.24em] px-5 py-3 hidden sm:table-cell">Contato</th>
                    <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.24em] px-5 py-3 hidden md:table-cell">Área</th>
                    <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.24em] px-5 py-3">Temperatura</th>
                    <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.24em] px-5 py-3">Etapa</th>
                    <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.24em] px-5 py-3 hidden lg:table-cell">Valor Est.</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map(lead => {
                    const temp = temperaturaConfig[lead.temperatura]
                    const TempIcon = temp.icon
                    const etapaLabel = etapas.find(e => e.id === lead.etapa)?.label || lead.etapa
                    return (
                      <tr key={lead.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.03] transition-colors">
                        <td className="px-5 py-3">
                          <div className="text-sm font-medium text-foreground">{lead.nome}</div>
                          <div className="text-xs text-muted-foreground">{lead.origem || '—'}</div>
                        </td>
                        <td className="px-5 py-3 hidden sm:table-cell">
                          <div className="text-sm text-foreground">{lead.telefone || '—'}</div>
                          <div className="text-xs text-muted-foreground">{lead.email || ''}</div>
                        </td>
                        <td className="px-5 py-3 text-sm text-muted-foreground hidden md:table-cell">{lead.areaInteresse || '—'}</td>
                        <td className="px-5 py-3">
                          <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${temp.color}`}>
                            <TempIcon size={10} />
                            {temp.label}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <span className={`text-xs font-medium px-2 py-1 rounded-full ${etapaColors[lead.etapa]}`}>
                            {etapaLabel}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-sm font-medium hidden lg:table-cell" style={{ color: '#d4af37' }}>
                          {lead.valorEstimado
                            ? lead.valorEstimado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                            : '—'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {modalAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}>
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-white/10" style={{ background: '#161616' }}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 sticky top-0" style={{ background: '#161616' }}>
              <h2 className="text-base font-semibold text-foreground">Novo Lead</h2>
              <button onClick={() => setModalAberto(false)} className="text-muted-foreground hover:text-foreground transition-colors"><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6">
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
                  <input name="telefone" value={form.telefone} onChange={handleChange} className={inputClass} />
                </div>
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
                <div>
                  <label className={labelClass}>Valor Estimado (R$)</label>
                  <input type="number" name="valorEstimado" value={form.valorEstimado} onChange={handleChange} className={inputClass} step="0.01" min="0" />
                </div>
                <div>
                  <label className={labelClass}>Data de Contato</label>
                  <input type="date" name="dataContato" value={form.dataContato} onChange={handleChange} className={inputClass} />
                </div>
                <div className="col-span-2">
                  <label className={labelClass}>Observações</label>
                  <textarea name="observacoes" value={form.observacoes} onChange={handleChange} className={inputClass} rows={2} />
                </div>
              </div>

              {erro && (
                <div className="rounded-lg border border-red-400/30 bg-red-400/10 text-red-400 text-sm px-4 py-3 mt-4">{erro}</div>
              )}

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setModalAberto(false)}
                  className="flex-1 px-4 py-2 text-sm font-medium text-muted-foreground border border-white/10 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 text-sm font-semibold text-black rounded-lg transition-all disabled:opacity-50 hover:opacity-90"
                  style={{ background: 'linear-gradient(135deg, #d4af37, #B8962A)' }}
                >
                  {loading ? 'Salvando...' : 'Salvar Lead'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
