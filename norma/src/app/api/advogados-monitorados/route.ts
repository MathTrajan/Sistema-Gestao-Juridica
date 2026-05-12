import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { apiJsonResponse, apiErrorResponse } from '@/lib/api-helpers'

export const dynamic = 'force-dynamic'

// GET — lista todos os advogados monitorados do escritório
export async function GET() {
  const session = await auth()
  if (!session) return apiErrorResponse('Não autorizado', 401)

  const escritorioId = session.user.escritorioId

  const itens = await prisma.advogadoMonitorado.findMany({
    where: { escritorioId },
    orderBy: [{ ativo: 'desc' }, { createdAt: 'desc' }],
    include: { usuario: { select: { id: true, nome: true } } },
  })

  return apiJsonResponse(itens)
}

// POST — cria um novo advogado monitorado
export async function POST(req: Request) {
  const session = await auth()
  if (!session) return apiErrorResponse('Não autorizado', 401)

  const escritorioId = session.user.escritorioId
  const usuarioId = session.user.id

  const body = await req.json().catch(() => ({}))
  const oab = String(body.oab ?? '').trim()
  const nome = body.nome ? String(body.nome).trim() : null
  const tribunais = Array.isArray(body.tribunais)
    ? body.tribunais.map((t: unknown) => String(t).trim()).filter(Boolean)
    : []
  const ativo = body.ativo !== false

  if (!oab) return apiErrorResponse('OAB é obrigatória', 400)
  if (tribunais.length === 0)
    return apiErrorResponse('Selecione ao menos um tribunal', 400)

  // Verifica duplicata por (escritorioId, oab)
  const existente = await prisma.advogadoMonitorado.findUnique({
    where: { escritorioId_oab: { escritorioId, oab } },
  })
  if (existente) {
    return apiErrorResponse(
      'Esta OAB já está sendo monitorada. Edite o cadastro existente.',
      409
    )
  }

  const criado = await prisma.advogadoMonitorado.create({
    data: { oab, nome, tribunais, ativo, escritorioId, usuarioId },
  })

  return apiJsonResponse(criado, { status: 201 })
}
