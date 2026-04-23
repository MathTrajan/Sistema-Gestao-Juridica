import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { AREAS_JURIDICAS, TIPOS_PROCESSO, FASES_PROCESSO, STATUS_PROCESSO } from '@/lib/constants'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const escritorioId = session.user.escritorioId

  try {
    const processos = await prisma.processo.findMany({
      where: { escritorioId },
      orderBy: { createdAt: 'desc' },
      include: {
        cliente: { select: { id: true, nomeCompleto: true } },
        responsavel: { select: { id: true, nome: true } },
        _count: { select: { tarefas: true, prazos: true } },
      },
    })
    return NextResponse.json(processos)
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

  try {
    const processo = await prisma.processo.create({
      data: {
        numero: body.numero ? String(body.numero).trim() : null,
        tribunal: body.tribunal ? String(body.tribunal).trim() : null,
        vara: body.vara ? String(body.vara).trim() : null,
        comarca: body.comarca ? String(body.comarca).trim() : null,
        tipoAcao: body.tipoAcao ? String(body.tipoAcao).trim() : null,
        areaJuridica: AREAS_JURIDICAS.includes(body.areaJuridica) ? body.areaJuridica : null,
        tipo: TIPOS_PROCESSO.includes(body.tipo) ? body.tipo : 'JUDICIAL',
        fase: FASES_PROCESSO.includes(body.fase) ? body.fase : 'CONHECIMENTO',
        status: STATUS_PROCESSO.includes(body.status) ? body.status : 'EM_ANDAMENTO',
        dataDistribuicao: body.dataDistribuicao ? new Date(body.dataDistribuicao) : null,
        valorCausa: body.valorCausa != null ? Number(body.valorCausa) : null,
        observacoes: body.observacoes ? String(body.observacoes).trim() : null,
        clienteId: body.clienteId,
        responsavelId: body.responsavelId || null,
        escritorioId,
      },
    })
    return NextResponse.json(processo, { status: 201 })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
