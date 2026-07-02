import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { apiJsonResponse, apiErrorResponse } from '@/lib/api-helpers'
import { TIPOS_PRAZO, STATUS_PRAZO } from '@/lib/constants'

async function getPrazoComEscritorio(id: string) {
  return prisma.prazo.findFirst({
    where: { id },
    include: { processo: { select: { escritorioId: true } } },
  })
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return apiErrorResponse('Não autorizado', 401)

  const { id } = await params
  const escritorioId = session.user.escritorioId
  const body = await req.json()

  try {
    const prazo = await getPrazoComEscritorio(id)
    if (!prazo || prazo.processo.escritorioId !== escritorioId) {
      return apiErrorResponse('Não encontrado', 404)
    }

    const data: Record<string, unknown> = {}
    let novaDataInicio = prazo.dataInicio
    let novaDataFinal = prazo.dataFinal

    if (body.titulo !== undefined) data.titulo = String(body.titulo).trim()
    if (body.tipo !== undefined && (TIPOS_PRAZO as readonly string[]).includes(body.tipo)) data.tipo = body.tipo
    if (body.dataInicio !== undefined) {
      const d = new Date(body.dataInicio)
      if (!isNaN(d.getTime())) { data.dataInicio = d; novaDataInicio = d }
    }
    if (body.dataFinal !== undefined) {
      const d = new Date(body.dataFinal)
      if (!isNaN(d.getTime())) { data.dataFinal = d; novaDataFinal = d }
    }

    if (novaDataFinal < novaDataInicio) {
      return apiErrorResponse('Data final não pode ser anterior à data de início', 400)
    }

    if (body.diasUteis !== undefined) data.diasUteis = body.diasUteis ? parseInt(body.diasUteis) : null
    if (body.status !== undefined && (STATUS_PRAZO as readonly string[]).includes(body.status)) data.status = body.status
    if (body.observacoes !== undefined) data.observacoes = body.observacoes ? String(body.observacoes).trim() : null

    await prisma.prazo.update({ where: { id }, data })
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
    const prazo = await getPrazoComEscritorio(id)
    if (!prazo || prazo.processo.escritorioId !== escritorioId) {
      return apiErrorResponse('Não encontrado', 404)
    }

    await prisma.prazo.delete({ where: { id } })
    return apiJsonResponse({ success: true })
  } catch (err) {
    console.error(err)
    return apiErrorResponse('Erro interno', 500)
  }
}
