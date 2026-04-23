import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import ProcessoForm from '@/components/processos/ProcessoForm'

export default async function NovoProcessoPage({
  searchParams,
}: {
  searchParams: { clienteId?: string }
}) {
  const session = await auth()
  const escritorioId = (session?.user as any)?.escritorioId

  const clientes = await prisma.cliente.findMany({
    where: { escritorioId },
    orderBy: { nomeCompleto: 'asc' },
    select: { id: true, nomeCompleto: true },
  })

  const usuarios = await prisma.usuario.findMany({
    where: { escritorioId, ativo: true },
    select: { id: true, nome: true },
  })

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Novo Processo</h1>
        <p className="text-gray-500 text-sm mt-1">Cadastre um novo processo judicial ou administrativo</p>
      </div>
      <ProcessoForm
        clientes={clientes}
        usuarios={usuarios}
        clienteIdInicial={searchParams.clienteId}
      />
    </div>
  )
}