import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { apiJsonResponse, apiErrorResponse } from '@/lib/api-helpers'

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return apiErrorResponse('Não autorizado', 401)

  const { id } = await params
  const escritorioId = session.user.escritorioId

  try {
    const doc = await prisma.documento.findFirst({
      where: { id },
      include: {
        cliente: { select: { escritorioId: true } },
        processo: { select: { escritorioId: true } },
      },
    })

    if (!doc) return apiErrorResponse('Documento não encontrado', 404)

    const pertence =
      doc.cliente?.escritorioId === escritorioId ||
      doc.processo?.escritorioId === escritorioId

    if (!pertence) return apiErrorResponse('Não autorizado', 403)

    await prisma.documento.delete({ where: { id } })
    return apiJsonResponse({ success: true })
  } catch (err) {
    console.error(err)
    return apiErrorResponse('Erro interno', 500)
  }
}
