'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { AlertTriangle, Pencil, Trash2, X } from 'lucide-react'

const tipoPrazoLabels: Record<string, string> = {
  RECURSO: 'Recurso', CONTESTACAO: 'Contestação', MANIFESTACAO: 'Manifestação',
  REPLICA: 'Réplica', APELACAO: 'Apelação', CONTRARRAZOES: 'Contrarrazões',
  EMBARGOS: 'Embargos', OUTRO: 'Outro',
}

const statusConfig: Record<string, { label: string; color: string }> = {
  ABERTO: { label: 'Aberto', color: 'bg-amber-100 text-amber-800' },
  CUMPRIDO: { label: 'Cumprido', color: 'bg-green-100 text-green-800' },
  PERDIDO: { label: 'Perdido', color: 'bg-red-100 text-red-800' },
  SUSPENSO: { label: 'Suspenso', color: 'bg-gray-100 text-gray-600' },
}

function getDiasRestantes(dataFinal: string) {
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  const final = new Date(dataFinal)
  final.setHours(0, 0, 0, 0)
  return Math.ceil((final.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24))
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
  processo: {
    id: string
    numero: string | null
    cliente: { nomeCompleto: string }
  }
}

const inputClass = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent"
const labelClass = "block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1"

export default function PrazosClient({ prazos: inicial }: { prazos: Prazo[] }) {
  const router = useRouter()
  const [prazos, setPrazos] = useState(inicial)
  const [editando, setEditando] = useState<Prazo | null>(null)
  const [confirmandoDeletar, setConfirmandoDeletar] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')

  const [form, setForm] = useState({
    titulo: '', tipo: 'OUTRO', dataInicio: '', dataFinal: '', status: 'ABERTO', observacoes: ''
  })

  const criticos = prazos.filter(p => {
    const dias = getDiasRestantes(p.dataFinal)
    return p.status === 'ABERTO' && dias <= 2
  })

  function abrirEditar(p: Prazo) {
    setForm({
      titulo: p.titulo,
      tipo: p.tipo,
      dataInicio: p.dataInicio.slice(0, 10),
      dataFinal: p.dataFinal.slice(0, 10),
      status: p.status,
      observacoes: p.observacoes ?? '',
    })
    setEditando(p)
    setErro('')
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSalvar(e: React.FormEvent) {
    e.preventDefault()
    if (!editando) return
    setLoading(true)
    setErro('')
    try {
      const res = await fetch(`/api/prazos/${editando.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error()
      setPrazos(prev => prev.map(p =>
        p.id === editando.id
          ? { ...p, ...form, dataInicio: new Date(form.dataInicio).toISOString(), dataFinal: new Date(form.dataFinal).toISOString() }
          : p
      ))
      setEditando(null)
      router.refresh()
    } catch {
      setErro('Erro ao salvar. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  async function handleDeletar(id: string) {
    if (!confirmandoDeletar[id]) {
      setConfirmandoDeletar(prev => ({ ...prev, [id]: true }))
      setTimeout(() => setConfirmandoDeletar(prev => { const n = { ...prev }; delete n[id]; return n }), 3000)
      return
    }
    setConfirmandoDeletar(prev => { const n = { ...prev }; delete n[id]; return n })
    const res = await fetch(`/api/prazos/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setPrazos(prev => prev.filter(p => p.id !== id))
      router.refresh()
    }
  }

  return (
    <>
      {criticos.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-center gap-3">
          <AlertTriangle size={18} className="text-red-600 flex-shrink-0" />
          <span className="text-sm text-red-700 font-medium">
            {criticos.length} prazo{criticos.length !== 1 ? 's' : ''} vence{criticos.length === 1 ? '' : 'm'} nas próximas 48 horas. Verifique imediatamente!
          </span>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        {prazos.length === 0 ? (
          <div className="p-16 text-center">
            <div className="text-gray-300 text-5xl mb-4">⏰</div>
            <div className="text-gray-500 font-medium">Nenhum prazo cadastrado</div>
            <div className="text-gray-400 text-sm mt-1">Clique em "Novo Prazo" para começar</div>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-5 py-3">Título / Processo</th>
                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-5 py-3">Tipo</th>
                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-5 py-3">Cliente</th>
                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-5 py-3">Vencimento</th>
                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-5 py-3">Restam</th>
                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wide">Ações</th>
              </tr>
            </thead>
            <tbody>
              {prazos.map((prazo) => {
                const status = statusConfig[prazo.status]
                const dias = getDiasRestantes(prazo.dataFinal)
                const critico = prazo.status === 'ABERTO' && dias <= 2
                const atencao = prazo.status === 'ABERTO' && dias > 2 && dias <= 5
                const confirmando = !!confirmandoDeletar[prazo.id]
                return (
                  <tr
                    key={prazo.id}
                    className={`border-b border-gray-50 last:border-0 transition-colors ${critico ? 'bg-red-50' : atencao ? 'bg-amber-50' : 'hover:bg-gray-50'}`}
                  >
                    <td className="px-5 py-3">
                      <div className="font-medium text-sm text-gray-900">{prazo.titulo}</div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        <Link href={`/processos/${prazo.processo.id}`} className="hover:underline text-green-700">
                          {prazo.processo.numero || 'Sem número'}
                        </Link>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-xs font-medium bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                        {tipoPrazoLabels[prazo.tipo]}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-600">{prazo.processo.cliente.nomeCompleto}</td>
                    <td className={`px-5 py-3 text-sm font-medium ${critico ? 'text-red-700' : atencao ? 'text-amber-700' : 'text-gray-700'}`}>
                      {new Date(prazo.dataFinal).toLocaleDateString('pt-BR')}
                    </td>
                    <td className={`px-5 py-3 text-sm font-bold ${critico ? 'text-red-700' : atencao ? 'text-amber-700' : 'text-gray-600'}`}>
                      {prazo.status === 'ABERTO'
                        ? dias < 0 ? 'Vencido' : dias === 0 ? 'Hoje!' : `${dias} dia${dias !== 1 ? 's' : ''}`
                        : '—'}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${status.color}`}>
                        {status.label}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => abrirEditar(prazo)}
                          title="Editar"
                          className="p-1.5 rounded-lg text-gray-400 hover:text-green-700 hover:bg-green-50 transition-colors"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => handleDeletar(prazo.id)}
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
            </tbody>
          </table>
        )}
      </div>

      {/* Modal de edição */}
      {editando && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-base font-semibold text-gray-900">Editar Prazo</h2>
              <button onClick={() => setEditando(null)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSalvar} className="p-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className={labelClass}>Título *</label>
                  <input name="titulo" value={form.titulo} onChange={handleChange} className={inputClass} required />
                </div>
                <div>
                  <label className={labelClass}>Tipo</label>
                  <select name="tipo" value={form.tipo} onChange={handleChange} className={inputClass}>
                    <option value="RECURSO">Recurso</option>
                    <option value="CONTESTACAO">Contestação</option>
                    <option value="MANIFESTACAO">Manifestação</option>
                    <option value="REPLICA">Réplica</option>
                    <option value="APELACAO">Apelação</option>
                    <option value="CONTRARRAZOES">Contrarrazões</option>
                    <option value="EMBARGOS">Embargos</option>
                    <option value="OUTRO">Outro</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Status</label>
                  <select name="status" value={form.status} onChange={handleChange} className={inputClass}>
                    <option value="ABERTO">Aberto</option>
                    <option value="CUMPRIDO">Cumprido</option>
                    <option value="PERDIDO">Perdido</option>
                    <option value="SUSPENSO">Suspenso</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Data de Início *</label>
                  <input type="date" name="dataInicio" value={form.dataInicio} onChange={handleChange} className={inputClass} required />
                </div>
                <div>
                  <label className={labelClass}>Data Final *</label>
                  <input type="date" name="dataFinal" value={form.dataFinal} onChange={handleChange} className={inputClass} required />
                </div>
                <div className="col-span-2">
                  <label className={labelClass}>Observações</label>
                  <textarea name="observacoes" value={form.observacoes} onChange={handleChange} className={inputClass} rows={2} />
                </div>
              </div>
              {erro && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mt-4">{erro}</div>}
              <div className="flex gap-3 mt-6">
                <button type="button" onClick={() => setEditando(null)} className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                  Cancelar
                </button>
                <button type="submit" disabled={loading} className="flex-1 px-4 py-2 text-sm font-medium text-white bg-green-800 rounded-lg hover:bg-green-700 disabled:opacity-50">
                  {loading ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
