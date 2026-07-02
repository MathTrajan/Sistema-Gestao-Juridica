import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import ComercialClientV2 from '@/components/comercial/ComercialClientV2'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

export default async function ComercialV2Page() {
  const session = await auth()
  const escritorioId = (session?.user as { escritorioId?: string } | undefined)?.escritorioId

  const leadsRaw = await prisma.lead.findMany({
    where: { escritorioId },
    orderBy: { createdAt: 'desc' },
    include: { cliente: { select: { id: true, nomeCompleto: true } } },
  }).catch(() => [])

  const leads = leadsRaw.map((l) => ({
    id: l.id,
    nome: l.nome,
    email: l.email,
    telefone: l.telefone,
    areaInteresse: l.areaInteresse as string | null,
    origem: l.origem as string | null,
    etapa: l.etapa as string,
    temperatura: l.temperatura as string,
    observacoes: l.observacoes,
    valorEstimado: l.valorEstimado ? Number(l.valorEstimado) : null,
    dataContato: l.dataContato?.toISOString() ?? null,
    clienteId: l.clienteId,
    cliente: l.cliente,
    createdAt: l.createdAt.toISOString(),
  }))

  return (
    <div className="page-enter px-6 py-8 xl:px-10">
      <ComercialClientV2 leads={leads} />
    </div>
  )
}
