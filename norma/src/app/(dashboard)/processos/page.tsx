import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import ProcessosClient from '@/components/processos/ProcessosClient'

export default async function ProcessosPage() {
  const session = await auth()
  const userData = session?.user as (typeof session.user & { escritorioId?: string }) | undefined
  const escritorioId = userData?.escritorioId

  const processos = await prisma.processo
    .findMany({
      where: { escritorioId },
      orderBy: { createdAt: 'desc' },
      include: {
        cliente: { select: { id: true, nomeCompleto: true } },
        responsavel: { select: { nome: true } },
        _count: { select: { prazos: true, tarefas: true } },
      },
    })
    .catch(() => [])

  return (
    <div className="page-enter px-6 py-8 xl:px-10">
      <ProcessosClient processos={processos} />
    </div>
  )
}
