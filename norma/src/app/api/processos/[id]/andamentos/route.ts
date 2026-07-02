import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { apiJsonResponse, apiErrorResponse } from '@/lib/api-helpers'

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return apiErrorResponse('Não autorizado', 401)

  const { id } = await params
  const escritorioId = session.user.escritorioId
  const body = await req.json()

  const texto = body.texto ? String(body.texto).trim() : ''
  if (!texto) return apiErrorResponse('Texto obrigatório', 400)

  try {
    const processo = await prisma.processo.findFirst({
      where: { id, escritorioId },
      select: { id: true },
    })
    if (!processo) return apiErrorResponse('Processo não encontrado', 404)

    const andamento = await prisma.andamento.create({
      data: {
        texto,
        data: body.data ? new Date(body.data) : new Date(),
        processoId: id,
      },
    })

    return apiJsonResponse(andamento)
  } catch (err) {
    console.error(err)
    return apiErrorResponse('Erro interno', 500)
  }
}
