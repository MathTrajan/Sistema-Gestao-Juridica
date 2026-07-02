'use client'

import { type ElementType, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Plus, Flame, Minus, Snowflake, Pencil, Trash2, X, Search, UserPlus, ExternalLink } from 'lucide-react'
import AtendimentosSection from '@/components/shared/AtendimentosSection'

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

const temperaturas = [
  { id: 'QUENTE', label: 'Quente' },
  { id: 'MORNO', label: 'Morno' },
  { id: 'FRIO', label: 'Frio' },
]

const temperaturaConfig: Record<string, { label: string; color: string; icon: ElementType }> = {
  QUENTE: { label: 'Quente', color: 'bg-red-400/15 text-red-400',   icon: Flame },
  MORNO:  { label: 'Morno',  color: 'bg-amber-400/15 text-amber-400', icon: Minus },
  FRIO:   { label: 'Frio',   color: 'bg-blue-400/15 text-blue-400',  icon: Snowflake },
}

const etapaColors: Record<string, string> = {
  NOVO:            'bg-white/8 text-muted-foreground',
  PRIMEIRO_CONTATO:'bg-blue-400/15 text-blue-400',
  PROPOSTA_ENVIADA:'bg-purple-400/15 text-purple-400',
  NEGOCIACAO:      'bg-amber-400/15 text-amber-400',
  CONVERTIDO:      'bg-emerald-400/15 text-emerald-400',
  PERDIDO:         'bg-red-400/15 text-red-400',
}

const inputClass = 'w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-foreground outline-none transition focus:border-[rgba(184,150,42,0.4)] focus:bg-white/[0.08]'
const labelClass = 'block text-xs font-semibold uppercase tracking-wide mb-1 text-muted-foreground'

