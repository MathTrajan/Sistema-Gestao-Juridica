import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function PUT(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  if (session.user.perfil !== 'GESTOR_GERAL') {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }

  const escritorioId = session.user.escritorioId
  const body = await req.json()

  try {
    await prisma.escritorio.update({
      where: { id: escritorioId },
      data: {
        nome: body.nome,
        cnpj: body.cnpj || null,
        email: body.email || null,
        telefone: body.telefone || null,
        endereco: body.endereco || null,
        oab: body.oab || null,
      },
    })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
