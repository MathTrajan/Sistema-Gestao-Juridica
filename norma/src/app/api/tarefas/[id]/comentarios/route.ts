import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { apiJsonResponse, apiErrorResponse } from '@/lib/api-helpers'

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return apiErrorResponse('Não autorizado', 401)

  const { id } = await params
  const escritorioId = session.user.escritorioId

  try {
    const tarefa = await prisma.tarefa.findFirst({ where: { id, escritorioId }, select: { id: true } })
    if (!tarefa) return apiErrorResponse('Tarefa não encontrada', 404)

    const comentarios = await prisma.comentario.findMany({
      where: { tarefaId: id },
      orderBy: { createdAt: 'asc' },
      include: { usuario: { select: { id: true, nome: true } } },
    })

    return apiJsonResponse(comentarios.map(c => ({
      id: c.id,
      texto: c.texto,
      createdAt: c.createdAt.toISOString(),
      usuario: c.usuario ? { id: c.usuario.id, nome: c.usuario.nome } : null,
    })))
  } catch (err) {
    console.error(err)
    return apiErrorResponse('Erro interno', 500)
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return apiErrorResponse('Não autorizado', 401)

  const { id } = await params
  const escritorioId = session.user.escritorioId
  const body = await req.json()
  const texto = body.texto ? String(body.texto).trim() : ''
  if (!texto) return apiErrorResponse('Texto obrigatório', 400)

  try {
    const tarefa = await prisma.tarefa.findFirst({ where: { id, escritorioId }, select: { id: true } })
    if (!tarefa) return apiErrorResponse('Tarefa não encontrada', 404)

    const usuarioId = session.user.id ?? null

    const comentario = await prisma.comentario.create({
      data: { texto, tarefaId: id, usuarioId },
      include: { usuario: { select: { id: true, nome: true } } },
    })

    return apiJsonResponse({
      id: comentario.id,
      texto: comentario.texto,
      createdAt: comentario.createdAt.toISOString(),
      usuario: comentario.usuario ? { id: comentario.usuario.id, nome: comentario.usuario.nome } : null,
    })
  } catch (err) {
    console.error(err)
    return apiErrorResponse('Erro interno', 500)
  }
}
