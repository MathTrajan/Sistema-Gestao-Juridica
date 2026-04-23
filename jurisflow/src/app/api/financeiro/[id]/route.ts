import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { TIPOS_LANCAMENTO, STATUS_PAGAMENTO } from '@/lib/constants'

export const dynamic = 'force-dynamic'

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { id } = await params
  const escritorioId = session.user.escritorioId
  const body = await req.json()

  try {
    const data: Record<string, unknown> = {}
    if (body.descricao !== undefined) data.descricao = String(body.descricao).trim()
    if (body.tipo !== undefined && TIPOS_LANCAMENTO.includes(body.tipo)) data.tipo = body.tipo
    if (body.categoria !== undefined) data.categoria = body.categoria ? String(body.categoria).trim() : null
    if (body.valor !== undefined) {
      const valor = Number(body.valor)
      if (!isNaN(valor) && valor > 0) data.valor = valor
    }
    if (body.dataVencimento !== undefined) {
      const d = new Date(body.dataVencimento)
      if (!isNaN(d.getTime())) data.dataVencimento = d
    }
    if (body.dataPagamento !== undefined) data.dataPagamento = body.dataPagamento ? new Date(body.dataPagamento) : null
    if (body.status !== undefined && STATUS_PAGAMENTO.includes(body.status)) data.status = body.status
    if (body.observacoes !== undefined) data.observacoes = body.observacoes ? String(body.observacoes).trim() : null
    if (body.clienteId !== undefined) data.clienteId = body.clienteId || null

    await prisma.lancamento.updateMany({ where: { id, escritorioId }, data })
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
    await prisma.lancamento.deleteMany({ where: { id, escritorioId } })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
