'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const areaOptions = [
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

interface Props {
  clientes: { id: string; nomeCompleto: string }[]
  usuarios: { id: string; nome: string }[]
  clienteIdInicial?: string
}

export default function ProcessoForm({ clientes, usuarios, clienteIdInicial }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')

  const [form, setForm] = useState({
    clienteId: clienteIdInicial || '',
    numero: '',
    tribunal: '',
    vara: '',
    comarca: '',
    tipoAcao: '',
    areaJuridica: '',
    tipo: 'JUDICIAL',
    fase: 'CONHECIMENTO',
    status: 'EM_ANDAMENTO',
    dataDistribuicao: '',
    valorCausa: '',
    responsavelId: '',
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
      const payload = {
        ...form,
        dataDistribuicao: form.dataDistribuicao ? new Date(form.dataDistribuicao).toISOString() : null,
        valorCausa: form.valorCausa ? parseFloat(form.valorCausa) : null,
        areaJuridica: form.areaJuridica || null,
        responsavelId: form.responsavelId || null,
      }

      const res = await fetch('/api/processos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) throw new Error('Erro ao salvar')

      router.push('/processos')
      router.refresh()
    } catch {
      setErro('Erro ao salvar. Verifique os dados e tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const inputClass = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent"
  const labelClass = "block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1"
  const sectionClass = "bg-white border border-gray-200 rounded-xl p-6 shadow-sm mb-5"

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl">

      {/* Vínculo */}
      <div className={sectionClass}>
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Vínculo</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className={labelClass}>Cliente *</label>
            <select name="clienteId" value={form.clienteId} onChange={handleChange} className={inputClass} required>
              <option value="">Selecione o cliente</option>
              {clientes.map(c => (
                <option key={c.id} value={c.id}>{c.nomeCompleto}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Responsável</label>
            <select name="responsavelId" value={form.responsavelId} onChange={handleChange} className={inputClass}>
              <option value="">Selecione</option>
              {usuarios.map(u => (
                <option key={u.id} value={u.id}>{u.nome}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Tipo</label>
            <select name="tipo" value={form.tipo} onChange={handleChange} className={inputClass}>
              <option value="JUDICIAL">Judicial</option>
              <option value="ADMINISTRATIVO">Administrativo</option>
            </select>
          </div>
        </div>
      </div>

      {/* Dados do Processo */}
      <div className={sectionClass}>
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Dados do Processo</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Número do Processo</label>
            <input name="numero" value={form.numero} onChange={handleChange} className={inputClass} placeholder="0000000-00.0000.0.00.0000" />
          </div>
          <div>
            <label className={labelClass}>Área Jurídica</label>
            <select name="areaJuridica" value={form.areaJuridica} onChange={handleChange} className={inputClass}>
              <option value="">Selecione</option>
              {areaOptions.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Tribunal</label>
            <input name="tribunal" value={form.tribunal} onChange={handleChange} className={inputClass} placeholder="Ex: TJRJ, TRT 1ª Região" />
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
            <input name="tipoAcao" value={form.tipoAcao} onChange={handleChange} className={inputClass} placeholder="Ex: Reclamação Trabalhista" />
          </div>
          <div>
            <label className={labelClass}>Data de Distribuição</label>
            <input type="date" name="dataDistribuicao" value={form.dataDistribuicao} onChange={handleChange} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Valor da Causa (R$)</label>
            <input type="number" name="valorCausa" value={form.valorCausa} onChange={handleChange} className={inputClass} placeholder="0,00" step="0.01" />
          </div>
        </div>
      </div>

      {/* Status */}
      <div className={sectionClass}>
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Status</h2>
        <div className="grid grid-cols-2 gap-4">
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
          <div className="col-span-2">
            <label className={labelClass}>Observações</label>
            <textarea name="observacoes" value={form.observacoes} onChange={handleChange} className={inputClass} rows={3} />
          </div>
        </div>
      </div>

      {erro && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">
          {erro}
        </div>
      )}

      <div className="flex gap-3">
        <button type="button" onClick={() => router.back()} className="px-5 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
          Cancelar
        </button>
        <button type="submit" disabled={loading} className="px-5 py-2 text-sm font-medium text-white bg-green-800 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50">
          {loading ? 'Salvando...' : 'Salvar Processo'}
        </button>
      </div>
    </form>
  )
}