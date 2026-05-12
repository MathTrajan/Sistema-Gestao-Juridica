import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { apiJsonResponse, apiErrorResponse } from '@/lib/api-helpers'

// Marca uma Notificacao persistida como lida. O id recebido é o id real
// da tabela (sem o prefixo "notif-" usado no Topbar).
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return apiErrorResponse('Não autorizado', 401)

  const { id } = await params
  const escritorioId = session.user.escritorioId

  const notif = await prisma.notificacao.findFirst({
    where: { id, escritorioId },
  })
  if (!notif) return apiErrorResponse('Notificação não encontrada', 404)

  await prisma.notificacao.update({
    where: { id },
    data: { lida: true, lidaAt: new Date() },
  })

  return apiJsonResponse({ ok: true })
}
