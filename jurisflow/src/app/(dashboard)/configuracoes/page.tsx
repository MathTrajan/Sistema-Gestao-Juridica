import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import ConfiguracoesClient from '@/components/configuracoes/ConfiguracoesClient'

export const dynamic = 'force-dynamic'

export default async function ConfiguracoesPage() {
  const session = await auth()
  const escritorioId = (session?.user as any)?.escritorioId

  const escritorio = await prisma.escritorio.findFirst({
    where: { id: escritorioId },
  })

  return (
    <div className="p-8">
      <ConfiguracoesClient escritorio={escritorio ? {
        ...escritorio,
        plano: escritorio.plano as string,
        createdAt: escritorio.createdAt.toISOString(),
        updatedAt: escritorio.updatedAt.toISOString(),
      } : null} />
    </div>
  )
}