'use client'

import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { tarefaSchema, type TarefaFormData } from '@/lib/schemas'

interface Props {
  processos: { id: string; numero: string | null; cliente: { nomeCompleto: string } }[]
  usuarios: { id: string; nome: string }[]
  processoIdInicial?: string
}

export default function TarefaForm({ processos, usuarios, processoIdInicial }: Props) {
  const router = useRouter()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<TarefaFormData>({
    resolver: zodResolver(tarefaSchema),
    defaultValues: {
      status: 'A_FAZER',
      prioridade: 'NORMAL',
      processoId: processoIdInicial ?? '',
    },
  })

  async function onSubmit(data: TarefaFormData) {
    try {
      const payload = {
        ...data,
        processoId: data.processoId || null,
        responsavelId: data.responsavelId || null,
        dataVencimento: data.dataVencimento || null,
      }

      const res = await fetch('/api/tarefas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        setError('root', { message: body.error ?? 'Erro ao salvar tarefa' })
        return
      }

      router.push('/tarefas')
      router.refresh()
    } catch {
      setError('root', { message: 'Erro ao salvar. Tente novamente.' })
    }
  }

  const inputClass = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent"
  const inputErrorClass = "w-full border border-red-400 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent"
  const labelClass = "block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1"
  const sectionClass = "bg-white border border-gray-200 rounded-xl p-6 shadow-sm mb-5"
  const errMsgClass = "text-xs text-red-600 mt-1"

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl">
      <div className={sectionClass}>
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Dados da Tarefa</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className={labelClass}>Título *</label>
            <input
              {...register('titulo')}
              placeholder="Ex: Elaborar petição inicial"
              className={errors.titulo ? inputErrorClass : inputClass}
            />
            {errors.titulo && <p className={errMsgClass}>{errors.titulo.message}</p>}
          </div>
          <div className="col-span-2">
            <label className={labelClass}>Descrição</label>
            <textarea
              {...register('descricao')}
              className={inputClass}
              rows={3}
              placeholder="Detalhes da tarefa..."
            />
          </div>
          <div>
            <label className={labelClass}>Prioridade</label>
            <select {...register('prioridade')} className={inputClass}>
              <option value="BAIXA">Baixa</option>
              <option value="NORMAL">Normal</option>
              <option value="ALTA">Alta</option>
              <option value="URGENTE">Urgente</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Status Inicial</label>
            <select {...register('status')} className={inputClass}>
              <option value="A_FAZER">A Fazer</option>
              <option value="EM_ANDAMENTO">Em Andamento</option>
              <option value="AGUARDANDO_REVISAO">Aguardando Revisão</option>
              <option value="CONCLUIDO">Concluído</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Data de Vencimento</label>
            <input type="date" {...register('dataVencimento')} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Responsável</label>
            <select {...register('responsavelId')} className={inputClass}>
              <option value="">Selecione</option>
              {usuarios.map((u) => (
                <option key={u.id} value={u.id}>{u.nome}</option>
              ))}
            </select>
          </div>
          <div className="col-span-2">
            <label className={labelClass}>Processo (opcional)</label>
            <select {...register('processoId')} className={inputClass}>
              <option value="">Nenhum</option>
              {processos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.numero || 'Sem número'} — {p.cliente.nomeCompleto}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {errors.root && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">
          {errors.root.message}
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
          disabled={isSubmitting}
          className="px-5 py-2 text-sm font-medium text-white bg-green-800 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
        >
          {isSubmitting ? 'Salvando...' : 'Salvar Tarefa'}
        </button>
      </div>
    </form>
  )
}
