import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const escritorioId = session.user.escritorioId

  try {
    const [
      tarefasPendentes,
      processosSemResponsavel,
      prazosProximos,
      clientesDocPendente,
      processosRecentes,
    ] = await Promise.all([
      prisma.tarefa.findMany({
        where: { escritorioId, status: { in: ['A_FAZER', 'EM_ANDAMENTO'] } },
        orderBy: [{ prioridade: 'desc' }, { dataVencimento: 'asc' }],
        take: 10,
        include: {
          responsavel: { select: { nome: true } },
          processo: { select: { numero: true, cliente: { select: { nomeCompleto: true } } } },
        },
      }),
      prisma.processo.count({
        where: { escritorioId, responsavelId: null, status: 'EM_ANDAMENTO' },
      }),
      prisma.prazo.findMany({
        where: {
          processo: { escritorioId },
          status: 'ABERTO',
          dataFinal: { lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
        },
        orderBy: { dataFinal: 'asc' },
        take: 10,
        include: {
          processo: {
            select: { numero: true, cliente: { select: { nomeCompleto: true } } },
          },
        },
      }),
      prisma.cliente.findMany({
        where: { escritorioId, status: 'DOCUMENTACAO_PENDENTE' },
        select: { id: true, nomeCompleto: true, areaJuridica: true, createdAt: true },
      }),
      prisma.processo.findMany({
        where: { escritorioId },
        orderBy: { createdAt: 'desc' },
        take: 8,
        include: {
          cliente: { select: { nomeCompleto: true } },
          responsavel: { select: { nome: true } },
          _count: { select: { tarefas: true, prazos: true } },
        },
      }),
    ])

    return NextResponse.json({
      tarefasPendentes: tarefasPendentes.map(t => ({
        ...t,
        dataVencimento: t.dataVencimento?.toISOString() ?? null,
        createdAt: t.createdAt.toISOString(),
        updatedAt: t.updatedAt.toISOString(),
      })),
      processosSemResponsavel,
      prazosProximos: prazosProximos.map(p => ({
        ...p,
        dataInicio: p.dataInicio.toISOString(),
        dataFinal: p.dataFinal.toISOString(),
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
      })),
      clientesDocPendente: clientesDocPendente.map(c => ({
        ...c,
        createdAt: c.createdAt.toISOString(),
      })),
      processosRecentes: processosRecentes.map(p => ({
        ...p,
        dataDistribuicao: p.dataDistribuicao?.toISOString() ?? null,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
      })),
    })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
