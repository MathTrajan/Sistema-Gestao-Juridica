import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { apiJsonResponse, apiErrorResponse } from '@/lib/api-helpers'

export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ id: string; andamentoId: string }> }
) {
  const session = await auth()
  if (!session) return apiErrorResponse('Não autorizado', 401)

  const { id, andamentoId } = await params
  const escritorioId = session.user.escritorioId

  try {
    const processo = await prisma.processo.findFirst({
      where: { id, escritorioId },
      select: { id: true },
    })
    if (!processo) return apiErrorResponse('Processo não encontrado', 404)

    const andamento = await prisma.andamento.findFirst({
      where: { id: andamentoId, processoId: id },
      select: { id: true },
    })
    if (!andamento) return apiErrorResponse('Andamento não encontrado', 404)

    await prisma.andamento.delete({ where: { id: andamentoId } })
    return apiJsonResponse({ success: true })
  } catch (err) {
    console.error(err)
    return apiErrorResponse('Erro interno', 500)
  }
}
