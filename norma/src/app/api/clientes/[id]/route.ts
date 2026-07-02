import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { apiJsonResponse, apiErrorResponse } from '@/lib/api-helpers'
import { AREAS_JURIDICAS, ORIGENS_CLIENTE, STATUS_CLIENTE, TIPOS_CLIENTE } from '@/lib/constants'

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return apiErrorResponse('Não autorizado', 401)

  const { id } = await params
  const escritorioId = session.user.escritorioId

  try {
    const cliente = await prisma.cliente.findFirst({
      where: { id, escritorioId },
      include: {
        processos: { orderBy: { createdAt: 'desc' } },
        lancamentos: { orderBy: { createdAt: 'desc' }, take: 5 },
        atendimentos: { orderBy: { createdAt: 'desc' }, take: 5 },
        documentos: true,
        _count: { select: { processos: true } },
      },
    })

    if (!cliente) return apiErrorResponse('Cliente não encontrado', 404)
    return apiJsonResponse(cliente)
  } catch (err) {
    console.error(err)
    return apiErrorResponse('Erro interno', 500)
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return apiErrorResponse('Não autorizado', 401)

  const { id } = await params
  const escritorioId = session.user.escritorioId
  const body = await req.json()

  try {
    const data: Record<string, unknown> = {}
    if (body.nomeCompleto !== undefined) data.nomeCompleto = String(body.nomeCompleto).trim()
    if (body.tipo !== undefined && TIPOS_CLIENTE.includes(body.tipo)) data.tipo = body.tipo
    if (body.cpf !== undefined) data.cpf = body.cpf ? String(body.cpf).trim() : null
    if (body.rg !== undefined) data.rg = body.rg ? String(body.rg).trim() : null
    if (body.dataNascimento !== undefined) data.dataNascimento = body.dataNascimento ? new Date(body.dataNascimento) : null
    if (body.razaoSocial !== undefined) data.razaoSocial = body.razaoSocial ? String(body.razaoSocial).trim() : null
    if (body.cnpj !== undefined) data.cnpj = body.cnpj ? String(body.cnpj).trim() : null
    if (body.email !== undefined) data.email = body.email ? String(body.email).trim().toLowerCase() : null
    if (body.telefone !== undefined) data.telefone = body.telefone ? String(body.telefone).trim() : null
    if (body.whatsapp !== undefined) data.whatsapp = body.whatsapp ? String(body.whatsapp).trim() : null
    if (body.cep !== undefined) data.cep = body.cep ? String(body.cep).trim() : null
    if (body.logradouro !== undefined) data.logradouro = body.logradouro ? String(body.logradouro).trim() : null
    if (body.numero !== undefined) data.numero = body.numero ? String(body.numero).trim() : null
    if (body.complemento !== undefined) data.complemento = body.complemento ? String(body.complemento).trim() : null
    if (body.bairro !== undefined) data.bairro = body.bairro ? String(body.bairro).trim() : null
    if (body.cidade !== undefined) data.cidade = body.cidade ? String(body.cidade).trim() : null
    if (body.estado !== undefined) data.estado = body.estado ? String(body.estado).trim() : null
    if (body.areaJuridica !== undefined) data.areaJuridica = AREAS_JURIDICAS.includes(body.areaJuridica) ? body.areaJuridica : null
    if (body.origemCliente !== undefined) data.origemCliente = ORIGENS_CLIENTE.includes(body.origemCliente) ? body.origemCliente : null
    if (body.status !== undefined && STATUS_CLIENTE.includes(body.status)) data.status = body.status
    if (body.observacoes !== undefined) data.observacoes = body.observacoes ? String(body.observacoes).trim() : null
    if (body.valorContrato !== undefined) data.valorContrato = body.valorContrato != null ? Number(body.valorContrato) : null
    if (body.dataContrato !== undefined) data.dataContrato = body.dataContrato ? new Date(body.dataContrato) : null

    await prisma.cliente.updateMany({ where: { id, escritorioId }, data })
    return apiJsonResponse({ success: true })
  } catch (err) {
    console.error(err)
    return apiErrorResponse('Erro interno', 500)
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return apiErrorResponse('Não autorizado', 401)

  const { id } = await params
  const escritorioId = session.user.escritorioId

  try {
    const cliente = await prisma.cliente.findFirst({
      where: { id, escritorioId },
      select: {
        _count: { select: { processos: true, lancamentos: true } },
      },
    })
    if (!cliente) return apiErrorResponse('Cliente não encontrado', 404)

    if (cliente._count.processos > 0) {
      const n = cliente._count.processos
      return apiErrorResponse(
        `Este cliente possui ${n} processo${n > 1 ? 's' : ''} vinculado${n > 1 ? 's' : ''}. Inative-o ao invés de excluir.`,
        409
      )
    }

    if (cliente._count.lancamentos > 0) {
      const n = cliente._count.lancamentos
      return apiErrorResponse(
        `Este cliente possui ${n} lançamento${n > 1 ? 's' : ''} financeiro${n > 1 ? 's' : ''} vinculado${n > 1 ? 's' : ''}. Inative-o ao invés de excluir.`,
        409
      )
    }

    await prisma.$transaction([
      prisma.atendimento.deleteMany({ where: { clienteId: id } }),
      prisma.documento.deleteMany({ where: { clienteId: id } }),
      prisma.cliente.deleteMany({ where: { id, escritorioId } }),
    ])
    return apiJsonResponse({ success: true })
  } catch (err) {
    console.error(err)
    return apiErrorResponse('Erro interno', 500)
  }
}
