import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import ClientesClientV2 from '@/components/clientes/ClientesClientV2'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

export default async function ClientesV2Page() {
  const session = await auth()
  const userData = session?.user as { escritorioId?: string } | undefined
  const escritorioId = userData?.escritorioId

  const clientesRaw = await prisma.cliente
    .findMany({
      where: { escritorioId },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { processos: true } },
        processos: {
          select: { id: true, numero: true, status: true, areaJuridica: true },
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    })
    .catch(() => [])

  const clientes = clientesRaw.map((c) => ({
    id: c.id,
    nomeCompleto: c.nomeCompleto,
    tipo: c.tipo as string,
    cpf: c.cpf,
    cnpj: c.cnpj,
    email: c.email,
    telefone: c.telefone,
    status: c.status as string,
    areaJuridica: c.areaJuridica as string | null,
    createdAt: c.createdAt.toISOString(),
    _count: c._count,
    processos: c.processos.map((p) => ({
      id: p.id,
      numero: p.numero,
      status: p.status as string,
      areaJuridica: p.areaJuridica as string | null,
    })),
  }))

  return (
    <div className="page-enter px-6 py-8 xl:px-10">
      <ClientesClientV2 clientes={clientes} />
    </div>
  )
}
