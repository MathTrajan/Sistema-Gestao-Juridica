import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import TarefasClientV2 from '@/components/tarefas/TarefasClientV2'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

export default async function TarefasV2Page() {
  const session = await auth()
  const userData = session?.user as { escritorioId?: string } | undefined
  const escritorioId = userData?.escritorioId

  const tarefasRaw = await prisma.tarefa
    .findMany({
      where: { escritorioId },
      orderBy: [{ prioridade: 'desc' }, { dataVencimento: 'asc' }],
      include: {
        responsavel: { select: { id: true, nome: true } },
        processo: { select: { id: true, numero: true, cliente: { select: { nomeCompleto: true } } } },
        prazo: { select: { id: true, titulo: true } },
      },
    })
    .catch(() => [])

  const tarefas = tarefasRaw.map((t) => ({
    id: t.id,
    titulo: t.titulo,
    descricao: t.descricao,
    status: t.status as string,
    prioridade: t.prioridade as string,
    dataVencimento: t.dataVencimento ? t.dataVencimento.toISOString() : null,
    createdAt: t.createdAt.toISOString(),
    responsavel: t.responsavel ? { id: t.responsavel.id, nome: t.responsavel.nome } : null,
    processo: t.processo ? { id: t.processo.id, numero: t.processo.numero, cliente: t.processo.cliente } : null,
    prazo: t.prazo ? { id: t.prazo.id, titulo: t.prazo.titulo } : null,
  }))

  return (
    <div className="page-enter px-6 py-8 xl:px-10">
      <TarefasClientV2 tarefas={tarefas} />
    </div>
  )
}
