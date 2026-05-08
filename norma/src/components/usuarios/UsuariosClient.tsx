'use client'

import { type ElementType, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Pencil, UserX, UserCheck, Shield, Users, Briefcase } from 'lucide-react'

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

const perfilConfig: Record<string, { label: string; desc: string; color: string; icon: ElementType }> = {
  GESTOR_GERAL: { label: 'Administrador', desc: 'Acesso total ao sistema', color: 'bg-purple-400/15 text-purple-400', icon: Shield },
  GERENTE:      { label: 'Gerente',        desc: 'Acesso total exceto Configurações', color: 'bg-blue-400/15 text-blue-400', icon: Users },
  COLABORADOR:  { label: 'Colaborador',    desc: 'Acesso somente às telas permitidas', color: 'bg-white/8 text-muted-foreground', icon: Briefcase },
}


export default function UsuariosClient({ usuarios: inicial, sessaoId, perfilLabels: _perfilLabels, areaLabels }: Props) {
  const router = useRouter()
  void _perfilLabels
  const [usuarios, setUsuarios] = useState(inicial)

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
            onClick={() => router.push('/usuarios/novo')}
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
                          onClick={() => router.push(`/usuarios/${u.id}/editar`)}
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

    </>
  )
}
