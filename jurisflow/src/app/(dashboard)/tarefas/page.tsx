import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import KanbanBoard from '@/components/tarefas/KanbanBoard'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

export default async function TarefasPage() {
  const session = await auth()
  const escritorioId = (session?.user as any)?.escritorioId

  const tarefasRaw = await prisma.tarefa.findMany({
    where: { escritorioId },
    orderBy: [{ prioridade: 'desc' }, { dataVencimento: 'asc' }],
    include: {
      responsavel: { select: { id: true, nome: true } },
      processo: { select: { id: true, numero: true } },
    },
  })

  const tarefas = tarefasRaw.map(t => ({
    id: t.id,
    titulo: t.titulo,
    descricao: t.descricao,
    status: t.status as string,
    prioridade: t.prioridade as string,
    dataVencimento: t.dataVencimento ? t.dataVencimento.toISOString() : null,
    responsavel: t.responsavel ? { id: t.responsavel.id, nome: t.responsavel.nome } : null,
    processo: t.processo ? { id: t.processo.id, numero: t.processo.numero } : null,
  }))

  return (
    <div className="p-8">
      <KanbanBoard tarefasIniciais={tarefas} />
    </div>
  )
}