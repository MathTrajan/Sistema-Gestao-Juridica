import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { apiJsonResponse, apiErrorResponse } from '@/lib/api-helpers'

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return apiErrorResponse('Não autorizado', 401)

  const { id } = await params
  const escritorioId = session.user.escritorioId

  try {
    const atendimento = await prisma.atendimento.findFirst({
      where: { id },
      include: {
        cliente: { select: { escritorioId: true } },
        lead: { select: { escritorioId: true } },
      },
    })

    if (!atendimento) return apiErrorResponse('Atendimento não encontrado', 404)

    const pertence =
      atendimento.cliente?.escritorioId === escritorioId ||
      atendimento.lead?.escritorioId === escritorioId

    if (!pertence) return apiErrorResponse('Não autorizado', 403)

    await prisma.atendimento.delete({ where: { id } })
    return apiJsonResponse({ success: true })
  } catch (err) {
    console.error(err)
    return apiErrorResponse('Erro interno', 500)
  }
}
