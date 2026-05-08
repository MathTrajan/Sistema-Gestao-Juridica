import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import UsuariosClient from '@/components/usuarios/UsuariosClient'

export const dynamic = 'force-dynamic'

const perfilLabels: Record<string, string> = {
  GESTOR_GERAL: 'Gestor Geral',
  GERENTE: 'Gerente',
  COLABORADOR: 'Colaborador',
}

const areaLabels: Record<string, string> = {
  COMERCIAL: 'Comercial',
  CONTROLADORIA: 'Controladoria',
  JURIDICO: 'Jurídico',
  FINANCEIRO: 'Financeiro',
  MARKETING: 'Marketing',
}

export default async function UsuariosPage() {
  const session = await auth()
  const userData = session?.user as {
    escritorioId?: string
    id?: string
  } | undefined
  const escritorioId = userData?.escritorioId
  const sessaoId = userData?.id ?? ''

  type UsuarioRow = {
    id: string
    nome: string
    email: string
    perfil: string
    area: string | null
    oab: string | null
    telefone: string | null
    ativo: boolean
    permissoes?: string[]
    createdAt: Date
  }

  let rawUsuarios: UsuarioRow[] = []
  try {
    rawUsuarios = await prisma.usuario.findMany({
      where: { escritorioId },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        nome: true,
        email: true,
        perfil: true,
        area: true,
        oab: true,
        telefone: true,
        ativo: true,
        permissoes: true,
        createdAt: true,
      },
    })
  } catch {
    const sem = await prisma.usuario.findMany({
      where: { escritorioId },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        nome: true,
        email: true,
        perfil: true,
        area: true,
        oab: true,
        telefone: true,
        ativo: true,
        createdAt: true,
      },
    })
    rawUsuarios = sem.map(u => ({ ...u, permissoes: [] as string[] }))
  }

  const usuariosMapeados = rawUsuarios.map((u) => ({
    ...u,
    perfil: u.perfil as string,
    area: u.area as string | null,
    permissoes: (u.permissoes ?? []) as string[],
    createdAt: u.createdAt.toISOString(),
  }))

  return (
    <div className="page-enter p-8">
      <UsuariosClient
        usuarios={usuariosMapeados}
        sessaoId={sessaoId}
        perfilLabels={perfilLabels}
        areaLabels={areaLabels}
      />
    </div>
  )
}
