import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { apiJsonResponse, apiErrorResponse } from '@/lib/api-helpers'

export const dynamic = 'force-dynamic'

// PATCH — atualiza um advogado monitorado
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return apiErrorResponse('Não autorizado', 401)

  const { id } = await params
  const escritorioId = session.user.escritorioId

  const existente = await prisma.advogadoMonitorado.findFirst({
    where: { id, escritorioId },
  })
  if (!existente) return apiErrorResponse('Advogado monitorado não encontrado', 404)

  const body = await req.json().catch(() => ({}))
  const data: Record<string, unknown> = {}

  if (typeof body.nome === 'string') data.nome = body.nome.trim() || null
  if (Array.isArray(body.tribunais)) {
    const tribunais = body.tribunais
      .map((t: unknown) => String(t).trim())
      .filter(Boolean)
    if (tribunais.length === 0)
      return apiErrorResponse('Selecione ao menos um tribunal', 400)
    data.tribunais = tribunais
  }
  if (typeof body.ativo === 'boolean') data.ativo = body.ativo

  const atualizado = await prisma.advogadoMonitorado.update({
    where: { id },
    data,
  })

  return apiJsonResponse(atualizado)
}

// DELETE — remove um advogado monitorado
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return apiErrorResponse('Não autorizado', 401)

  const { id } = await params
  const escritorioId = session.user.escritorioId

  const existente = await prisma.advogadoMonitorado.findFirst({
    where: { id, escritorioId },
  })
  if (!existente) return apiErrorResponse('Advogado monitorado não encontrado', 404)

  await prisma.advogadoMonitorado.delete({ where: { id } })

  return apiJsonResponse({ ok: true })
}
