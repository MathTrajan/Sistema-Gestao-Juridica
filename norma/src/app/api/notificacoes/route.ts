import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { apiJsonResponse, apiErrorResponse } from '@/lib/api-helpers'

export const dynamic = 'force-dynamic'

// Tipo unificado consumido pelo Topbar.
type NotifResponse = {
  id: string
  tipo: 'prazo' | 'tarefa' | 'datajud_movimentacao' | 'datajud_processo'
  titulo: string
  descricao: string
  urgente: boolean
  href: string
  // só presente em notificações persistidas (vindas da tabela Notificacao)
  persistida?: true
}

export async function GET() {
  const session = await auth()
  if (!session) return apiErrorResponse('Não autorizado', 401)

  const escritorioId = session.user.escritorioId
  const usuarioId = session.user.id
  const agora = new Date()
  const limite7dias = new Date(agora.getTime() + 7 * 24 * 60 * 60 * 1000)

  try {
    const [prazosProximos, tarefasVencidas, notificacoesPersistidas] =
      await Promise.all([
        // Notificações derivadas: prazos próximos
        prisma.prazo.findMany({
          where: {
            processo: { escritorioId },
            status: 'ABERTO',
            dataFinal: { lte: limite7dias },
          },
          orderBy: { dataFinal: 'asc' },
          take: 10,
          include: {
            processo: {
              select: {
                numero: true,
                cliente: { select: { nomeCompleto: true } },
              },
            },
          },
        }),
        // Notificações derivadas: tarefas vencidas
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
        // Notificações persistidas (DataJud, etc) — não lidas, do escritório,
        // visíveis para todos do escritório (usuarioId null) ou direcionadas ao usuário
        prisma.notificacao.findMany({
          where: {
            escritorioId,
            lida: false,
            OR: [{ usuarioId: null }, { usuarioId }],
          },
          orderBy: { createdAt: 'desc' },
          take: 20,
        }),
      ])

    const notificacoes: NotifResponse[] = [
      ...prazosProximos.map<NotifResponse>((p) => {
        const dias = Math.ceil(
          (p.dataFinal.getTime() - agora.getTime()) / (1000 * 60 * 60 * 24)
        )
        return {
          id: `prazo-${p.id}`,
          tipo: 'prazo',
          titulo: p.titulo,
          descricao: `${p.processo.cliente.nomeCompleto} — vence em ${dias <= 0 ? 'hoje' : `${dias}d`}`,
          urgente: dias <= 2,
          href: '/prazos',
        }
      }),
      ...tarefasVencidas.map<NotifResponse>((t) => ({
        id: `tarefa-${t.id}`,
        tipo: 'tarefa',
        titulo: t.titulo,
        descricao: `Venceu em ${new Date(t.dataVencimento!).toLocaleDateString('pt-BR')}`,
        urgente: true,
        href: '/tarefas',
      })),
      ...notificacoesPersistidas.map<NotifResponse>((n) => ({
        id: `notif-${n.id}`,
        tipo:
          n.tipo === 'DATAJUD_PROCESSO_DESCOBERTO'
            ? 'datajud_processo'
            : 'datajud_movimentacao',
        titulo: n.titulo,
        descricao: n.descricao ?? '',
        urgente: n.urgente,
        href: n.link ?? '/dashboard',
        persistida: true,
      })),
    ]

    return apiJsonResponse(notificacoes)
  } catch (err) {
    console.error(err)
    return apiErrorResponse('Erro interno', 500)
  }
}
