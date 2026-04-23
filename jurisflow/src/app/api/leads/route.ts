import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ETAPAS_FUNIL, TEMPERATURAS } from '@/lib/constants'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const escritorioId = session.user.escritorioId

  try {
    const leads = await prisma.lead.findMany({
      where: { escritorioId },
      orderBy: { createdAt: 'desc' },
      include: {
        cliente: { select: { id: true, nomeCompleto: true } },
      },
    })

    return NextResponse.json(leads.map(l => ({
      ...l,
      valorEstimado: l.valorEstimado ? Number(l.valorEstimado) : null,
      dataContato: l.dataContato?.toISOString() ?? null,
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

  if (!body.nome?.trim()) {
    return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 })
  }

  try {
    const valorEstimado = body.valorEstimado != null ? Number(body.valorEstimado) : null

    const lead = await prisma.lead.create({
      data: {
        nome: String(body.nome).trim(),
        email: body.email || null,
        telefone: body.telefone || null,
        areaInteresse: body.areaInteresse || null,
        origem: body.origem || null,
        etapa: ETAPAS_FUNIL.includes(body.etapa) ? body.etapa : 'NOVO',
        temperatura: TEMPERATURAS.includes(body.temperatura) ? body.temperatura : 'MORNO',
        observacoes: body.observacoes || null,
        valorEstimado: valorEstimado !== null && !isNaN(valorEstimado) ? valorEstimado : null,
        dataContato: body.dataContato ? new Date(body.dataContato) : null,
        escritorioId,
      },
    })
    return NextResponse.json(lead, { status: 201 })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
