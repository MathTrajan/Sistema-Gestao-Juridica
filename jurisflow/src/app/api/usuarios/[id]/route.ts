import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { PERFIS_USUARIO, AREAS_USUARIO } from '@/lib/constants'

export const dynamic = 'force-dynamic'

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  if (session.user.perfil !== 'GESTOR_GERAL' && session.user.perfil !== 'GERENTE') {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }

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
    if (body.senha && typeof body.senha === 'string' && body.senha.length >= 8) {
      data.senha = await bcrypt.hash(body.senha, 10)
    }

    await prisma.usuario.updateMany({ where: { id, escritorioId }, data })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
