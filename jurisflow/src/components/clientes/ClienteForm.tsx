'use client'

import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { clienteSchema, type ClienteFormData } from '@/lib/schemas'

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

const origemOptions = [
  { value: 'INDICACAO', label: 'Indicação' },
  { value: 'SITE', label: 'Site' },
  { value: 'INSTAGRAM', label: 'Instagram' },
  { value: 'GOOGLE', label: 'Google' },
  { value: 'WHATSAPP', label: 'WhatsApp' },
  { value: 'OUTRO', label: 'Outro' },
]

const estadoOptions = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS',
  'MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC',
  'SP','SE','TO',
]

export default function ClienteForm({ clienteId }: { clienteId?: string }) {
  const router = useRouter()

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<ClienteFormData>({
    resolver: zodResolver(clienteSchema),
    defaultValues: {
      tipo: 'PESSOA_FISICA',
      status: 'ATIVO',
    },
  })

  const tipo = watch('tipo')

  async function buscarCEP(cep: string) {
    const digits = cep.replace(/\D/g, '')
    if (digits.length !== 8) return
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`)
      const data = await res.json()
      if (!data.erro) {
        setValue('logradouro', data.logradouro)
        setValue('bairro', data.bairro)
        setValue('cidade', data.localidade)
        setValue('estado', data.uf)
      }
    } catch {
      // CEP lookup failed silently — user can fill manually
    }
  }

  async function onSubmit(data: ClienteFormData) {
    try {
      const payload = {
        ...data,
        dataNascimento: data.dataNascimento ? new Date(data.dataNascimento).toISOString() : null,
        areaJuridica: data.areaJuridica || null,
        origemCliente: data.origemCliente || null,
        responsavelId: undefined,
      }

      const res = await fetch('/api/clientes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        setError('root', { message: body.error ?? 'Erro ao salvar cliente' })
        return
      }

      router.push('/clientes')
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

      {/* Tipo */}
      <div className={sectionClass}>
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Tipo de Cliente</h2>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="radio" value="PESSOA_FISICA" {...register('tipo')} className="accent-green-700" />
            <span className="text-sm text-gray-700">Pessoa Física</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="radio" value="PESSOA_JURIDICA" {...register('tipo')} className="accent-green-700" />
            <span className="text-sm text-gray-700">Pessoa Jurídica</span>
          </label>
        </div>
      </div>

      {/* Dados Pessoais */}
      <div className={sectionClass}>
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Dados Pessoais</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className={labelClass}>Nome Completo *</label>
            <input
              {...register('nomeCompleto')}
              className={errors.nomeCompleto ? inputErrorClass : inputClass}
            />
            {errors.nomeCompleto && <p className={errMsgClass}>{errors.nomeCompleto.message}</p>}
          </div>

          {tipo === 'PESSOA_FISICA' ? (
            <>
              <div>
                <label className={labelClass}>CPF</label>
                <input {...register('cpf')} placeholder="000.000.000-00" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>RG</label>
                <input {...register('rg')} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Data de Nascimento</label>
                <input type="date" {...register('dataNascimento')} className={inputClass} />
              </div>
            </>
          ) : (
            <>
              <div>
                <label className={labelClass}>Razão Social</label>
                <input {...register('razaoSocial')} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>CNPJ</label>
                <input {...register('cnpj')} placeholder="00.000.000/0000-00" className={inputClass} />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Contato */}
      <div className={sectionClass}>
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Contato</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>E-mail</label>
            <input
              type="email"
              {...register('email')}
              className={errors.email ? inputErrorClass : inputClass}
            />
            {errors.email && <p className={errMsgClass}>{errors.email.message}</p>}
          </div>
          <div>
            <label className={labelClass}>Telefone</label>
            <input {...register('telefone')} placeholder="(00) 00000-0000" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>WhatsApp</label>
            <input {...register('whatsapp')} placeholder="(00) 00000-0000" className={inputClass} />
          </div>
        </div>
      </div>

      {/* Endereço */}
      <div className={sectionClass}>
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Endereço</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>CEP</label>
            <input
              {...register('cep')}
              placeholder="00000-000"
              className={inputClass}
              onBlur={(e) => buscarCEP(e.target.value)}
            />
          </div>
          <div className="col-span-2">
            <label className={labelClass}>Logradouro</label>
            <input {...register('logradouro')} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Número</label>
            <input {...register('numero')} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Complemento</label>
            <input {...register('complemento')} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Bairro</label>
            <input {...register('bairro')} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Cidade</label>
            <input {...register('cidade')} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Estado</label>
            <select {...register('estado')} className={inputClass}>
              <option value="">Selecione</option>
              {estadoOptions.map((uf) => (
                <option key={uf} value={uf}>{uf}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Dados do Caso */}
      <div className={sectionClass}>
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Dados do Caso</h2>
        <div className="grid grid-cols-2 gap-4">
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
            <label className={labelClass}>Como nos conheceu</label>
            <select {...register('origemCliente')} className={inputClass}>
              <option value="">Selecione</option>
              {origemOptions.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Status</label>
            <select {...register('status')} className={inputClass}>
              <option value="ATIVO">Ativo</option>
              <option value="PROSPECTO">Prospecto</option>
              <option value="DOCUMENTACAO_PENDENTE">Documentação Pendente</option>
              <option value="INATIVO">Inativo</option>
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
          {isSubmitting ? 'Salvando...' : 'Salvar Cliente'}
        </button>
      </div>
    </form>
  )
}
