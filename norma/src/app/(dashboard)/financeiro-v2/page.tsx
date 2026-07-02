import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import FinanceiroClientV2 from '@/components/financeiro/FinanceiroClientV2'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

export default async function FinanceiroV2Page() {
  const session = await auth()
  const escritorioId = (session?.user as { escritorioId?: string } | undefined)?.escritorioId

  const lancamentosRaw = await prisma.lancamento.findMany({
    where: { escritorioId },
    orderBy: { dataVencimento: 'desc' },
    include: { cliente: { select: { id: true, nomeCompleto: true } } },
  }).catch(() => [])

  const lancamentos = lancamentosRaw.map((l) => ({
    id: l.id,
    descricao: l.descricao,
    tipo: l.tipo as string,
    categoria: l.categoria,
    valor: Number(l.valor),
    dataVencimento: l.dataVencimento.toISOString(),
    dataPagamento: l.dataPagamento?.toISOString() ?? null,
    status: l.status as string,
    observacoes: l.observacoes,
    cliente: l.cliente,
    createdAt: l.createdAt.toISOString(),
  }))

  return (
    <div className="page-enter px-6 py-8 xl:px-10">
      <FinanceiroClientV2 lancamentos={lancamentos} />
    </div>
  )
}
