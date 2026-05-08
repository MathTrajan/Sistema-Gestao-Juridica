import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import LancamentoForm from '@/components/financeiro/LancamentoForm'

export default async function NovoLancamentoPage() {
  const session = await auth()
  const escritorioId = (session?.user as any)?.escritorioId

  const clientes = await prisma.cliente.findMany({
    where: { escritorioId },
    orderBy: { nomeCompleto: 'asc' },
    select: { id: true, nomeCompleto: true },
  })

  return (
    <div className="page-enter px-6 py-8 xl:px-10">
      <div className="mb-8">
        <p className="text-[10px] uppercase tracking-[0.36em] text-slate-500 mb-1">Financeiro</p>
        <h1 className="text-2xl font-bold text-foreground">Novo Lançamento</h1>
        <p className="text-muted-foreground text-sm mt-1">Registre uma receita ou despesa</p>
      </div>
      <LancamentoForm clientes={clientes} />
    </div>
  )
}
