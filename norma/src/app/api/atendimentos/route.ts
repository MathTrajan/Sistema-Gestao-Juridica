import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { apiJsonResponse, apiErrorResponse } from '@/lib/api-helpers'

export const dynamic = 'force-dynamic'

const TIPOS = ['REUNIAO', 'LIGACAO', 'EMAIL', 'WHATSAPP', 'PRESENCIAL', 'OUTRO']

export async function GET(req: Request) {
  const session = await auth()
  if (!session) return apiErrorResponse('Não autorizado', 401)

  const escritorioId = session.user.escritorioId
  const { searchParams } = new URL(req.url)
  const clienteId = searchParams.get('clienteId')
  const leadId = searchParams.get('leadId')

  try {
    const atendimentos = await prisma.atendimento.findMany({
      where: clienteId
        ? { clienteId, cliente: { escritorioId } }
        : leadId
          ? { leadId, lead: { escritorioId } }
          : { OR: [{ cliente: { escritorioId } }, { lead: { escritorioId } }] },
      orderBy: { data: 'desc' },
      include: {
        usuario: { select: { id: true, nome: true } },
      },
    })

    return apiJsonResponse(atendimentos.map(a => ({
      id: a.id,
      tipo: a.tipo,
      descricao: a.descricao,
      data: a.data.toISOString(),
      createdAt: a.createdAt.toISOString(),
      usuario: a.usuario ? { id: a.usuario.id, nome: a.usuario.nome } : null,
    })))
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

  const descricao = body.descricao ? String(body.descricao).trim() : ''
  if (!descricao) return apiErrorResponse('Descrição obrigatória', 400)
  if (!body.clienteId && !body.leadId) return apiErrorResponse('clienteId ou leadId obrigatório', 400)

  try {
    if (body.clienteId) {
      const c = await prisma.cliente.findFirst({ where: { id: body.clienteId, escritorioId }, select: { id: true } })
      if (!c) return apiErrorResponse('Cliente não encontrado', 404)
    }
    if (body.leadId) {
      const l = await prisma.lead.findFirst({ where: { id: body.leadId, escritorioId }, select: { id: true } })
      if (!l) return apiErrorResponse('Lead não encontrado', 404)
    }

    const atendimento = await prisma.atendimento.create({
      data: {
        tipo: TIPOS.includes(body.tipo) ? body.tipo : 'OUTRO',
        descricao,
        data: body.data ? new Date(body.data) : new Date(),
        clienteId: body.clienteId || null,
        leadId: body.leadId || null,
        usuarioId: session.user.id || null,
      },
      include: { usuario: { select: { id: true, nome: true } } },
    })

    return apiJsonResponse({
      id: atendimento.id,
      tipo: atendimento.tipo,
      descricao: atendimento.descricao,
      data: atendimento.data.toISOString(),
      createdAt: atendimento.createdAt.toISOString(),
      usuario: atendimento.usuario ? { id: atendimento.usuario.id, nome: atendimento.usuario.nome } : null,
    })
  } catch (err) {
    console.error(err)
    return apiErrorResponse('Erro interno', 500)
  }
}
