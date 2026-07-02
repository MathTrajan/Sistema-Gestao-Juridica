import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { apiJsonResponse, apiErrorResponse } from '@/lib/api-helpers'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const session = await auth()
  if (!session) return apiErrorResponse('Não autorizado', 401)

  const escritorioId = session.user.escritorioId
  const { searchParams } = new URL(req.url)
  const clienteId = searchParams.get('clienteId')
  const processoId = searchParams.get('processoId')

  try {
    const documentos = await prisma.documento.findMany({
      where: clienteId
        ? { clienteId, cliente: { escritorioId } }
        : processoId
          ? { processoId, processo: { escritorioId } }
          : { OR: [{ cliente: { escritorioId } }, { processo: { escritorioId } }] },
      orderBy: { createdAt: 'desc' },
    })

    return apiJsonResponse(documentos.map(d => ({
      id: d.id,
      nome: d.nome,
      tipo: d.tipo,
      url: d.url,
      tamanho: d.tamanho,
      createdAt: d.createdAt.toISOString(),
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

  const nome = body.nome ? String(body.nome).trim() : ''
  const url = body.url ? String(body.url).trim() : ''
  if (!nome) return apiErrorResponse('Nome obrigatório', 400)
  if (!url) return apiErrorResponse('URL obrigatória', 400)
  if (!body.clienteId && !body.processoId) return apiErrorResponse('clienteId ou processoId obrigatório', 400)

  try {
    if (body.clienteId) {
      const c = await prisma.cliente.findFirst({ where: { id: body.clienteId, escritorioId }, select: { id: true } })
      if (!c) return apiErrorResponse('Cliente não encontrado', 404)
    }
    if (body.processoId) {
      const p = await prisma.processo.findFirst({ where: { id: body.processoId, escritorioId }, select: { id: true } })
      if (!p) return apiErrorResponse('Processo não encontrado', 404)
    }

    const documento = await prisma.documento.create({
      data: {
        nome,
        url,
        tipo: body.tipo ? String(body.tipo).trim() : null,
        tamanho: body.tamanho ? Number(body.tamanho) : null,
        clienteId: body.clienteId || null,
        processoId: body.processoId || null,
      },
    })

    return apiJsonResponse({
      id: documento.id,
      nome: documento.nome,
      tipo: documento.tipo,
      url: documento.url,
      tamanho: documento.tamanho,
      createdAt: documento.createdAt.toISOString(),
    })
  } catch (err) {
    console.error(err)
    return apiErrorResponse('Erro interno', 500)
  }
}
