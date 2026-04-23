import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { STATUS_TAREFA, PRIORIDADES } from '@/lib/constants'

export const dynamic = 'force-dynamic'

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { id } = await params
  const escritorioId = session.user.escritorioId
  const body = await req.json()

  try {
    const data: Record<string, unknown> = {}
    if (body.titulo !== undefined) data.titulo = String(body.titulo).trim()
    if (body.descricao !== undefined) data.descricao = body.descricao ? String(body.descricao).trim() : null
    if (body.status !== undefined && STATUS_TAREFA.includes(body.status)) data.status = body.status
    if (body.prioridade !== undefined && PRIORIDADES.includes(body.prioridade)) data.prioridade = body.prioridade
    if (body.dataVencimento !== undefined) data.dataVencimento = body.dataVencimento ? new Date(body.dataVencimento) : null
    if (body.dataConclusao !== undefined) data.dataConclusao = body.dataConclusao ? new Date(body.dataConclusao) : null
    if (body.responsavelId !== undefined) data.responsavelId = body.responsavelId || null

    await prisma.tarefa.updateMany({ where: { id, escritorioId }, data })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { id } = await params
  const escritorioId = session.user.escritorioId

  try {
    await prisma.tarefa.deleteMany({ where: { id, escritorioId } })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
