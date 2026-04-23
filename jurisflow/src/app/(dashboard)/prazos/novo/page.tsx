import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import PrazoForm from '@/components/prazos/PrazoForm'

export default async function NovoPrazoPage({
  searchParams,
}: {
  searchParams: { processoId?: string }
}) {
  const session = await auth()
  const escritorioId = (session?.user as any)?.escritorioId

  const processos = await prisma.processo.findMany({
    where: { escritorioId },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      numero: true,
      cliente: { select: { nomeCompleto: true } },
    },
  })

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Novo Prazo</h1>
        <p className="text-gray-500 text-sm mt-1">Cadastre um prazo processual</p>
      </div>
      <PrazoForm processos={processos} processoIdInicial={searchParams.processoId} />
    </div>
  )
}