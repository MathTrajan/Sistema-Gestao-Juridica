import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { PERFIS_USUARIO, AREAS_USUARIO } from '@/lib/constants'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const escritorioId = session.user.escritorioId

  try {
    const usuarios = await prisma.usuario.findMany({
      where: { escritorioId },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        nome: true,
        email: true,
        perfil: true,
        area: true,
        oab: true,
        telefone: true,
        ativo: true,
        createdAt: true,
      },
    })
    return NextResponse.json(usuarios)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  if (session.user.perfil !== 'GESTOR_GERAL' && session.user.perfil !== 'GERENTE') {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }

  const escritorioId = session.user.escritorioId
  const body = await req.json()

  if (!body.nome || !body.email || !body.senha) {
    return NextResponse.json({ error: 'Nome, e-mail e senha são obrigatórios' }, { status: 400 })
  }

  if (typeof body.senha !== 'string' || body.senha.length < 8) {
    return NextResponse.json({ error: 'Senha deve ter ao menos 8 caracteres' }, { status: 400 })
  }

  try {
    const existe = await prisma.usuario.findFirst({
      where: { email: body.email, escritorioId },
    })

    if (existe) {
      return NextResponse.json({ error: 'E-mail já cadastrado' }, { status: 400 })
    }

    const senhaHash = await bcrypt.hash(body.senha, 10)

    const usuario = await prisma.usuario.create({
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
        id: true,
        nome: true,
        email: true,
        perfil: true,
        area: true,
        ativo: true,
      },
    })
    return NextResponse.json(usuario, { status: 201 })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
