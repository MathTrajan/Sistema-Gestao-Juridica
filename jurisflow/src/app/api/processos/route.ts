import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { AREAS_JURIDICAS, TIPOS_PROCESSO, FASES_PROCESSO, STATUS_PROCESSO } from '@/lib/constants'

export async function GET(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const escritorioId = session.user.escritorioId
  const { searchParams } = new URL(req.url)

  // ?all=true bypasses pagination (used for dropdowns/selects)
  const all = searchParams.get('all') === 'true'
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10)))
  const search = searchParams.get('search')?.trim()
  const status = searchParams.get('status')?.trim()

  const where = {
    escritorioId,
    ...(status && STATUS_PROCESSO.includes(status) ? { status } : {}),
    ...(search
      ? {
          OR: [
            { numero: { contains: search, mode: 'insensitive' as const } },
            { tipoAcao: { contains: search, mode: 'insensitive' as const } },
            { cliente: { nomeCompleto: { contains: search, mode: 'insensitive' as const } } },
          ],
        }
      : {}),
  }

  try {
    if (all) {
      const processos = await prisma.processo.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          numero: true,
          cliente: { select: { nomeCompleto: true } },
        },
      })
      return NextResponse.json(processos)
    }

    const [processos, total] = await Promise.all([
      prisma.processo.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          cliente: { select: { id: true, nomeCompleto: true } },
          responsavel: { select: { id: true, nome: true } },
          _count: { select: { tarefas: true, prazos: true } },
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.processo.count({ where }),
    ])

    return NextResponse.json({
      data: processos,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    })
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
