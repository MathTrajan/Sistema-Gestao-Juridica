import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import LancamentoForm from '@/components/financeiro/LancamentoForm'

export default async function EditarLancamentoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  const escritorioId = (session?.user as any)?.escritorioId

  const [lancamento, clientes] = await Promise.all([
    prisma.lancamento.findFirst({
      where: { id, escritorioId },
    }),
    prisma.cliente.findMany({
      where: { escritorioId },
      orderBy: { nomeCompleto: 'asc' },
      select: { id: true, nomeCompleto: true },
    }),
  ])

  if (!lancamento) notFound()

  const initialData = {
    descricao: lancamento.descricao,
    tipo: lancamento.tipo as string,
    categoria: lancamento.categoria ?? '',
    valor: String(Number(lancamento.valor)),
    dataVencimento: lancamento.dataVencimento.toISOString().slice(0, 10),
    dataPagamento: lancamento.dataPagamento ? lancamento.dataPagamento.toISOString().slice(0, 10) : '',
    status: lancamento.status as string,
    observacoes: lancamento.observacoes ?? '',
    clienteId: lancamento.clienteId ?? '',
    recorrente: lancamento.recorrente,
  }

  return (
    <div className="page-enter px-6 py-8 xl:px-10">
      <div className="mb-8">
        <p className="text-[10px] uppercase tracking-[0.36em] text-slate-500 mb-1">Financeiro</p>
        <h1 className="text-2xl font-bold text-foreground">Editar Lançamento</h1>
        <p className="text-muted-foreground text-sm mt-1">{lancamento.descricao}</p>
      </div>
      <LancamentoForm lancamentoId={id} initialData={initialData} clientes={clientes} />
    </div>
  )
}
