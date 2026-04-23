'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  processos: { id: string; numero: string | null; cliente: { nomeCompleto: string } }[]
  usuarios: { id: string; nome: string }[]
  processoIdInicial?: string
}

export default function TarefaForm({ processos, usuarios, processoIdInicial }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')

  const [form, setForm] = useState({
    titulo: '',
    descricao: '',
    status: 'A_FAZER',
    prioridade: 'NORMAL',
    dataVencimento: '',
    responsavelId: '',
    processoId: processoIdInicial || '',
  })

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    setLoading(true)

    try {
      const res = await fetch('/api/tarefas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      if (!res.ok) throw new Error()

      router.push('/tarefas')
      router.refresh()
    } catch {
      setErro('Erro ao salvar. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const inputClass = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent"
  const labelClass = "block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1"
  const sectionClass = "bg-white border border-gray-200 rounded-xl p-6 shadow-sm mb-5"

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl">
      <div className={sectionClass}>
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Dados da Tarefa</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className={labelClass}>Título *</label>
            <input
              name="titulo"
              value={form.titulo}
              onChange={handleChange}
              className={inputClass}
              placeholder="Ex: Elaborar petição inicial"
              required
            />
          </div>
          <div className="col-span-2">
            <label className={labelClass}>Descrição</label>
            <textarea
              name="descricao"
              value={form.descricao}
              onChange={handleChange}
              className={inputClass}
              rows={3}
              placeholder="Detalhes da tarefa..."
            />
          </div>
          <div>
            <label className={labelClass}>Prioridade</label>
            <select name="prioridade" value={form.prioridade} onChange={handleChange} className={inputClass}>
              <option value="BAIXA">Baixa</option>
              <option value="NORMAL">Normal</option>
              <option value="ALTA">Alta</option>
              <option value="URGENTE">Urgente</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Status Inicial</label>
            <select name="status" value={form.status} onChange={handleChange} className={inputClass}>
              <option value="A_FAZER">A Fazer</option>
              <option value="EM_ANDAMENTO">Em Andamento</option>
              <option value="AGUARDANDO_REVISAO">Aguardando Revisão</option>
              <option value="CONCLUIDO">Concluído</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Data de Vencimento</label>
            <input
              type="date"
              name="dataVencimento"
              value={form.dataVencimento}
              onChange={handleChange}
              className={inputClass}
            />
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
          <div className="col-span-2">
            <label className={labelClass}>Processo (opcional)</label>
            <select name="processoId" value={form.processoId} onChange={handleChange} className={inputClass}>
              <option value="">Nenhum</option>
              {processos.map(p => (
                <option key={p.id} value={p.id}>
                  {p.numero || 'Sem número'} — {p.cliente.nomeCompleto}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {erro && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">
          {erro}
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-5 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-5 py-2 text-sm font-medium text-white bg-green-800 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
        >
          {loading ? 'Salvando...' : 'Salvar Tarefa'}
        </button>
      </div>
    </form>
  )
}