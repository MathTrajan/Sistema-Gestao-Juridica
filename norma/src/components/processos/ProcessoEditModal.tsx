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

const inputClass = "w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-foreground outline-none transition focus:border-gold/35 focus:bg-white/8"
const labelClass = "block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1"

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
        className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-white/10"
      >
        <Pencil size={14} />
        Editar
      </button>

      {aberto && (
        <div className="modal-overlay">
          <div className="modal-content lg">
            <div className="modal-header">
              <h2 className="text-base font-semibold text-foreground">Editar Processo</h2>
              <button onClick={() => setAberto(false)} className="text-muted-foreground hover:text-foreground">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="modal-body">
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
              {erro && <div className="rounded-lg border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-400 mb-4">{erro}</div>}
              <div className="modal-footer">
                <button type="button" onClick={() => setAberto(false)} className="flex-1 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-white/10">
                  Cancelar
                </button>
                <button type="submit" disabled={loading} className="flex-1 rounded-lg px-4 py-2 text-sm font-semibold text-black transition-all hover:opacity-90 disabled:opacity-50" style={{ background: 'linear-gradient(135deg, #d4af37, #B8962A)' }}>
                  {loading ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
