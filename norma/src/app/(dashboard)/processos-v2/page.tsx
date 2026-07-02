import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import ProcessosClientV2 from '@/components/processos/ProcessosClientV2'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

export default async function ProcessosV2Page() {
  const session = await auth()
  const userData = session?.user as { escritorioId?: string } | undefined
  const escritorioId = userData?.escritorioId

  const processosRaw = await prisma.processo
    .findMany({
      where: { escritorioId },
      orderBy: { createdAt: 'desc' },
      include: {
        cliente: { select: { id: true, nomeCompleto: true } },
        responsavel: { select: { nome: true } },
        _count: { select: { prazos: true, tarefas: true } },
        prazos: {
          where: { status: 'ABERTO' },
          orderBy: { dataFinal: 'asc' },
          take: 1,
          select: { id: true, titulo: true, dataFinal: true, tipo: true },
        },
        tarefas: {
          where: { status: { in: ['A_FAZER', 'EM_ANDAMENTO'] } },
          orderBy: { dataVencimento: 'asc' },
          take: 3,
          select: { id: true, titulo: true, dataVencimento: true, status: true, prioridade: true },
        },
      },
    })
    .catch(() => [])

  const processos = processosRaw.map((p) => ({
    id: p.id,
    numero: p.numero,
    tipoAcao: p.tipoAcao,
    areaJuridica: p.areaJuridica,
    tribunal: p.tribunal,
    fase: p.fase,
    status: p.status,
    createdAt: p.createdAt.toISOString(),
    cliente: p.cliente,
    responsavel: p.responsavel,
    _count: p._count,
    proximoPrazo: p.prazos[0]
      ? {
          id: p.prazos[0].id,
          titulo: p.prazos[0].titulo,
          dataFinal: p.prazos[0].dataFinal.toISOString(),
          tipo: p.prazos[0].tipo as string,
        }
      : null,
    tarefasAbertas: p.tarefas.map((t) => ({
      id: t.id,
      titulo: t.titulo,
      status: t.status as string,
      prioridade: t.prioridade as string,
      dataVencimento: t.dataVencimento?.toISOString() ?? null,
    })),
  }))

  return (
    <div className="page-enter px-6 py-8 xl:px-10">
      <ProcessosClientV2 processos={processos} />
    </div>
  )
}
