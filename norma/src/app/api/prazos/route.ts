import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { apiJsonResponse, apiErrorResponse } from '@/lib/api-helpers'
import { TIPOS_PRAZO, STATUS_PRAZO } from '@/lib/constants'

export async function GET(req: Request) {
  const session = await auth()
  if (!session) return apiErrorResponse('Não autorizado', 401)

  const escritorioId = session.user.escritorioId
  const { searchParams } = new URL(req.url)
  const processoId = searchParams.get('processoId')?.trim()

  try {
    const prazos = await prisma.prazo.findMany({
      where: {
        processo: { escritorioId },
        ...(processoId ? { processoId } : {}),
      },
      orderBy: { dataFinal: 'asc' },
      include: {
        processo: {
          select: {
            id: true,
            numero: true,
            cliente: { select: { nomeCompleto: true } },
          },
        },
      },
    })
    return apiJsonResponse(prazos)
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

  const dataInicio = new Date(body.dataInicio)
  const dataFinal = new Date(body.dataFinal)

  if (isNaN(dataInicio.getTime()) || isNaN(dataFinal.getTime())) {
    return apiErrorResponse('Datas inválidas', 400)
  }

  if (dataFinal < dataInicio) {
    return apiErrorResponse('Data final não pode ser anterior à data de início', 400)
  }

  try {
    const processo = await prisma.processo.findFirst({
      where: { id: body.processoId, escritorioId },
      select: { id: true },
    })

    if (!processo) {
      return apiErrorResponse('Processo não encontrado', 404)
    }

    const prazo = await prisma.prazo.create({
      data: {
        titulo: String(body.titulo).trim(),
        tipo: TIPOS_PRAZO.includes(body.tipo) ? body.tipo : 'OUTRO',
        dataInicio,
        dataFinal,
        diasUteis: body.diasUteis ? parseInt(body.diasUteis) : null,
        status: STATUS_PRAZO.includes(body.status) ? body.status : 'ABERTO',
        observacoes: body.observacoes ? String(body.observacoes).trim() : null,
        processoId: processo.id,
      },
    })
    return apiJsonResponse(prazo, { status: 201 })
  } catch (err) {
    console.error(err)
    return apiErrorResponse('Erro interno', 500)
  }
}
