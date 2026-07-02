import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { apiJsonResponse, apiErrorResponse } from '@/lib/api-helpers'
import { guardGerenteOuSuperior } from '@/lib/permissions'
import bcrypt from 'bcryptjs'
import { PERFIS_USUARIO, AREAS_USUARIO } from '@/lib/constants'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await auth()
  if (!session) return apiErrorResponse('Não autorizado', 401)

  const blocked = guardGerenteOuSuperior(session.user)
  if (blocked) return blocked

  const escritorioId = session.user.escritorioId

  try {
    let usuarios: any[]
    try {
      usuarios = await prisma.usuario.findMany({
        where: { escritorioId },
        orderBy: { createdAt: 'asc' },
        select: {
          id: true, nome: true, email: true, perfil: true,
          area: true, oab: true, telefone: true, ativo: true,
          permissoes: true, createdAt: true,
        },
      })
    } catch {
      const sem = await prisma.usuario.findMany({
        where: { escritorioId },
        orderBy: { createdAt: 'asc' },
        select: {
          id: true, nome: true, email: true, perfil: true,
          area: true, oab: true, telefone: true, ativo: true,
          createdAt: true,
        },
      })
      usuarios = sem.map((u: any) => ({ ...u, permissoes: [] }))
    }
    return apiJsonResponse(usuarios)
  } catch (err) {
    console.error(err)
    return apiErrorResponse('Erro interno', 500)
  }
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session) return apiErrorResponse('Não autorizado', 401)

  const blocked = guardGerenteOuSuperior(session.user)
  if (blocked) return blocked

  const escritorioId = session.user.escritorioId
  const body = await req.json()

  if (!body.nome || !body.email || !body.senha) {
    return apiErrorResponse('Nome, e-mail e senha são obrigatórios', 400)
  }

  if (typeof body.senha !== 'string' || body.senha.length < 8) {
    return apiErrorResponse('Senha deve ter ao menos 8 caracteres', 400)
  }

  try {
    const existe = await prisma.usuario.findFirst({
      where: { email: body.email, escritorioId },
    })

    if (existe) {
      return apiErrorResponse('E-mail já cadastrado', 400)
    }

    const senhaHash = await bcrypt.hash(body.senha, 10)
    const permissoes = Array.isArray(body.permissoes)
      ? body.permissoes.filter((p: unknown) => typeof p === 'string')
      : []

    // Tenta criar com permissoes; se a coluna ainda não existir no DB, cria sem ela
    let usuario: any
    try {
      usuario = await prisma.usuario.create({
        data: {
          nome: String(body.nome).trim(),
          email: String(body.email).trim().toLowerCase(),
          senha: senhaHash,
          perfil: PERFIS_USUARIO.includes(body.perfil) ? body.perfil : 'COLABORADOR',
          area: AREAS_USUARIO.includes(body.area) ? body.area : null,
          oab: body.oab ? String(body.oab).trim() : null,
          telefone: body.telefone ? String(body.telefone).trim() : null,
          permissoes,
          escritorioId,
        },
        select: {
          id: true, nome: true, email: true, perfil: true,
          area: true, permissoes: true, ativo: true,
        },
      })
    } catch {
      usuario = await prisma.usuario.create({
        data: {
          nome: String(body.nome).trim(),
          email: String(body.email).trim().toLowerCase(),
          senha: senhaHash,
          perfil: PERFIS_USUARIO.includes(body.perfil) ? body.perfil : 'COLABORADOR',
          area: AREAS_USUARIO.includes(body.area) ? body.area : null,
          oab: body.oab ? String(body.oab).trim() : null,
          telefone: body.telefone ? String(body.telefone).trim() : null,
          escritorioId,
        },
        select: {
          id: true, nome: true, email: true, perfil: true,
          area: true, ativo: true,
        },
      })
      usuario = { ...usuario, permissoes: [] }
    }

    return apiJsonResponse(usuario, { status: 201 })
  } catch (err) {
    console.error(err)
    return apiErrorResponse('Erro interno', 500)
  }
}
