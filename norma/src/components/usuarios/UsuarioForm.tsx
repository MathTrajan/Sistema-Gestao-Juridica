'use client'

import { type ElementType, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Shield, Users, Briefcase } from 'lucide-react'

interface Props {
  usuarioId?: string
  initialData?: Partial<FormState>
}

interface FormState {
  nome: string
  email: string
  senha: string
  perfil: string
  area: string
  oab: string
  telefone: string
  permissoes: string[]
}

const perfilConfig: Record<string, { label: string; desc: string; color: string; icon: ElementType }> = {
  GESTOR_GERAL: { label: 'Administrador', desc: 'Acesso total ao sistema', color: 'bg-purple-400/15 text-purple-400', icon: Shield },
  GERENTE:      { label: 'Gerente',        desc: 'Acesso total exceto Configurações', color: 'bg-blue-400/15 text-blue-400', icon: Users },
  COLABORADOR:  { label: 'Colaborador',    desc: 'Acesso somente às telas permitidas', color: 'bg-white/8 text-muted-foreground', icon: Briefcase },
}

const areaOptions = [
  { value: '', label: 'Sem área específica' },
  { value: 'COMERCIAL', label: 'Comercial' },
  { value: 'CONTROLADORIA', label: 'Controladoria' },
  { value: 'JURIDICO', label: 'Jurídico' },
  { value: 'FINANCEIRO', label: 'Financeiro' },
  { value: 'MARKETING', label: 'Marketing' },
]

const TELAS_DISPONIVEIS = [
  { path: '/dashboard',     label: 'Dashboard' },
  { path: '/clientes',      label: 'Clientes' },
  { path: '/processos',     label: 'Processos' },
  { path: '/prazos',        label: 'Prazos' },
  { path: '/tarefas',       label: 'Tarefas' },
  { path: '/financeiro',    label: 'Financeiro' },
  { path: '/comercial',     label: 'Comercial / CRM' },
  { path: '/controladoria', label: 'Controladoria' },
  { path: '/relatorios',    label: 'Relatórios' },
  { path: '/marketing',     label: 'Marketing' },
  { path: '/usuarios',      label: 'Usuários' },
]

const inputClass = "w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-foreground outline-none transition focus:border-[rgba(184,150,42,0.4)] focus:bg-white/[0.08]"
const labelClass = "block text-xs font-semibold uppercase tracking-wide mb-1 text-muted-foreground"
const sectionClass = "rounded-xl border border-white/10 bg-white/5 p-6 mb-5"

