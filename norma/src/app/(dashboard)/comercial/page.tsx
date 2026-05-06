import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import ComercialClient from '@/components/comercial/ComercialClient'

export const dynamic = 'force-dynamic'

export default async function ComercialPage() {
  const session = await auth()
  const escritorioId = (session?.user as any)?.escritorioId

  const leadsRaw = await prisma.lead.findMany({
    where: { escritorioId },
    orderBy: { createdAt: 'desc' },
    include: {
      cliente: { select: { id: true, nomeCompleto: true } },
    },
  })

  const leads = leadsRaw.map(l => ({
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
    <div className="p-8">
      <ComercialClient leads={leads} />
    </div>
  )
}