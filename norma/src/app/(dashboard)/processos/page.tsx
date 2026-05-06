import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import ProcessosClient from '@/components/processos/ProcessosClient'

export default async function ProcessosPage() {
  const session = await auth()
  const escritorioId = (session?.user as any)?.escritorioId

  const processos = await prisma.processo.findMany({
    where: { escritorioId },
    orderBy: { createdAt: 'desc' },
    include: {
      cliente: { select: { id: true, nomeCompleto: true } },
      responsavel: { select: { nome: true } },
      _count: { select: { prazos: true, tarefas: true } },
    },
  })

  return (
    <div className="p-8">
      <ProcessosClient processos={processos} />
    </div>
  )
}