export default function ComercialClient({ leads: inicial }: { leads: Lead[] }) {
  const router = useRouter()
  const [leads, setLeads] = useState(inicial)
  const [abaAtiva, setAbaAtiva] = useState<'funil' | 'lista'>('funil')
  const [busca, setBusca] = useState('')

  // Edit modal
  const [editando, setEditando] = useState<Lead | null>(null)
  const [editLoading, setEditLoading] = useState(false)
  const [editErro, setEditErro] = useState('')
  const [editForm, setEditForm] = useState({
    nome: '', email: '', telefone: '',
    areaInteresse: '', temperatura: 'MORNO',
    etapa: 'NOVO', valorEstimado: '', observacoes: '',
  })

  // Delete
  const [confirmandoDeletar, setConfirmandoDeletar] = useState<Record<string, boolean>>({})

  async function atualizarEtapa(id: string, etapa: string) {
    setLeads(prev => prev.map(l => l.id === id ? { ...l, etapa } : l))
    await fetch(`/api/leads/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ etapa }),
    })
    router.refresh()
  }

  function abrirEditar(lead: Lead) {
    setEditForm({
      nome: lead.nome,
      email: lead.email ?? '',
      telefone: lead.telefone ?? '',
      areaInteresse: lead.areaInteresse ?? '',
      temperatura: lead.temperatura,
      etapa: lead.etapa,
      valorEstimado: lead.valorEstimado ? String(lead.valorEstimado) : '',
      observacoes: lead.observacoes ?? '',
    })
    setEditando(lead)
    setEditErro('')
  }

  function handleEditChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    setEditForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleEditSalvar(e: React.FormEvent) {
    e.preventDefault()
    if (!editando) return
    setEditLoading(true)
    setEditErro('')

    try {
      const res = await fetch(`/api/leads/${editando.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: editForm.nome,
          email: editForm.email || null,
          telefone: editForm.telefone || null,
          areaInteresse: editForm.areaInteresse || null,
          temperatura: editForm.temperatura,
          etapa: editForm.etapa,
          valorEstimado: editForm.valorEstimado ? Number(editForm.valorEstimado) : null,
          observacoes: editForm.observacoes || null,
        }),
      })

      if (!res.ok) throw new Error()

      setLeads(prev => prev.map(l =>
        l.id === editando.id
          ? {
              ...l,
              nome: editForm.nome,
              email: editForm.email || null,
              telefone: editForm.telefone || null,
              areaInteresse: editForm.areaInteresse || null,
              temperatura: editForm.temperatura,
              etapa: editForm.etapa,
              valorEstimado: editForm.valorEstimado ? Number(editForm.valorEstimado) : null,
              observacoes: editForm.observacoes || null,
            }
          : l
      ))
      setEditando(null)
      router.refresh()
    } catch {
      setEditErro('Erro ao salvar. Tente novamente.')
    } finally {
      setEditLoading(false)
    }
  }

  async function handleDeletar(id: string) {
    if (!confirmandoDeletar[id]) {
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

    setConfirmandoDeletar(prev => {
      const next = { ...prev }
      delete next[id]
      return next
    })

    const res = await fetch(`/api/leads/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setLeads(prev => prev.filter(l => l.id !== id))
      router.refresh()
    }
  }

  const normalizedBusca = busca.trim().toLowerCase()
  const leadsFiltrados = normalizedBusca
    ? leads.filter(l =>
        l.nome.toLowerCase().includes(normalizedBusca) ||
        l.email?.toLowerCase().includes(normalizedBusca) ||
        l.telefone?.includes(normalizedBusca) ||
        l.areaInteresse?.toLowerCase().includes(normalizedBusca)
      )
    : leads

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

      {/* Barra de busca */}
      <div className="relative mb-5">
        <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          value={busca}
          onChange={e => setBusca(e.target.value)}
          placeholder="Buscar por nome, e-mail, telefone, área..."
          className="w-full rounded-2xl border border-white/10 bg-white/5 py-3 pl-11 pr-4 text-sm text-foreground outline-none transition focus:border-gold/35 focus:bg-white/8"
        />
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
          onClick={() => router.push('/comercial/novo')}
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
            const leadsEtapa = leadsFiltrados.filter(l => l.etapa === etapa.id)
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
                    const confirmando = !!confirmandoDeletar[lead.id]
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
                        <div className="flex flex-col gap-1 mt-2">
                          {lead.etapa === 'CONVERTIDO' && !lead.clienteId && (
                            <Link
                              href={`/clientes/novo?leadId=${lead.id}&nome=${encodeURIComponent(lead.nome)}&email=${encodeURIComponent(lead.email ?? '')}&telefone=${encodeURIComponent(lead.telefone ?? '')}`}
                              className="flex items-center justify-center gap-1 rounded-lg border border-emerald-400/30 bg-emerald-400/10 py-1 text-xs font-medium text-emerald-400 transition-colors hover:bg-emerald-400/20"
                            >
                              <UserPlus size={11} /> Criar Cliente
                            </Link>
                          )}
                          {lead.etapa === 'CONVERTIDO' && lead.clienteId && (
                            <Link
                              href={`/clientes/${lead.clienteId}`}
                              className="flex items-center justify-center gap-1 rounded-lg border border-gold/20 bg-gold/8 py-1 text-xs font-medium text-gold transition-colors hover:bg-gold/15"
                            >
                              <ExternalLink size={11} /> Ver Cliente
                            </Link>
                          )}
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => abrirEditar(lead)}
                              className="flex-1 flex items-center justify-center gap-1 rounded-lg border border-white/10 bg-white/5 py-1 text-xs text-muted-foreground transition-colors hover:border-gold/30 hover:text-gold"
                            >
                              <Pencil size={11} /> Editar
                            </button>
                            <button
                              onClick={() => handleDeletar(lead.id)}
                              className={`rounded-lg px-2 py-1 text-xs font-medium transition-colors ${
                                confirmando
                                  ? 'bg-danger/15 text-danger border border-danger/30'
                                  : 'border border-white/10 bg-white/5 text-muted-foreground hover:border-danger/30 hover:text-danger'
                              }`}
                            >
                              {confirmando ? '?' : <Trash2 size={11} />}
                            </button>
                          </div>
                        </div>
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
          {leadsFiltrados.length === 0 ? (
            <div className="p-16 text-center">
              <div className="text-muted-foreground text-5xl mb-4">🎯</div>
              <div className="text-muted-foreground font-medium">
                {leads.length === 0 ? 'Nenhum lead cadastrado' : 'Nenhum resultado encontrado'}
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px]">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.24em] px-5 py-3">Nome</th>
                    <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.24em] px-5 py-3 hidden sm:table-cell">Contato</th>
                    <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.24em] px-5 py-3 hidden md:table-cell">Área</th>
                    <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.24em] px-5 py-3">Temperatura</th>
                    <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.24em] px-5 py-3">Etapa</th>
                    <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.24em] px-5 py-3 hidden lg:table-cell">Valor Est.</th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {leadsFiltrados.map(lead => {
                    const temp = temperaturaConfig[lead.temperatura]
                    const TempIcon = temp.icon
                    const etapaLabel = etapas.find(e => e.id === lead.etapa)?.label || lead.etapa
                    const confirmando = !!confirmandoDeletar[lead.id]
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
                        <td className="px-5 py-3">
                          <div className="flex items-center justify-end gap-2">
                            {lead.etapa === 'CONVERTIDO' && !lead.clienteId && (
                              <Link
                                href={`/clientes/novo?leadId=${lead.id}&nome=${encodeURIComponent(lead.nome)}&email=${encodeURIComponent(lead.email ?? '')}&telefone=${encodeURIComponent(lead.telefone ?? '')}`}
                                className="flex items-center gap-1 rounded-lg border border-emerald-400/20 bg-emerald-400/8 px-2 py-1.5 text-xs font-medium text-emerald-400 hover:bg-emerald-400/15 transition-colors"
                                title="Criar cliente"
                              >
                                <UserPlus size={12} /> Criar
                              </Link>
                            )}
                            {lead.etapa === 'CONVERTIDO' && lead.clienteId && (
                              <Link
                                href={`/clientes/${lead.clienteId}`}
                                className="flex items-center gap-1 rounded-lg border border-gold/20 bg-gold/8 px-2 py-1.5 text-xs font-medium text-gold hover:bg-gold/15 transition-colors"
                                title="Ver cliente"
                              >
                                <ExternalLink size={12} /> Ver
                              </Link>
                            )}
                            <button
                              onClick={() => abrirEditar(lead)}
                              className="p-1.5 rounded-lg text-muted-foreground hover:text-gold hover:bg-gold/8 transition-colors"
                              title="Editar"
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              onClick={() => handleDeletar(lead.id)}
                              className={`rounded-lg px-2 py-1.5 text-xs font-medium transition-colors ${
                                confirmando
                                  ? 'bg-danger/15 text-danger'
                                  : 'text-muted-foreground hover:text-danger hover:bg-danger/10'
                              }`}
                              title={confirmando ? 'Confirmar exclusão' : 'Excluir'}
                            >
                              {confirmando ? 'Confirmar?' : <Trash2 size={14} />}
                            </button>
                          </div>
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

      {/* Modal de edição */}
      {editando ? (
        <div className="modal-overlay">
          <div className="modal-content lg" style={{ maxWidth: '32rem' }}>
            <div className="modal-header">
              <h2 className="text-base font-semibold text-white">Editar lead</h2>
              <button onClick={() => setEditando(null)} className="text-muted-foreground hover:text-white">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleEditSalvar} className="modal-body">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className={labelClass}>Nome *</label>
                  <input name="nome" value={editForm.nome} onChange={handleEditChange} className={inputClass} required />
                </div>
                <div>
                  <label className={labelClass}>E-mail</label>
                  <input type="email" name="email" value={editForm.email} onChange={handleEditChange} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Telefone</label>
                  <input name="telefone" value={editForm.telefone} onChange={handleEditChange} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Temperatura</label>
                  <select name="temperatura" value={editForm.temperatura} onChange={handleEditChange} className={inputClass}>
                    {temperaturas.map(t => (
                      <option key={t.id} value={t.id}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Etapa</label>
                  <select name="etapa" value={editForm.etapa} onChange={handleEditChange} className={inputClass}>
                    {etapas.map(e => (
                      <option key={e.id} value={e.id}>{e.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Área de interesse</label>
                  <input name="areaInteresse" value={editForm.areaInteresse} onChange={handleEditChange} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Valor estimado (R$)</label>
                  <input type="number" name="valorEstimado" value={editForm.valorEstimado} onChange={handleEditChange} className={inputClass} min="0" step="0.01" />
                </div>
                <div className="col-span-2">
                  <label className={labelClass}>Observações</label>
                  <textarea name="observacoes" value={editForm.observacoes} onChange={handleEditChange} className={inputClass} rows={2} />
                </div>
              </div>

              {editErro && (
                <div className="rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger mt-2">
                  {editErro}
                </div>
              )}

              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => setEditando(null)}
                  className="flex-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-foreground hover:bg-white/10"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="flex-1 rounded-2xl px-4 py-2.5 text-sm font-semibold text-black disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg, #d4af37, #B8962A)' }}
                >
                  {editLoading ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </form>
            <div className="px-5 pb-5">
              <AtendimentosSection leadId={editando.id} atendimentosIniciais={[]} />
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