export default function UsuarioForm({ usuarioId, initialData }: Props) {
  const router = useRouter()
  const isEdit = !!usuarioId
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')

  const [form, setForm] = useState<FormState>({
    nome: '',
    email: '',
    senha: '',
    perfil: 'COLABORADOR',
    area: '',
    oab: '',
    telefone: '',
    permissoes: ['/dashboard'],
    ...initialData,
  })

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  function togglePermissao(path: string) {
    setForm(prev => {
      const exists = prev.permissoes.includes(path)
      if (exists && path === '/dashboard') return prev
      if (exists) return { ...prev, permissoes: prev.permissoes.filter(p => p !== path) }
      return { ...prev, permissoes: [...prev.permissoes, path] }
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nome.trim()) { setErro('Nome é obrigatório.'); return }
    if (!isEdit && !form.senha) { setErro('Senha é obrigatória.'); return }
    setErro('')
    setLoading(true)

    try {
      const res = await fetch(
        isEdit ? `/api/usuarios/${usuarioId}` : '/api/usuarios',
        {
          method: isEdit ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...form, ativo: true }),
        }
      )
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao salvar')
      router.push('/usuarios')
      router.refresh()
    } catch (err: unknown) {
      setErro(err instanceof Error ? err.message : 'Erro ao salvar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl">

      {/* Dados básicos */}
      <div className={sectionClass}>
        <h2 className="text-sm font-semibold text-foreground mb-4">Dados Pessoais</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className={labelClass}>Nome completo *</label>
            <input name="nome" value={form.nome} onChange={handleChange} className={inputClass} required />
          </div>
          <div className="col-span-2">
            <label className={labelClass}>E-mail *</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              className={inputClass}
              required
              disabled={isEdit}
            />
            {isEdit && <p className="text-xs text-muted-foreground mt-1">E-mail não pode ser alterado após o cadastro.</p>}
          </div>
          <div className="col-span-2">
            <label className={labelClass}>
              {isEdit ? 'Nova senha (deixe em branco para manter)' : 'Senha *'}
            </label>
            <input
              type="password"
              name="senha"
              value={form.senha}
              onChange={handleChange}
              className={inputClass}
              required={!isEdit}
              placeholder={isEdit ? '••••••••' : ''}
            />
          </div>
          <div>
            <label className={labelClass}>OAB</label>
            <input name="oab" value={form.oab} onChange={handleChange} className={inputClass} placeholder="OAB/UF 000000" />
          </div>
          <div>
            <label className={labelClass}>Telefone</label>
            <input name="telefone" value={form.telefone} onChange={handleChange} className={inputClass} placeholder="(00) 00000-0000" />
          </div>
        </div>
      </div>

      {/* Tipo de usuário */}
      <div className={sectionClass}>
        <h2 className="text-sm font-semibold text-foreground mb-4">Tipo de Usuário</h2>
        <div className="space-y-2">
          {Object.entries(perfilConfig).map(([key, cfg]) => {
            const Ic = cfg.icon
            const selecionado = form.perfil === key
            return (
              <label
                key={key}
                className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  selecionado
                    ? 'border-[rgba(184,150,42,0.5)] bg-[rgba(184,150,42,0.08)]'
                    : 'border-white/10 bg-white/[0.02] hover:bg-white/5'
                }`}
              >
                <input
                  type="radio"
                  name="perfil"
                  value={key}
                  checked={selecionado}
                  onChange={handleChange}
                  className="accent-[#B8962A]"
                />
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg flex-shrink-0 ${cfg.color}`}>
                  <Ic size={15} />
                </div>
                <div>
                  <div className="text-sm font-semibold text-foreground">{cfg.label}</div>
                  <div className="text-xs text-muted-foreground">{cfg.desc}</div>
                </div>
              </label>
            )
          })}
        </div>
      </div>

      {/* Área */}
      <div className={sectionClass}>
        <h2 className="text-sm font-semibold text-foreground mb-4">Área / Departamento</h2>
        <select name="area" value={form.area} onChange={handleChange} className={inputClass}>
          {areaOptions.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* Permissões — somente para COLABORADOR */}
      {form.perfil === 'COLABORADOR' && (
        <div className={sectionClass}>
          <h2 className="text-sm font-semibold text-foreground mb-1">Telas com Acesso</h2>
          <p className="text-xs text-muted-foreground mb-4">Dashboard sempre incluído. Marque as demais telas que este colaborador poderá acessar.</p>
          <div className="grid grid-cols-2 gap-2">
            {TELAS_DISPONIVEIS.map(tela => {
              const ativa = form.permissoes.includes(tela.path)
              const obrigatoria = tela.path === '/dashboard'
              return (
                <label
                  key={tela.path}
                  className={`flex items-center gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-all ${
                    ativa
                      ? 'border-[rgba(184,150,42,0.4)] bg-[rgba(184,150,42,0.07)]'
                      : 'border-white/8 bg-white/[0.02] hover:bg-white/5'
                  } ${obrigatoria ? 'opacity-70' : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={ativa}
                    onChange={() => togglePermissao(tela.path)}
                    disabled={obrigatoria}
                    className="accent-[#B8962A] flex-shrink-0"
                  />
                  <span className={`text-xs font-medium ${ativa ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {tela.label}
                  </span>
                </label>
              )
            })}
          </div>
        </div>
      )}

      {erro && (
        <div className="rounded-lg border border-red-400/30 bg-red-400/10 text-red-400 text-sm px-4 py-3 mb-4">
          {erro}
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
          disabled={loading}
          className="px-5 py-2 text-sm font-semibold text-black rounded-lg transition-all disabled:opacity-50"
          style={{ background: 'linear-gradient(135deg, #d4af37, #B8962A)' }}
        >
          {loading ? 'Salvando...' : isEdit ? 'Salvar Alterações' : 'Criar Usuário'}
        </button>
      </div>
    </form>
  )
}
