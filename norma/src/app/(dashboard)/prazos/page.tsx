import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import PrazosClient from '@/components/prazos/PrazosClient'

export const dynamic = 'force-dynamic'

export default async function PrazosPage() {
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
      },
    })
    .catch(() => [])

  const prazos = prazosRaw.map(p => ({
    id: p.id,
    titulo: p.titulo,
    tipo: p.tipo as string,
    dataInicio: p.dataInicio.toISOString(),
    dataFinal: p.dataFinal.toISOString(),
    diasUteis: p.diasUteis,
    status: p.status as string,
    observacoes: p.observacoes,
    processo: {
      id: p.processo.id,
      numero: p.processo.numero,
      cliente: { nomeCompleto: p.processo.cliente.nomeCompleto },
    },
  }))

  return (
    <div className="page-enter px-6 py-8 xl:px-10">
      <PrazosClient prazos={prazos} />
    </div>
  )
}
