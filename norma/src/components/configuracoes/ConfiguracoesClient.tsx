'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Save, Building2, Bell, Shield } from 'lucide-react'

interface Escritorio {
  id: string
  nome: string
  cnpj: string | null
  email: string | null
  telefone: string | null
  endereco: string | null
  oab: string | null
  plano: string
  createdAt: string
  updatedAt: string
}

const inputClass = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent"
const labelClass = "block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1"
const sectionClass = "bg-white border border-gray-200 rounded-xl p-6 shadow-sm mb-5"

export default function ConfiguracoesClient({ escritorio }: { escritorio: Escritorio | null }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [sucesso, setSucesso] = useState(false)
  const [erro, setErro] = useState('')

  const [form, setForm] = useState({
    nome: escritorio?.nome || '',
    cnpj: escritorio?.cnpj || '',
    email: escritorio?.email || '',
    telefone: escritorio?.telefone || '',
    endereco: escritorio?.endereco || '',
    oab: escritorio?.oab || '',
  })

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    setSucesso(false)
    setLoading(true)

    try {
      const res = await fetch('/api/configuracoes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      if (!res.ok) throw new Error()

      setSucesso(true)
      router.refresh()
      setTimeout(() => setSucesso(false), 3000)
    } catch {
      setErro('Erro ao salvar. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const planoLabels: Record<string, string> = {
    BASICO: 'Básico',
    PROFISSIONAL: 'Profissional',
    ENTERPRISE: 'Enterprise',
  }

  return (
    <div className="max-w-3xl">
      <form onSubmit={handleSubmit}>
        {/* Dados do Escritório */}
        <div className={sectionClass}>
          <div className="flex items-center gap-2 mb-5">
            <Building2 size={16} className="text-gray-500" />
            <h2 className="text-sm font-semibold text-gray-700">Dados do Escritório</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className={labelClass}>Nome do Escritório *</label>
              <input name="nome" value={form.nome} onChange={handleChange} className={inputClass} required />
            </div>
            <div>
              <label className={labelClass}>CNPJ</label>
              <input name="cnpj" value={form.cnpj} onChange={handleChange} className={inputClass} placeholder="00.000.000/0000-00" />
            </div>
            <div>
              <label className={labelClass}>OAB Principal</label>
              <input name="oab" value={form.oab} onChange={handleChange} className={inputClass} placeholder="OAB/UF 000000" />
            </div>
            <div>
              <label className={labelClass}>E-mail</label>
              <input type="email" name="email" value={form.email} onChange={handleChange} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Telefone</label>
              <input name="telefone" value={form.telefone} onChange={handleChange} className={inputClass} placeholder="(00) 0000-0000" />
            </div>
            <div className="col-span-2">
              <label className={labelClass}>Endereço</label>
              <input name="endereco" value={form.endereco} onChange={handleChange} className={inputClass} placeholder="Rua, número, sala — Bairro, Cidade/UF" />
            </div>
          </div>
        </div>

        {sucesso && (
          <div className="bg-green-50 border border-green-200 text-green-800 text-sm rounded-lg px-4 py-3 mb-4">
            ✓ Dados salvos com sucesso!
          </div>
        )}
        {erro && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">
            {erro}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 bg-green-800 hover:bg-green-700 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors disabled:opacity-50 mb-8"
        >
          <Save size={14} />
          {loading ? 'Salvando...' : 'Salvar Alterações'}
        </button>
      </form>

      {/* Plano */}
      <div className={sectionClass}>
        <div className="flex items-center gap-2 mb-5">
          <Shield size={16} className="text-gray-500" />
          <h2 className="text-sm font-semibold text-gray-700">Plano Atual</h2>
        </div>
        <div className="bg-[#1a3a2a] rounded-xl p-5 text-white">
          <div className="text-xs opacity-60 mb-1 uppercase tracking-wide">Plano ativo</div>
          <div className="text-xl font-bold mb-1">
            {planoLabels[escritorio?.plano || 'BASICO']}
          </div>
          <div className="text-sm opacity-70">
            {escritorio?.plano === 'PROFISSIONAL'
              ? 'Até 10 usuários · Processos ilimitados · Integrações ativas'
              : escritorio?.plano === 'ENTERPRISE'
              ? 'Usuários ilimitados · Suporte prioritário · API completa'
              : 'Até 3 usuários · 100 processos'}
          </div>
        </div>
      </div>

      {/* Notificações */}
      <div className={sectionClass}>
        <div className="flex items-center gap-2 mb-5">
          <Bell size={16} className="text-gray-500" />
          <h2 className="text-sm font-semibold text-gray-700">Notificações</h2>
        </div>
        <div className="flex flex-col gap-4">
          {[
            { label: 'Prazos críticos (48h)', sub: 'Alerta quando prazo vence em menos de 48 horas' },
            { label: 'Nova movimentação processual', sub: 'Quando o DataJud detectar nova movimentação' },
            { label: 'Novo lead no CRM', sub: 'Quando um novo lead for cadastrado' },
            { label: 'Inadimplência detectada', sub: 'Quando um pagamento estiver em atraso' },
            { label: 'Relatório semanal', sub: 'Resumo enviado toda segunda-feira por e-mail' },
          ].map((item, i) => (
            <label key={i} className="flex items-center justify-between cursor-pointer gap-4">
              <div>
                <div className="text-sm font-medium text-gray-900">{item.label}</div>
                <div className="text-xs text-gray-400">{item.sub}</div>
              </div>
              <input
                type="checkbox"
                defaultChecked={i < 4}
                className="w-4 h-4 accent-green-700 flex-shrink-0"
              />
            </label>
          ))}
        </div>
      </div>

      {/* Info sistema */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Informações do Sistema</h2>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-gray-500">Criado em: </span>
            <span className="text-gray-800">{escritorio ? new Date(escritorio.createdAt).toLocaleDateString('pt-BR') : '—'}</span>
          </div>
          <div>
            <span className="text-gray-500">Última atualização: </span>
            <span className="text-gray-800">{escritorio ? new Date(escritorio.updatedAt).toLocaleDateString('pt-BR') : '—'}</span>
          </div>
        </div>
      </div>
    </div>
  )
}