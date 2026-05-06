import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import TarefaForm from '@/components/tarefas/TarefaForm'

export default async function NovaTarefaPage({
  searchParams,
}: {
  searchParams: { processoId?: string }
}) {
  const session = await auth()
  const escritorioId = (session?.user as any)?.escritorioId

  const [processos, usuarios, prazos] = await Promise.all([
    prisma.processo.findMany({
      where: { escritorioId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        numero: true,
        cliente: { select: { nomeCompleto: true } },
      },
    }),
    prisma.usuario.findMany({
      where: { escritorioId, ativo: true },
      select: { id: true, nome: true },
    }),
    prisma.prazo.findMany({
      where: { processo: { escritorioId } },
      orderBy: { dataFinal: 'asc' },
      select: {
        id: true,
        titulo: true,
        dataFinal: true,
        processoId: true,
      },
    }),
  ])

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Nova Tarefa</h1>
        <p className="text-gray-500 text-sm mt-1">Crie e atribua uma tarefa à equipe</p>
      </div>
      <TarefaForm
        processos={processos}
        usuarios={usuarios}
        prazos={prazos.map(p => ({ ...p, dataFinal: p.dataFinal.toISOString() }))}
        processoIdInicial={searchParams.processoId}
      />
    </div>
  )
}