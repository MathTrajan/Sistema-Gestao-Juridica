import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { apiJsonResponse, apiErrorResponse } from '@/lib/api-helpers'

export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ id: string; comentarioId: string }> }
) {
  const session = await auth()
  if (!session) return apiErrorResponse('Não autorizado', 401)

  const { id, comentarioId } = await params
  const escritorioId = session.user.escritorioId

  try {
    const tarefa = await prisma.tarefa.findFirst({
      where: { id, escritorioId },
      select: { id: true },
    })
    if (!tarefa) return apiErrorResponse('Tarefa não encontrada', 404)

    const comentario = await prisma.comentario.findFirst({
      where: { id: comentarioId, tarefaId: id },
      select: { id: true },
    })
    if (!comentario) return apiErrorResponse('Comentário não encontrado', 404)

    await prisma.comentario.delete({ where: { id: comentarioId } })
    return apiJsonResponse({ success: true })
  } catch (err) {
    console.error(err)
    return apiErrorResponse('Erro interno', 500)
  }
}
