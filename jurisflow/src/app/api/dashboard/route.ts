import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const escritorioId = session.user.escritorioId

  try {
    const [
      totalClientes,
      totalProcessos,
      totalTarefas,
      prazosAbertos,
      clientesRecentes,
      tarefasPendentes,
    ] = await Promise.all([
      prisma.cliente.count({ where: { escritorioId, status: 'ATIVO' } }),
      prisma.processo.count({ where: { escritorioId, status: 'EM_ANDAMENTO' } }),
      prisma.tarefa.count({ where: { escritorioId, status: { in: ['A_FAZER', 'EM_ANDAMENTO'] } } }),
      prisma.prazo.count({ where: { processo: { escritorioId }, status: 'ABERTO' } }),
      prisma.cliente.findMany({
        where: { escritorioId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, nomeCompleto: true, areaJuridica: true, status: true, createdAt: true },
      }),
      prisma.tarefa.findMany({
        where: { escritorioId, status: { in: ['A_FAZER', 'EM_ANDAMENTO'] } },
        orderBy: [{ prioridade: 'desc' }, { dataVencimento: 'asc' }],
        take: 5,
        include: { responsavel: { select: { nome: true } } },
      }),
    ])

    return NextResponse.json({
      totalClientes,
      totalProcessos,
      totalTarefas,
      prazosAbertos,
      clientesRecentes,
      tarefasPendentes,
    })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
