import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { AREAS_JURIDICAS, ORIGENS_CLIENTE, STATUS_CLIENTE, TIPOS_CLIENTE } from '@/lib/constants'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const escritorioId = session.user.escritorioId

  try {
    const clientes = await prisma.cliente.findMany({
      where: { escritorioId },
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { processos: true } } },
    })
    return NextResponse.json(clientes)
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

  if (!body.nomeCompleto?.trim()) {
    return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 })
  }

  try {
    const cliente = await prisma.cliente.create({
      data: {
        nomeCompleto: String(body.nomeCompleto).trim(),
        tipo: TIPOS_CLIENTE.includes(body.tipo) ? body.tipo : 'PESSOA_FISICA',
        cpf: body.cpf ? String(body.cpf).trim() : null,
        rg: body.rg ? String(body.rg).trim() : null,
        dataNascimento: body.dataNascimento ? new Date(body.dataNascimento) : null,
        razaoSocial: body.razaoSocial ? String(body.razaoSocial).trim() : null,
        cnpj: body.cnpj ? String(body.cnpj).trim() : null,
        email: body.email ? String(body.email).trim().toLowerCase() : null,
        telefone: body.telefone ? String(body.telefone).trim() : null,
        whatsapp: body.whatsapp ? String(body.whatsapp).trim() : null,
        cep: body.cep ? String(body.cep).trim() : null,
        logradouro: body.logradouro ? String(body.logradouro).trim() : null,
        numero: body.numero ? String(body.numero).trim() : null,
        complemento: body.complemento ? String(body.complemento).trim() : null,
        bairro: body.bairro ? String(body.bairro).trim() : null,
        cidade: body.cidade ? String(body.cidade).trim() : null,
        estado: body.estado ? String(body.estado).trim() : null,
        areaJuridica: AREAS_JURIDICAS.includes(body.areaJuridica) ? body.areaJuridica : null,
        origemCliente: ORIGENS_CLIENTE.includes(body.origemCliente) ? body.origemCliente : null,
        status: STATUS_CLIENTE.includes(body.status) ? body.status : 'ATIVO',
        observacoes: body.observacoes ? String(body.observacoes).trim() : null,
        valorContrato: body.valorContrato != null ? Number(body.valorContrato) : null,
        dataContrato: body.dataContrato ? new Date(body.dataContrato) : null,
        escritorioId,
      },
    })
    return NextResponse.json(cliente, { status: 201 })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
