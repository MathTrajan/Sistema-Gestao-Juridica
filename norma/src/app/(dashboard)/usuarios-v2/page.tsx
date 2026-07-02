import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import UsuariosClientV2 from '@/components/usuarios/UsuariosClientV2'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

export default async function UsuariosV2Page() {
  const session = await auth()
  const userData = session?.user as { escritorioId?: string; id?: string } | undefined
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
    createdAt: Date
  }

  let raw: UsuarioRow[] = []
  try {
    raw = await prisma.usuario.findMany({
      where: { escritorioId },
      orderBy: { createdAt: 'asc' },
      select: { id: true, nome: true, email: true, perfil: true, area: true, oab: true, telefone: true, ativo: true, createdAt: true },
    })
  } catch {
    raw = []
  }

  const usuarios = raw.map((u) => ({
    ...u,
    perfil: u.perfil as string,
    area: u.area as string | null,
    createdAt: u.createdAt.toISOString(),
  }))

  return (
    <div className="page-enter px-6 py-8 xl:px-10">
      <UsuariosClientV2 usuarios={usuarios} sessaoId={sessaoId} />
    </div>
  )
}
