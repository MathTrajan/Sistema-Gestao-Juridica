import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import FinanceiroClient from '@/components/financeiro/FinanceiroClient'

export const dynamic = 'force-dynamic'

export default async function FinanceiroPage() {
  const session = await auth()
  const escritorioId = (session?.user as any)?.escritorioId

  const [lancamentosRaw, clientes] = await Promise.all([
    prisma.lancamento.findMany({
      where: { escritorioId },
      orderBy: { dataVencimento: 'desc' },
      include: {
        cliente: { select: { id: true, nomeCompleto: true } },
      },
    }),
    prisma.cliente.findMany({
      where: { escritorioId },
      orderBy: { nomeCompleto: 'asc' },
      select: { id: true, nomeCompleto: true },
    }),
  ])

  const lancamentos = lancamentosRaw.map(l => ({
    id: l.id,
    descricao: l.descricao,
    tipo: l.tipo as string,
    categoria: l.categoria,
    valor: Number(l.valor),
    dataVencimento: l.dataVencimento.toISOString(),
    dataPagamento: l.dataPagamento?.toISOString() ?? null,
    status: l.status as string,
    observacoes: l.observacoes,
    clienteId: l.clienteId,
    cliente: l.cliente,
    createdAt: l.createdAt.toISOString(),
  }))

  return (
    <div className="p-8">
      <FinanceiroClient lancamentos={lancamentos} clientes={clientes} />
    </div>
  )
}