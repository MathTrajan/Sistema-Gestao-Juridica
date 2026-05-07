'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil, X } from 'lucide-react'

interface ProcessoEditModalProps {
  processoId: string
  initial: {
    numero: string | null
    tribunal: string | null
    vara: string | null
    comarca: string | null
    tipoAcao: string | null
    areaJuridica: string | null
    tipo: string
    fase: string
    status: string
    dataDistribuicao: string | null
    valorCausa: number | null
    observacoes: string | null
    responsavelId: string | null
  }
  usuarios: { id: string; nome: string }[]
}

const inputClass = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent"
const labelClass = "block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1"

const areaOptions = [
  { value: '', label: 'Selecione' },
  { value: 'TRABALHISTA', label: 'Trabalhista' },
  { value: 'CIVIL', label: 'Cível' },
  { value: 'TRIBUTARIO', label: 'Tributário' },
  { value: 'PREVIDENCIARIO', label: 'Previdenciário' },
  { value: 'CRIMINAL', label: 'Criminal' },
  { value: 'FAMILIA', label: 'Família' },
  { value: 'EMPRESARIAL', label: 'Empresarial' },
  { value: 'CONSUMIDOR', label: 'Consumidor' },
  { value: 'AMBIENTAL', label: 'Ambiental' },
  { value: 'OUTRO', label: 'Outro' },
]

export default function ProcessoEditModal({ processoId, initial, usuarios }: ProcessoEditModalProps) {
  const router = useRouter()
  const [aberto, setAberto] = useState(false)
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')

  const [form, setForm] = useState({
    numero: initial.numero ?? '',
    tribunal: initial.tribunal ?? '',
    vara: initial.vara ?? '',
    comarca: initial.comarca ?? '',
    tipoAcao: initial.tipoAcao ?? '',
    areaJuridica: initial.areaJuridica ?? '',
    tipo: initial.tipo,
    fase: initial.fase,
    status: initial.status,
    dataDistribuicao: initial.dataDistribuicao ? initial.dataDistribuicao.slice(0, 10) : '',
    valorCausa: initial.valorCausa != null ? String(initial.valorCausa) : '',
    observacoes: initial.observacoes ?? '',
    responsavelId: initial.responsavelId ?? '',
  })

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setErro('')
    try {
      const payload = {
        ...form,
        valorCausa: form.valorCausa ? parseFloat(form.valorCausa) : null,
        dataDistribuicao: form.dataDistribuicao || null,
        responsavelId: form.responsavelId || null,
        areaJuridica: form.areaJuridica || null,
      }
      const res = await fetch(`/api/processos/${processoId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error()
      setAberto(false)
      router.refresh()
    } catch {
      setErro('Erro ao salvar. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setAberto(true)}
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
      >
        <Pencil size={14} />
        Editar
      </button>

      {aberto && (
        <>
          <div className="fixed inset-0 z-50 overflow-y-auto overscroll-contain" style={{ background: 'rgba(0,0,0,0.55)' }}>
          <div className="flex min-h-full items-start justify-center px-4 py-8">
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 rounded-t-2xl bg-white">
              <h2 className="text-base font-semibold text-gray-900">Editar Processo</h2>
              <button onClick={() => setAberto(false)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Número do Processo</label>
                  <input name="numero" value={form.numero} onChange={handleChange} className={inputClass} placeholder="0000000-00.0000.0.00.0000" />
                </div>
                <div>
                  <label className={labelClass}>Área Jurídica</label>
                  <select name="areaJuridica" value={form.areaJuridica} onChange={handleChange} className={inputClass}>
                    {areaOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Tribunal</label>
                  <input name="tribunal" value={form.tribunal} onChange={handleChange} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Vara</label>
                  <input name="vara" value={form.vara} onChange={handleChange} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Comarca</label>
                  <input name="comarca" value={form.comarca} onChange={handleChange} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Tipo de Ação</label>
                  <input name="tipoAcao" value={form.tipoAcao} onChange={handleChange} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Tipo</label>
                  <select name="tipo" value={form.tipo} onChange={handleChange} className={inputClass}>
                    <option value="JUDICIAL">Judicial</option>
                    <option value="ADMINISTRATIVO">Administrativo</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Responsável</label>
                  <select name="responsavelId" value={form.responsavelId} onChange={handleChange} className={inputClass}>
                    <option value="">Nenhum</option>
                    {usuarios.map(u => <option key={u.id} value={u.id}>{u.nome}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Fase</label>
                  <select name="fase" value={form.fase} onChange={handleChange} className={inputClass}>
                    <option value="CONHECIMENTO">Conhecimento</option>
                    <option value="RECURSAL">Recursal</option>
                    <option value="EXECUCAO">Execução</option>
                    <option value="ENCERRADO">Encerrado</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Status</label>
                  <select name="status" value={form.status} onChange={handleChange} className={inputClass}>
                    <option value="EM_ANDAMENTO">Em Andamento</option>
                    <option value="AGUARDANDO_PECA">Aguardando Peça</option>
                    <option value="AGUARDANDO_CLIENTE">Aguardando Cliente</option>
                    <option value="SUSPENSO">Suspenso</option>
                    <option value="ENCERRADO_PROCEDENTE">Encerrado Procedente</option>
                    <option value="ENCERRADO_IMPROCEDENTE">Encerrado Improcedente</option>
                    <option value="ARQUIVADO">Arquivado</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Data de Distribuição</label>
                  <input type="date" name="dataDistribuicao" value={form.dataDistribuicao} onChange={handleChange} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Valor da Causa (R$)</label>
                  <input type="number" name="valorCausa" value={form.valorCausa} onChange={handleChange} className={inputClass} step="0.01" min="0" />
                </div>
                <div className="col-span-2">
                  <label className={labelClass}>Observações</label>
                  <textarea name="observacoes" value={form.observacoes} onChange={handleChange} className={inputClass} rows={3} />
                </div>
              </div>
              {erro && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mt-4">{erro}</div>}
              <div className="flex gap-3 mt-6">
                <button type="button" onClick={() => setAberto(false)} className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                  Cancelar
                </button>
                <button type="submit" disabled={loading} className="flex-1 px-4 py-2 text-sm font-medium text-white bg-green-800 rounded-lg hover:bg-green-700 disabled:opacity-50">
                  {loading ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            </form>
          </div>
          </div>
          </div>
        </>
      )}
    </>
  )
}
