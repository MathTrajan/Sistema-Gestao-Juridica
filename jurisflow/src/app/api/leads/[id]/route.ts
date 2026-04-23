import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ETAPAS_FUNIL, TEMPERATURAS } from '@/lib/constants'

export const dynamic = 'force-dynamic'

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { id } = await params
  const escritorioId = session.user.escritorioId
  const body = await req.json()

  try {
    const data: Record<string, unknown> = {}
    if (body.nome !== undefined) data.nome = String(body.nome).trim()
    if (body.email !== undefined) data.email = body.email || null
    if (body.telefone !== undefined) data.telefone = body.telefone || null
    if (body.areaInteresse !== undefined) data.areaInteresse = body.areaInteresse || null
    if (body.origem !== undefined) data.origem = body.origem || null
    if (body.etapa !== undefined && ETAPAS_FUNIL.includes(body.etapa)) data.etapa = body.etapa
    if (body.temperatura !== undefined && TEMPERATURAS.includes(body.temperatura)) data.temperatura = body.temperatura
    if (body.observacoes !== undefined) data.observacoes = body.observacoes || null
    if (body.valorEstimado !== undefined) {
      const v = Number(body.valorEstimado)
      data.valorEstimado = !isNaN(v) ? v : null
    }
    if (body.dataContato !== undefined) data.dataContato = body.dataContato ? new Date(body.dataContato) : null

    await prisma.lead.updateMany({ where: { id, escritorioId }, data })
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
    await prisma.lead.deleteMany({ where: { id, escritorioId } })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
