import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { TIPOS_LANCAMENTO, STATUS_PAGAMENTO } from '@/lib/constants'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const escritorioId = session.user.escritorioId

  try {
    const lancamentos = await prisma.lancamento.findMany({
      where: { escritorioId },
      orderBy: { dataVencimento: 'desc' },
      include: {
        cliente: { select: { id: true, nomeCompleto: true } },
      },
    })

    return NextResponse.json(lancamentos.map(l => ({
      ...l,
      valor: Number(l.valor),
      dataVencimento: l.dataVencimento.toISOString(),
      dataPagamento: l.dataPagamento?.toISOString() ?? null,
      createdAt: l.createdAt.toISOString(),
      updatedAt: l.updatedAt.toISOString(),
    })))
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const escritorioId = session.user.escritorioId
  const body = await req.json()

  const valor = Number(body.valor)
  if (isNaN(valor) || valor <= 0) {
    return NextResponse.json({ error: 'Valor inválido' }, { status: 400 })
  }

  const dataVencimento = new Date(body.dataVencimento)
  if (isNaN(dataVencimento.getTime())) {
    return NextResponse.json({ error: 'Data de vencimento inválida' }, { status: 400 })
  }

  try {
    const lancamento = await prisma.lancamento.create({
      data: {
        descricao: String(body.descricao || '').trim(),
        tipo: TIPOS_LANCAMENTO.includes(body.tipo) ? body.tipo : 'ENTRADA',
        categoria: body.categoria ? String(body.categoria).trim() : null,
        valor,
        dataVencimento,
        dataPagamento: body.dataPagamento ? new Date(body.dataPagamento) : null,
        status: STATUS_PAGAMENTO.includes(body.status) ? body.status : 'PENDENTE',
        observacoes: body.observacoes ? String(body.observacoes).trim() : null,
        escritorioId,
        clienteId: body.clienteId || null,
      },
    })
    return NextResponse.json(lancamento, { status: 201 })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
