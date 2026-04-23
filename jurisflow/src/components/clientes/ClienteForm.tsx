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
  'SP','SE','TO'
]

export default function ClienteForm({ clienteId }: { clienteId?: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const [tipo, setTipo] = useState('PESSOA_FISICA')

  const [form, setForm] = useState({
    tipo: 'PESSOA_FISICA',
    nomeCompleto: '',
    cpf: '',
    rg: '',
    dataNascimento: '',
    razaoSocial: '',
    cnpj: '',
    email: '',
    telefone: '',
    whatsapp: '',
    cep: '',
    logradouro: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    estado: '',
    areaJuridica: '',
    origemCliente: '',
    observacoes: '',
    status: 'ATIVO',
  })

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    if (name === 'tipo') setTipo(value)
  }

  async function buscarCEP(cep: string) {
    const digits = cep.replace(/\D/g, '')
    if (digits.length !== 8) return
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`)
      const data = await res.json()
      if (!data.erro) {
        setForm(prev => ({
          ...prev,
          logradouro: data.logradouro,
          bairro: data.bairro,
          cidade: data.localidade,
          estado: data.uf,
        }))
      }
    } catch {}
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    setLoading(true)

    try {
      const payload = {
        ...form,
        dataNascimento: form.dataNascimento ? new Date(form.dataNascimento).toISOString() : null,
        areaJuridica: form.areaJuridica || null,
        origemCliente: form.origemCliente || null,
      }

      const res = await fetch('/api/clientes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) throw new Error('Erro ao salvar cliente')

      router.push('/clientes')
      router.refresh()
    } catch (err) {
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

      {/* Tipo */}
      <div className={sectionClass}>
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Tipo de Cliente</h2>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="tipo"
              value="PESSOA_FISICA"
              checked={tipo === 'PESSOA_FISICA'}
              onChange={handleChange}
              className="accent-green-700"
            />
            <span className="text-sm text-gray-700">Pessoa Física</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="tipo"
              value="PESSOA_JURIDICA"
              checked={tipo === 'PESSOA_JURIDICA'}
              onChange={handleChange}
              className="accent-green-700"
            />
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
            <input name="nomeCompleto" value={form.nomeCompleto} onChange={handleChange} className={inputClass} required />
          </div>

          {tipo === 'PESSOA_FISICA' ? (
            <>
              <div>
                <label className={labelClass}>CPF</label>
                <input name="cpf" value={form.cpf} onChange={handleChange} className={inputClass} placeholder="000.000.000-00" />
              </div>
              <div>
                <label className={labelClass}>RG</label>
                <input name="rg" value={form.rg} onChange={handleChange} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Data de Nascimento</label>
                <input type="date" name="dataNascimento" value={form.dataNascimento} onChange={handleChange} className={inputClass} />
              </div>
            </>
          ) : (
            <>
              <div>
                <label className={labelClass}>Razão Social</label>
                <input name="razaoSocial" value={form.razaoSocial} onChange={handleChange} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>CNPJ</label>
                <input name="cnpj" value={form.cnpj} onChange={handleChange} className={inputClass} placeholder="00.000.000/0000-00" />
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
            <input type="email" name="email" value={form.email} onChange={handleChange} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Telefone</label>
            <input name="telefone" value={form.telefone} onChange={handleChange} className={inputClass} placeholder="(00) 00000-0000" />
          </div>
          <div>
            <label className={labelClass}>WhatsApp</label>
            <input name="whatsapp" value={form.whatsapp} onChange={handleChange} className={inputClass} placeholder="(00) 00000-0000" />
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
              name="cep"
              value={form.cep}
              onChange={handleChange}
              onBlur={(e) => buscarCEP(e.target.value)}
              className={inputClass}
              placeholder="00000-000"
            />
          </div>
          <div className="col-span-2">
            <label className={labelClass}>Logradouro</label>
            <input name="logradouro" value={form.logradouro} onChange={handleChange} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Número</label>
            <input name="numero" value={form.numero} onChange={handleChange} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Complemento</label>
            <input name="complemento" value={form.complemento} onChange={handleChange} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Bairro</label>
            <input name="bairro" value={form.bairro} onChange={handleChange} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Cidade</label>
            <input name="cidade" value={form.cidade} onChange={handleChange} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Estado</label>
            <select name="estado" value={form.estado} onChange={handleChange} className={inputClass}>
              <option value="">Selecione</option>
              {estadoOptions.map(uf => (
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
            <select name="areaJuridica" value={form.areaJuridica} onChange={handleChange} className={inputClass}>
              <option value="">Selecione</option>
              {areaOptions.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Como nos conheceu</label>
            <select name="origemCliente" value={form.origemCliente} onChange={handleChange} className={inputClass}>
              <option value="">Selecione</option>
              {origemOptions.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Status</label>
            <select name="status" value={form.status} onChange={handleChange} className={inputClass}>
              <option value="ATIVO">Ativo</option>
              <option value="PROSPECTO">Prospecto</option>
              <option value="DOCUMENTACAO_PENDENTE">Documentação Pendente</option>
              <option value="INATIVO">Inativo</option>
            </select>
          </div>
          <div className="col-span-2">
            <label className={labelClass}>Observações</label>
            <textarea
              name="observacoes"
              value={form.observacoes}
              onChange={handleChange}
              className={inputClass}
              rows={3}
            />
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
          {loading ? 'Salvando...' : 'Salvar Cliente'}
        </button>
      </div>
    </form>
  )
}