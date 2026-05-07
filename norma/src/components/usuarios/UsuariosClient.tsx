'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Pencil, UserX, UserCheck, X, Shield, Users, Briefcase } from 'lucide-react'

interface Usuario {
  id: string
  nome: string
  email: string
  perfil: string
  area: string | null
  oab: string | null
  telefone: string | null
  ativo: boolean
  permissoes: string[]
  createdAt: string
}

interface Props {
  usuarios: Usuario[]
  sessaoId: string
  perfilLabels: Record<string, string>
  areaLabels: Record<string, string>
}

const perfilConfig: Record<string, { label: string; desc: string; color: string; icon: any }> = {
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

export default function UsuariosClient({ usuarios: inicial, sessaoId, perfilLabels, areaLabels }: Props) {
  const router = useRouter()
  const [usuarios, setUsuarios] = useState(inicial)
  const [modalAberto, setModalAberto] = useState(false)
  const [editando, setEditando] = useState<Usuario | null>(null)
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')

  const [form, setForm] = useState({
    nome: '',
    email: '',
    senha: '',
    perfil: 'COLABORADOR',
    area: '',
    oab: '',
    telefone: '',
    permissoes: ['/dashboard'] as string[],
  })

  function abrirNovo() {
    setEditando(null)
    setForm({ nome: '', email: '', senha: '', perfil: 'COLABORADOR', area: '', oab: '', telefone: '', permissoes: ['/dashboard'] })
    setErro('')
    setModalAberto(true)
  }

  function abrirEditar(u: Usuario) {
    setEditando(u)
    setForm({
      nome: u.nome,
      email: u.email,
      senha: '',
      perfil: u.perfil,
      area: u.area || '',
      oab: u.oab || '',
      telefone: u.telefone || '',
      permissoes: u.permissoes.length > 0 ? u.permissoes : ['/dashboard'],
    })
    setErro('')
    setModalAberto(true)
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  function togglePermissao(path: string) {
    setForm(prev => {
      const exists = prev.permissoes.includes(path)
      if (exists && path === '/dashboard') return prev // dashboard sempre obrigatório
      if (exists) return { ...prev, permissoes: prev.permissoes.filter(p => p !== path) }
      return { ...prev, permissoes: [...prev.permissoes, path] }
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    setLoading(true)

    try {
      if (editando) {
        const res = await fetch(`/api/usuarios/${editando.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...form, ativo: editando.ativo }),
        })
        if (!res.ok) throw new Error('Erro ao atualizar')
        setUsuarios(prev => prev.map(u => u.id === editando.id ? { ...u, ...form } : u))
      } else {
        const res = await fetch('/api/usuarios', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Erro ao criar')
        setUsuarios(prev => [...prev, { ...data, createdAt: new Date().toISOString() }])
      }
      setModalAberto(false)
      router.refresh()
    } catch (err: any) {
      setErro(err.message || 'Erro ao salvar')
    } finally {
      setLoading(false)
    }
  }

  async function toggleAtivo(u: Usuario) {
    if (u.id === sessaoId) return

    const novoAtivo = !u.ativo
    setUsuarios(prev => prev.map(x => x.id === u.id ? { ...x, ativo: novoAtivo } : x))

    await fetch(`/api/usuarios/${u.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nome: u.nome, perfil: u.perfil,
        area: u.area, oab: u.oab,
        telefone: u.telefone, ativo: novoAtivo,
        permissoes: u.permissoes,
      }),
    })

    router.refresh()
  }

  const ativos = usuarios.filter(u => u.ativo)
  const inativos = usuarios.filter(u => !u.ativo)

  return (
    <>
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="rounded-xl border border-white/10 bg-white/5 p-5">
          <div className="text-2xl font-bold text-foreground">{usuarios.length}</div>
          <div className="text-xs text-muted-foreground mt-1 uppercase tracking-wide font-medium">Total de usuários</div>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-5">
          <div className="text-2xl font-bold text-emerald-400">{ativos.length}</div>
          <div className="text-xs text-muted-foreground mt-1 uppercase tracking-wide font-medium">Ativos</div>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-5">
          <div className="text-2xl font-bold text-muted-foreground">{inativos.length}</div>
          <div className="text-xs text-muted-foreground mt-1 uppercase tracking-wide font-medium">Inativos</div>
        </div>
      </div>

      {/* Tabela */}
      <div className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
          <span className="font-semibold text-foreground text-sm">Equipe</span>
          <button
            onClick={abrirNovo}
            className="flex items-center gap-2 text-black text-sm font-semibold px-4 py-2 rounded-lg transition-all hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #d4af37, #B8962A)' }}
          >
            <Plus size={14} />
            Novo Usuário
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px]">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.24em] px-5 py-3">Usuário</th>
                <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.24em] px-5 py-3">Tipo</th>
                <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.24em] px-5 py-3 hidden md:table-cell">Área</th>
                <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.24em] px-5 py-3 hidden lg:table-cell">Telas</th>
                <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.24em] px-5 py-3">Status</th>
                <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.24em] px-5 py-3 hidden sm:table-cell">Desde</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map(u => {
                const perfil = perfilConfig[u.perfil]
                const Icon = perfil?.icon
                const ehVoce = u.id === sessaoId
                const telasCount = u.perfil === 'GESTOR_GERAL' ? 'Todas' : u.perfil === 'GERENTE' ? 'Quase todas' : `${u.permissoes.length}`

                return (
                  <tr key={u.id} className={`border-b border-white/5 last:border-0 transition-colors ${!u.ativo ? 'opacity-50' : 'hover:bg-white/[0.03]'}`}>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0" style={{ background: 'rgba(184,150,42,0.18)', color: '#d4af37' }}>
                          {u.nome.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-foreground">
                            {u.nome}
                            {ehVoce && <span className="ml-2 text-xs text-muted-foreground">(você)</span>}
                          </div>
                          <div className="text-xs text-muted-foreground">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full ${perfil?.color}`}>
                        {Icon && <Icon size={11} />}
                        {perfil?.label}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-sm text-muted-foreground hidden md:table-cell">
                      {u.area ? areaLabels[u.area] || u.area : '—'}
                    </td>
                    <td className="px-5 py-3 hidden lg:table-cell">
                      <span className="text-xs font-medium text-muted-foreground bg-white/5 border border-white/10 px-2 py-0.5 rounded-full">
                        {telasCount} {typeof telasCount === 'number' && telasCount !== 1 ? 'telas' : typeof telasCount === 'number' ? 'tela' : ''}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${u.ativo ? 'bg-emerald-400/15 text-emerald-400' : 'bg-white/8 text-muted-foreground'}`}>
                        {u.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-xs text-muted-foreground hidden sm:table-cell">
                      {new Date(u.createdAt).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => abrirEditar(u)}
                          className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded"
                          title="Editar"
                        >
                          <Pencil size={14} />
                        </button>
                        {!ehVoce && (
                          <button
                            onClick={() => toggleAtivo(u)}
                            className={`transition-colors p-1 rounded ${u.ativo ? 'text-muted-foreground hover:text-red-400' : 'text-muted-foreground hover:text-emerald-400'}`}
                            title={u.ativo ? 'Desativar' : 'Reativar'}
                          >
                            {u.ativo ? <UserX size={14} /> : <UserCheck size={14} />}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {modalAberto && (
        <>
          <div className="fixed inset-0 z-50" style={{ background: 'rgba(0,0,0,0.72)' }} />
          <div className="fixed inset-0 z-50 overflow-y-auto overscroll-contain">
          <div className="flex min-h-full items-start justify-center px-4 py-8">
          <div className="relative w-full max-w-lg rounded-2xl border border-white/10" style={{ background: 'var(--surface)' }}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 rounded-t-2xl" style={{ background: 'var(--surface)' }}>
              <h2 className="text-base font-semibold text-foreground">
                {editando ? 'Editar Usuário' : 'Novo Usuário'}
              </h2>
              <button onClick={() => setModalAberto(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Dados básicos */}
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
                    disabled={!!editando}
                  />
                </div>
                <div className="col-span-2">
                  <label className={labelClass}>
                    {editando ? 'Nova senha (deixe em branco para manter)' : 'Senha *'}
                  </label>
                  <input
                    type="password"
                    name="senha"
                    value={form.senha}
                    onChange={handleChange}
                    className={inputClass}
                    required={!editando}
                    placeholder={editando ? '••••••••' : ''}
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

              {/* Tipo de usuário */}
              <div>
                <label className={labelClass}>Tipo de usuário *</label>
                <div className="space-y-2 mt-1">
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
              <div>
                <label className={labelClass}>Área / Departamento</label>
                <select name="area" value={form.area} onChange={handleChange} className={inputClass}>
                  {areaOptions.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>

              {/* Permissões de telas — somente para COLABORADOR */}
              {form.perfil === 'COLABORADOR' && (
                <div>
                  <label className={labelClass}>Telas com acesso</label>
                  <p className="text-xs text-muted-foreground mb-3">Dashboard sempre incluído. Marque as demais telas que este colaborador poderá acessar.</p>
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
                <div className="rounded-lg border border-red-400/30 bg-red-400/10 text-red-400 text-sm px-4 py-3">
                  {erro}
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setModalAberto(false)}
                  className="flex-1 px-4 py-2 text-sm font-medium text-muted-foreground border border-white/10 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 text-sm font-semibold text-black rounded-lg transition-all disabled:opacity-50 hover:opacity-90"
                  style={{ background: 'linear-gradient(135deg, #d4af37, #B8962A)' }}
                >
                  {loading ? 'Salvando...' : editando ? 'Salvar' : 'Criar Usuário'}
                </button>
              </div>
            </form>
          </div>
          </div>
          </div>
          </div>
        </>
      )}
    </>
  )
}
