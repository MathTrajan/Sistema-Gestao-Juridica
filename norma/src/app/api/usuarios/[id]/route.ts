import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { apiJsonResponse, apiErrorResponse } from '@/lib/api-helpers'
import { guardGerenteOuSuperior } from '@/lib/permissions'
import bcrypt from 'bcryptjs'
import { PERFIS_USUARIO, AREAS_USUARIO } from '@/lib/constants'

export const dynamic = 'force-dynamic'

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return apiErrorResponse('Não autorizado', 401)

  const blocked = guardGerenteOuSuperior(session.user)
  if (blocked) return blocked

  const { id } = await params
  const escritorioId = session.user.escritorioId
  const body = await req.json()

  try {
    const data: Record<string, unknown> = {}
    if (body.nome !== undefined) data.nome = String(body.nome).trim()
    if (body.perfil !== undefined && PERFIS_USUARIO.includes(body.perfil)) data.perfil = body.perfil
    if (body.area !== undefined) data.area = AREAS_USUARIO.includes(body.area) ? body.area : null
    if (body.oab !== undefined) data.oab = body.oab ? String(body.oab).trim() : null
    if (body.telefone !== undefined) data.telefone = body.telefone ? String(body.telefone).trim() : null
    if (body.ativo !== undefined) data.ativo = Boolean(body.ativo)
    if (body.permissoes !== undefined && Array.isArray(body.permissoes)) {
      data.permissoes = body.permissoes.filter((p: unknown) => typeof p === 'string')
    }
    if (body.senha && typeof body.senha === 'string' && body.senha.length >= 8) {
      data.senha = await bcrypt.hash(body.senha, 10)
    }

    // Tenta atualizar com permissoes; se a coluna ainda não existir, remove do payload
    try {
      await prisma.usuario.updateMany({ where: { id, escritorioId }, data })
    } catch {
      const { permissoes: _p, ...dataFallback } = data
      await prisma.usuario.updateMany({ where: { id, escritorioId }, data: dataFallback })
    }
    return apiJsonResponse({ success: true })
  } catch (err) {
    console.error(err)
    return apiErrorResponse('Erro interno', 500)
  }
}
