'use client'

import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { processoSchema, type ProcessoFormData } from '@/lib/schemas'

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

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<ProcessoFormData>({
    resolver: zodResolver(processoSchema),
    defaultValues: {
      clienteId: clienteIdInicial ?? '',
      tipo: 'JUDICIAL',
      fase: 'CONHECIMENTO',
      status: 'EM_ANDAMENTO',
    },
  })

  async function onSubmit(data: ProcessoFormData) {
    try {
      const payload = {
        ...data,
        dataDistribuicao: data.dataDistribuicao
          ? new Date(data.dataDistribuicao).toISOString()
          : null,
        valorCausa: data.valorCausa ? parseFloat(data.valorCausa) : null,
        areaJuridica: data.areaJuridica || null,
        responsavelId: data.responsavelId || null,
      }

      const res = await fetch('/api/processos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        setError('root', { message: body.error ?? 'Erro ao salvar processo' })
        return
      }

      router.push('/processos')
      router.refresh()
    } catch {
      setError('root', { message: 'Erro ao salvar. Verifique os dados e tente novamente.' })
    }
  }

  const inputClass = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent"
  const inputErrorClass = "w-full border border-red-400 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent"
  const labelClass = "block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1"
  const sectionClass = "bg-white border border-gray-200 rounded-xl p-6 shadow-sm mb-5"
  const errMsgClass = "text-xs text-red-600 mt-1"

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-3xl">

      {/* Vínculo */}
      <div className={sectionClass}>
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Vínculo</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className={labelClass}>Cliente *</label>
            <select
              {...register('clienteId')}
              className={errors.clienteId ? inputErrorClass : inputClass}
            >
              <option value="">Selecione o cliente</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>{c.nomeCompleto}</option>
              ))}
            </select>
            {errors.clienteId && <p className={errMsgClass}>{errors.clienteId.message}</p>}
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
          <div>
            <label className={labelClass}>Tipo</label>
            <select {...register('tipo')} className={inputClass}>
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
            <input
              {...register('numero')}
              placeholder="0000000-00.0000.0.00.0000"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Área Jurídica</label>
            <select {...register('areaJuridica')} className={inputClass}>
              <option value="">Selecione</option>
              {areaOptions.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Tribunal</label>
            <input
              {...register('tribunal')}
              placeholder="Ex: TJRJ, TRT 1ª Região"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Vara</label>
            <input {...register('vara')} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Comarca</label>
            <input {...register('comarca')} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Tipo de Ação</label>
            <input
              {...register('tipoAcao')}
              placeholder="Ex: Reclamação Trabalhista"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Data de Distribuição</label>
            <input type="date" {...register('dataDistribuicao')} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Valor da Causa (R$)</label>
            <input
              type="number"
              {...register('valorCausa')}
              placeholder="0,00"
              step="0.01"
              min="0"
              className={errors.valorCausa ? inputErrorClass : inputClass}
            />
            {errors.valorCausa && <p className={errMsgClass}>{errors.valorCausa.message}</p>}
          </div>
        </div>
      </div>

      {/* Status */}
      <div className={sectionClass}>
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Status</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Fase</label>
            <select {...register('fase')} className={inputClass}>
              <option value="CONHECIMENTO">Conhecimento</option>
              <option value="RECURSAL">Recursal</option>
              <option value="EXECUCAO">Execução</option>
              <option value="ENCERRADO">Encerrado</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Status</label>
            <select {...register('status')} className={inputClass}>
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
            <textarea {...register('observacoes')} className={inputClass} rows={3} />
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
          {isSubmitting ? 'Salvando...' : 'Salvar Processo'}
        </button>
      </div>
    </form>
  )
}
