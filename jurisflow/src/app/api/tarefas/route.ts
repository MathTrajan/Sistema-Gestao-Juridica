import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { STATUS_TAREFA, PRIORIDADES } from '@/lib/constants'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const escritorioId = session.user.escritorioId

  try {
    const tarefas = await prisma.tarefa.findMany({
      where: { escritorioId },
      orderBy: [{ prioridade: 'desc' }, { dataVencimento: 'asc' }],
      include: {
        responsavel: { select: { id: true, nome: true } },
        processo: { select: { id: true, numero: true } },
      },
    })

    return NextResponse.json(tarefas.map(t => ({
      id: t.id,
      titulo: t.titulo,
      descricao: t.descricao,
      status: t.status,
      prioridade: t.prioridade,
      dataVencimento: t.dataVencimento ? t.dataVencimento.toISOString() : null,
      responsavel: t.responsavel ?? null,
      processo: t.processo ?? null,
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

  if (!body.titulo?.trim()) {
    return NextResponse.json({ error: 'Título é obrigatório' }, { status: 400 })
  }

  try {
    const tarefa = await prisma.tarefa.create({
      data: {
        titulo: String(body.titulo).trim(),
        descricao: body.descricao || null,
        status: STATUS_TAREFA.includes(body.status) ? body.status : 'A_FAZER',
        prioridade: PRIORIDADES.includes(body.prioridade) ? body.prioridade : 'NORMAL',
        dataVencimento: body.dataVencimento ? new Date(body.dataVencimento) : null,
        escritorioId,
        responsavelId: body.responsavelId || null,
        processoId: body.processoId || null,
      },
    })
    return NextResponse.json(tarefa, { status: 201 })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
