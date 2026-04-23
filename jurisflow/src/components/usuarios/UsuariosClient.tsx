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
  createdAt: string
}

interface Props {
  usuarios: Usuario[]
  sessaoId: string
  perfilLabels: Record<string, string>
  areaLabels: Record<string, string>
}

const perfilConfig: Record<string, { label: string; color: string; icon: any }> = {
  GESTOR_GERAL: { label: 'Gestor Geral', color: 'bg-purple-100 text-purple-800', icon: Shield },
  GERENTE: { label: 'Gerente', color: 'bg-blue-100 text-blue-800', icon: Users },
  COLABORADOR: { label: 'Colaborador', color: 'bg-gray-100 text-gray-700', icon: Briefcase },
}

const areaOptions = [
  { value: '', label: 'Sem área específica' },
  { value: 'COMERCIAL', label: 'Comercial' },
  { value: 'CONTROLADORIA', label: 'Controladoria' },
  { value: 'JURIDICO', label: 'Jurídico' },
  { value: 'FINANCEIRO', label: 'Financeiro' },
  { value: 'MARKETING', label: 'Marketing' },
]

const inputClass = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent"
const labelClass = "block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1"

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
  })

  function abrirNovo() {
    setEditando(null)
    setForm({ nome: '', email: '', senha: '', perfil: 'COLABORADOR', area: '', oab: '', telefone: '' })
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
    })
    setErro('')
    setModalAberto(true)
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
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
      }),
    })

    router.refresh()
  }

  const ativos = usuarios.filter(u => u.ativo)
  const inativos = usuarios.filter(u => !u.ativo)

  return (
    <>
      {/* Stats */}
      <div className="grid grid-cols-3 gap-5 mb-8">
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="text-2xl font-bold text-gray-900">{usuarios.length}</div>
          <div className="text-xs text-gray-500 mt-1 uppercase tracking-wide font-medium">Total de usuários</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="text-2xl font-bold text-green-700">{ativos.length}</div>
          <div className="text-xs text-gray-500 mt-1 uppercase tracking-wide font-medium">Ativos</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="text-2xl font-bold text-gray-400">{inativos.length}</div>
          <div className="text-xs text-gray-500 mt-1 uppercase tracking-wide font-medium">Inativos</div>
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <span className="font-semibold text-gray-900 text-sm">Equipe</span>
          <button
            onClick={abrirNovo}
            className="flex items-center gap-2 bg-green-800 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            <Plus size={14} />
            Novo Usuário
          </button>
        </div>

        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-5 py-3">Usuário</th>
              <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-5 py-3">Perfil</th>
              <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-5 py-3">Área</th>
              <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-5 py-3">OAB</th>
              <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-5 py-3">Status</th>
              <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-5 py-3">Desde</th>
              <th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map(u => {
              const perfil = perfilConfig[u.perfil]
              const Icon = perfil?.icon
              const ehVoce = u.id === sessaoId

              return (
                <tr key={u.id} className={`border-b border-gray-50 last:border-0 transition-colors ${!u.ativo ? 'opacity-50' : 'hover:bg-gray-50'}`}>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-sm font-bold text-green-800 flex-shrink-0">
                        {u.nome.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {u.nome}
                          {ehVoce && <span className="ml-2 text-xs text-gray-400">(você)</span>}
                        </div>
                        <div className="text-xs text-gray-400">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full ${perfil?.color}`}>
                      {Icon && <Icon size={11} />}
                      {perfil?.label}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-sm text-gray-600">
                    {u.area ? areaLabels[u.area] || u.area : '—'}
                  </td>
                  <td className="px-5 py-3 text-sm text-gray-600">{u.oab || '—'}</td>
                  <td className="px-5 py-3">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${u.ativo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'}`}>
                      {u.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-xs text-gray-400">
                    {new Date(u.createdAt).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => abrirEditar(u)}
                        className="text-gray-400 hover:text-gray-700 transition-colors p-1 rounded"
                        title="Editar"
                      >
                        <Pencil size={14} />
                      </button>
                      {!ehVoce && (
                        <button
                          onClick={() => toggleAtivo(u)}
                          className={`transition-colors p-1 rounded ${u.ativo ? 'text-gray-400 hover:text-red-600' : 'text-gray-400 hover:text-green-600'}`}
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

      {/* Modal */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-base font-semibold text-gray-900">
                {editando ? 'Editar Usuário' : 'Novo Usuário'}
              </h2>
              <button onClick={() => setModalAberto(false)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
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
                  <label className={labelClass}>Perfil *</label>
                  <select name="perfil" value={form.perfil} onChange={handleChange} className={inputClass}>
                    <option value="COLABORADOR">Colaborador</option>
                    <option value="GERENTE">Gerente</option>
                    <option value="GESTOR_GERAL">Gestor Geral</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Área</label>
                  <select name="area" value={form.area} onChange={handleChange} className={inputClass}>
                    {areaOptions.map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
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

              {erro && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mt-4">
                  {erro}
                </div>
              )}

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setModalAberto(false)}
                  className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-green-800 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Salvando...' : editando ? 'Salvar' : 'Criar Usuário'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}