import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { apiJsonResponse, apiErrorResponse } from '@/lib/api-helpers'
import { guardArea } from '@/lib/permissions'
import { ETAPAS_FUNIL, TEMPERATURAS } from '@/lib/constants'

export const dynamic = 'force-dynamic'

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return apiErrorResponse('Não autorizado', 401)

  const blocked = guardArea(session.user, 'COMERCIAL')
  if (blocked) return blocked

  const { id } = await params
  const escritorioId = session.user.escritorioId
  const body = await req.json()

  try {
    const data: Record<string, unknown> = {}
    if (body.nome !== undefined) data.nome = String(body.nome).trim()
    if (body.email !== undefined) data.email = body.email || null
    if (body.telefone !== undefined) data.telefone = body.telefone || null
    if (body.areaInteresse !== undefined) data.areaInteresse = body.areaInteresse || null
    if (body.origem !== undefined) data.origem = body.origem || null
    if (body.etapa !== undefined && ETAPAS_FUNIL.includes(body.etapa)) data.etapa = body.etapa
    if (body.temperatura !== undefined && TEMPERATURAS.includes(body.temperatura)) data.temperatura = body.temperatura
    if (body.observacoes !== undefined) data.observacoes = body.observacoes || null
    if (body.valorEstimado !== undefined) {
      const v = Number(body.valorEstimado)
      data.valorEstimado = !isNaN(v) ? v : null
    }
    if (body.dataContato !== undefined) data.dataContato = body.dataContato ? new Date(body.dataContato) : null
    if (body.clienteId !== undefined) data.clienteId = body.clienteId || null

    await prisma.lead.updateMany({ where: { id, escritorioId }, data })
    return apiJsonResponse({ success: true })
  } catch (err) {
    console.error(err)
    return apiErrorResponse('Erro interno', 500)
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return apiErrorResponse('Não autorizado', 401)

  const blocked = guardArea(session.user, 'COMERCIAL')
  if (blocked) return blocked

  const { id } = await params
  const escritorioId = session.user.escritorioId

  try {
    // Deletar atendimentos do lead antes de excluí-lo
    await prisma.$transaction([
      prisma.atendimento.deleteMany({ where: { leadId: id } }),
      prisma.lead.deleteMany({ where: { id, escritorioId } }),
    ])
    return apiJsonResponse({ success: true })
  } catch (err) {
    console.error(err)
    return apiErrorResponse('Erro interno', 500)
  }
}
