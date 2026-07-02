import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { apiJsonResponse, apiErrorResponse } from '@/lib/api-helpers'
import { AREAS_JURIDICAS, TIPOS_PROCESSO, FASES_PROCESSO, STATUS_PROCESSO } from '@/lib/constants'

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return apiErrorResponse('Não autorizado', 401)

  const { id } = await params
  const escritorioId = session.user.escritorioId

  try {
    const processo = await prisma.processo.findFirst({
      where: { id, escritorioId },
      include: {
        cliente: true,
        responsavel: { select: { id: true, nome: true } },
        tarefas: {
          orderBy: { createdAt: 'desc' },
          include: { responsavel: { select: { nome: true } } },
        },
        prazos: { orderBy: { dataFinal: 'asc' } },
        andamentos: { orderBy: { data: 'desc' } },
        movimentacoes: { orderBy: { data: 'desc' }, take: 10 },
        documentos: true,
      },
    })

    if (!processo) return apiErrorResponse('Não encontrado', 404)
    return apiJsonResponse(processo)
  } catch (err) {
    console.error(err)
    return apiErrorResponse('Erro interno', 500)
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return apiErrorResponse('Não autorizado', 401)

  const { id } = await params
  const escritorioId = session.user.escritorioId
  const body = await req.json()

  try {
    const data: Record<string, unknown> = {}
    if (body.numero !== undefined) data.numero = body.numero ? String(body.numero).trim() : null
    if (body.tribunal !== undefined) data.tribunal = body.tribunal ? String(body.tribunal).trim() : null
    if (body.vara !== undefined) data.vara = body.vara ? String(body.vara).trim() : null
    if (body.comarca !== undefined) data.comarca = body.comarca ? String(body.comarca).trim() : null
    if (body.tipoAcao !== undefined) data.tipoAcao = body.tipoAcao ? String(body.tipoAcao).trim() : null
    if (body.areaJuridica !== undefined) data.areaJuridica = AREAS_JURIDICAS.includes(body.areaJuridica) ? body.areaJuridica : null
    if (body.tipo !== undefined && TIPOS_PROCESSO.includes(body.tipo)) data.tipo = body.tipo
    if (body.fase !== undefined && FASES_PROCESSO.includes(body.fase)) data.fase = body.fase
    if (body.status !== undefined && STATUS_PROCESSO.includes(body.status)) data.status = body.status
    if (body.dataDistribuicao !== undefined) data.dataDistribuicao = body.dataDistribuicao ? new Date(body.dataDistribuicao) : null
    if (body.valorCausa !== undefined) data.valorCausa = body.valorCausa != null ? Number(body.valorCausa) : null
    if (body.observacoes !== undefined) data.observacoes = body.observacoes ? String(body.observacoes).trim() : null
    if (body.responsavelId !== undefined) data.responsavelId = body.responsavelId || null

    await prisma.processo.updateMany({ where: { id, escritorioId }, data })
    return apiJsonResponse({ success: true })
  } catch (err) {
    console.error(err)
    return apiErrorResponse('Erro interno', 500)
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return apiErrorResponse('Não autorizado', 401)

  const { id } = await params
  const escritorioId = session.user.escritorioId

  try {
    const processo = await prisma.processo.findFirst({
      where: { id, escritorioId },
      select: { id: true },
    })
    if (!processo) return apiErrorResponse('Processo não encontrado', 404)

    const tarefas = await prisma.tarefa.findMany({
      where: { processoId: id },
      select: { id: true },
    })
    const tarefaIds = tarefas.map(t => t.id)

    await prisma.$transaction([
      ...(tarefaIds.length > 0
        ? [prisma.comentario.deleteMany({ where: { tarefaId: { in: tarefaIds } } })]
        : []),
      prisma.tarefa.deleteMany({ where: { processoId: id } }),
      prisma.prazo.deleteMany({ where: { processoId: id } }),
      prisma.documento.deleteMany({ where: { processoId: id } }),
      prisma.andamento.deleteMany({ where: { processoId: id } }),
      prisma.movimentacao.deleteMany({ where: { processoId: id } }),
      prisma.processo.deleteMany({ where: { id, escritorioId } }),
    ])
    return apiJsonResponse({ success: true })
  } catch (err) {
    console.error(err)
    return apiErrorResponse('Erro interno', 500)
  }
}
