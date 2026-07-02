import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import PrazosClientV2 from '@/components/prazos/PrazosClientV2'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

export default async function PrazosV2Page() {
  const session = await auth()
  const userData = session?.user as { escritorioId?: string } | undefined
  const escritorioId = userData?.escritorioId

  const prazosRaw = await prisma.prazo
    .findMany({
      where: { processo: { escritorioId } },
      orderBy: { dataFinal: 'asc' },
      include: {
        processo: {
          select: {
            id: true,
            numero: true,
            cliente: { select: { nomeCompleto: true } },
          },
        },
        tarefas: {
          select: { id: true, titulo: true, status: true, dataVencimento: true },
          orderBy: { dataVencimento: 'asc' },
          take: 5,
        },
      },
    })
    .catch(() => [])

  const prazos = prazosRaw.map((p) => ({
    id: p.id,
    titulo: p.titulo,
    tipo: p.tipo as string,
    dataInicio: p.dataInicio.toISOString(),
    dataFinal: p.dataFinal.toISOString(),
    diasUteis: p.diasUteis,
    status: p.status as string,
    observacoes: p.observacoes,
    createdAt: p.createdAt.toISOString(),
    processo: {
      id: p.processo.id,
      numero: p.processo.numero,
      cliente: { nomeCompleto: p.processo.cliente.nomeCompleto },
    },
    tarefas: p.tarefas.map((t) => ({
      id: t.id,
      titulo: t.titulo,
      status: t.status as string,
      dataVencimento: t.dataVencimento?.toISOString() ?? null,
    })),
  }))

  return (
    <div className="page-enter px-6 py-8 xl:px-10">
      <PrazosClientV2 prazos={prazos} />
    </div>
  )
}
