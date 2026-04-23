import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { TIPOS_PRAZO, STATUS_PRAZO } from '@/lib/constants'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const escritorioId = session.user.escritorioId

  try {
    const prazos = await prisma.prazo.findMany({
      where: { processo: { escritorioId } },
      orderBy: { dataFinal: 'asc' },
      include: {
        processo: {
          select: {
            id: true,
            numero: true,
            cliente: { select: { nomeCompleto: true } },
          },
        },
      },
    })
    return NextResponse.json(prazos)
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

  const dataInicio = new Date(body.dataInicio)
  const dataFinal = new Date(body.dataFinal)

  if (isNaN(dataInicio.getTime()) || isNaN(dataFinal.getTime())) {
    return NextResponse.json({ error: 'Datas inválidas' }, { status: 400 })
  }

  if (!body.titulo?.trim()) {
    return NextResponse.json({ error: 'Título é obrigatório' }, { status: 400 })
  }

  try {
    const processo = await prisma.processo.findFirst({
      where: { id: body.processoId, escritorioId },
      select: { id: true },
    })

    if (!processo) {
      return NextResponse.json({ error: 'Processo não encontrado' }, { status: 404 })
    }

    const prazo = await prisma.prazo.create({
      data: {
        titulo: String(body.titulo).trim(),
        tipo: TIPOS_PRAZO.includes(body.tipo) ? body.tipo : 'OUTRO',
        dataInicio,
        dataFinal,
        diasUteis: body.diasUteis ? parseInt(body.diasUteis) : null,
        status: STATUS_PRAZO.includes(body.status) ? body.status : 'ABERTO',
        observacoes: body.observacoes ? String(body.observacoes).trim() : null,
        processoId: processo.id,
      },
    })
    return NextResponse.json(prazo, { status: 201 })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
