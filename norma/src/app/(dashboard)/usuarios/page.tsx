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
  const escritorioId = (session?.user as any)?.escritorioId
  const sessaoId = (session?.user as any)?.id

  const usuarios = await prisma.usuario.findMany({
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

  const usuariosMapeados = usuarios.map(u => ({
    ...u,
    perfil: u.perfil as string,
    area: u.area as string | null,
    createdAt: u.createdAt.toISOString(),
  }))

  return (
    <div className="p-8">
      <UsuariosClient
        usuarios={usuariosMapeados}
        sessaoId={sessaoId}
        perfilLabels={perfilLabels}
        areaLabels={areaLabels}
      />
    </div>
  )
}