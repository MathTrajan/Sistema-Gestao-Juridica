import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { apiJsonResponse, apiErrorResponse } from '@/lib/api-helpers'
import { STATUS_TAREFA, PRIORIDADES } from '@/lib/constants'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await auth()
  if (!session) return apiErrorResponse('Não autorizado', 401)

  const escritorioId = session.user.escritorioId

  try {
    const tarefas = await prisma.tarefa.findMany({
      where: { escritorioId },
      orderBy: [{ prioridade: 'desc' }, { dataVencimento: 'asc' }],
      include: {
        responsavel: { select: { id: true, nome: true } },
        criador: { select: { id: true, nome: true } },
        processo: { select: { id: true, numero: true } },
        prazo: { select: { id: true, titulo: true } },
      },
    })

    return apiJsonResponse(tarefas.map(t => ({
      id: t.id,
      titulo: t.titulo,
      descricao: t.descricao,
      status: t.status,
      prioridade: t.prioridade,
      dataVencimento: t.dataVencimento ? t.dataVencimento.toISOString() : null,
      dataConclusao: t.dataConclusao ? t.dataConclusao.toISOString() : null,
      responsavel: t.responsavel ?? null,
      criador: t.criador ?? null,
      processo: t.processo ?? null,
      prazoId: t.prazoId,
      prazo: t.prazo ?? null,
    })))
  } catch (err) {
    console.error(err)
    return apiErrorResponse('Erro interno', 500)
  }
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session) return apiErrorResponse('Não autorizado', 401)

  const escritorioId = session.user.escritorioId
  const body = await req.json()

  if (!body.titulo?.trim()) {
    return apiErrorResponse('Título é obrigatório', 400)
  }

  try {
    if (body.processoId) {
      const processo = await prisma.processo.findFirst({
        where: { id: body.processoId, escritorioId },
        select: { id: true },
      })
      if (!processo) {
        return apiErrorResponse('Processo inválido', 400)
      }
    }

    if (body.prazoId) {
      const prazo = await prisma.prazo.findFirst({
        where: {
          id: body.prazoId,
          processo: { escritorioId },
          ...(body.processoId ? { processoId: body.processoId } : {}),
        },
        select: { id: true },
      })
      if (!prazo) {
        return apiErrorResponse('Prazo inválido', 400)
      }
    }

    const tarefa = await prisma.tarefa.create({
      data: {
        titulo: String(body.titulo).trim(),
        descricao: body.descricao || null,
        status: STATUS_TAREFA.includes(body.status) ? body.status : 'A_FAZER',
        prioridade: PRIORIDADES.includes(body.prioridade) ? body.prioridade : 'NORMAL',
        dataVencimento: body.dataVencimento ? new Date(body.dataVencimento) : null,
        escritorioId,
        responsavelId: body.responsavelId || null,
        criadorId: session.user.id,
        processoId: body.processoId || null,
        prazoId: body.prazoId || null,
      },
    })
    return apiJsonResponse(tarefa, { status: 201 })
  } catch (err) {
    console.error(err)
    return apiErrorResponse('Erro interno', 500)
  }
}
