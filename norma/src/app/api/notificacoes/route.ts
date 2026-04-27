import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const escritorioId = session.user.escritorioId
  const agora = new Date()
  const limite7dias = new Date(agora.getTime() + 7 * 24 * 60 * 60 * 1000)

  try {
    const [prazosProximos, tarefasVencidas] = await Promise.all([
      prisma.prazo.findMany({
        where: {
          processo: { escritorioId },
          status: 'ABERTO',
          dataFinal: { lte: limite7dias },
        },
        orderBy: { dataFinal: 'asc' },
        take: 10,
        include: {
          processo: { select: { numero: true, cliente: { select: { nomeCompleto: true } } } },
        },
      }),
      prisma.tarefa.findMany({
        where: {
          escritorioId,
          status: { in: ['A_FAZER', 'EM_ANDAMENTO'] },
          dataVencimento: { lt: agora },
        },
        orderBy: { dataVencimento: 'asc' },
        take: 10,
        include: { responsavel: { select: { nome: true } } },
      }),
    ])

    const notificacoes = [
      ...prazosProximos.map(p => {
        const dias = Math.ceil((p.dataFinal.getTime() - agora.getTime()) / (1000 * 60 * 60 * 24))
        return {
          id: `prazo-${p.id}`,
          tipo: 'prazo' as const,
          titulo: p.titulo,
          descricao: `${p.processo.cliente.nomeCompleto} — vence em ${dias <= 0 ? 'hoje' : `${dias}d`}`,
          urgente: dias <= 2,
          href: '/prazos',
        }
      }),
      ...tarefasVencidas.map(t => ({
        id: `tarefa-${t.id}`,
        tipo: 'tarefa' as const,
        titulo: t.titulo,
        descricao: `Venceu em ${new Date(t.dataVencimento!).toLocaleDateString('pt-BR')}`,
        urgente: true,
        href: '/tarefas',
      })),
    ]

    return NextResponse.json(notificacoes)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
