'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { tarefaSchema, type TarefaFormData } from '@/lib/schemas'

interface Prazo {
  id: string
  titulo: string
  dataFinal: string
  processoId: string
}

interface Props {
  processos: { id: string; numero: string | null; cliente: { nomeCompleto: string } }[]
  usuarios: { id: string; nome: string }[]
  prazos?: Prazo[]
  processoIdInicial?: string
}

export default function TarefaForm({ processos, usuarios, prazos = [], processoIdInicial }: Props) {
  const router = useRouter()
  const [processoSelecionado, setProcessoSelecionado] = useState(processoIdInicial ?? '')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    setValue,
  } = useForm<TarefaFormData>({
    resolver: zodResolver(tarefaSchema),
    defaultValues: {
      status: 'A_FAZER',
      prioridade: 'NORMAL',
      processoId: processoIdInicial ?? '',
      prazoId: '',
    },
  })

  const processoIdRegister = register('processoId')
  const prazosDoProcesso = prazos.filter(p => p.processoId === processoSelecionado)

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

  const inputClass = "w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-foreground outline-none transition focus:border-gold/35 focus:bg-white/8"
  const inputErrorClass = "w-full rounded-lg border border-red-400/60 bg-white/5 px-3 py-2 text-sm text-foreground outline-none transition focus:border-red-400/80"
  const labelClass = "block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1"
  const sectionClass = "rounded-xl border border-white/10 bg-white/5 p-6 shadow-sm mb-5"
  const errMsgClass = "text-xs text-red-400 mt-1"

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
            <select
              {...processoIdRegister}
              className={inputClass}
              onChange={(e) => {
                processoIdRegister.onChange(e)
                setValue('prazoId', '')
                setProcessoSelecionado(e.target.value)
              }}
            >
              <option value="">Nenhum</option>
              {processos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.numero || 'Sem número'} — {p.cliente.nomeCompleto}
                </option>
              ))}
            </select>
          </div>
          {processoSelecionado && (
            <div className="col-span-2">
              <label className={labelClass}>Prazo Vinculado (opcional)</label>
              <select {...register('prazoId')} className={inputClass}>
                <option value="">Nenhum</option>
                {prazosDoProcesso.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.titulo} — vence {new Date(p.dataFinal).toLocaleDateString('pt-BR')}
                  </option>
                ))}
              </select>
              {prazosDoProcesso.length === 0 && (
                <p className="mt-1 text-xs text-muted-foreground">Nenhum prazo cadastrado para este processo.</p>
              )}
            </div>
          )}
        </div>
      </div>

      {errors.root && (
        <div className="rounded-lg border border-red-400/30 bg-red-400/10 text-red-400 text-sm px-4 py-3 mb-4">
          {errors.root.message}
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
          disabled={isSubmitting}
          className="px-5 py-2 text-sm font-semibold text-black rounded-lg transition-all hover:opacity-90 disabled:opacity-50"
          style={{ background: 'linear-gradient(135deg, #d4af37, #B8962A)' }}
        >
          {isSubmitting ? 'Salvando...' : 'Salvar Tarefa'}
        </button>
      </div>
    </form>
  )
}
