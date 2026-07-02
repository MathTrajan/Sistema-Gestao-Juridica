import { prisma } from '@/lib/prisma'
import { apiJsonResponse, apiErrorResponse } from '@/lib/api-helpers'
import { buscarProcessoDataJud } from '@/lib/datajud'

// Vercel chama este endpoint via cron (vercel.json) às 06:00 UTC diariamente.
// O header Authorization: Bearer <CRON_SECRET> protege contra chamadas externas.
//
// Sincroniza movimentações de TODOS os processos ativos do escritório.
// Para cada movimentação nova, cria Notificacao(DATAJUD_MOVIMENTACAO).
export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return apiErrorResponse('Não autorizado', 401)
  }

  const apiKey = process.env.DATAJUD_API_KEY
  if (!apiKey || apiKey === 'COLOQUE_SUA_CHAVE_AQUI') {
    return apiErrorResponse('DATAJUD_API_KEY não configurada', 503)
  }

  const processos = await prisma.processo.findMany({
    where: {
      numero: { not: null },
      tribunal: { not: null },
      status: {
        in: [
          'EM_ANDAMENTO',
          'AGUARDANDO_PECA',
          'AGUARDANDO_CLIENTE',
          'SUSPENSO',
        ],
      },
    },
    select: {
      id: true,
      numero: true,
      tribunal: true,
      lastSyncAt: true,
      escritorioId: true,
      cliente: { select: { nomeCompleto: true } },
    },
  })

  const resultado = {
    processados: 0,
    novosTotal: 0,
    erros: 0,
  }

  for (const processo of processos) {
    // Pula processos sincronizados há menos de 20 horas
    if (processo.lastSyncAt) {
      const horasSinceSync =
        (Date.now() - processo.lastSyncAt.getTime()) / 1000 / 3600
      if (horasSinceSync < 20) continue
    }

    try {
      const dados = await buscarProcessoDataJud(
        processo.numero!,
        processo.tribunal!,
        apiKey
      )

      if (!dados) continue

      const existentes = await prisma.movimentacao.findMany({
        where: { processoId: processo.id, fonte: 'DATAJUD' },
        select: { codigoExterno: true },
      })
      const codigosExistentes = new Set(
        existentes.map((m) => m.codigoExterno).filter(Boolean)
      )

      const novas = dados.movimentos.filter(
        (m) => !codigosExistentes.has(String(m.codigo))
      )

      if (novas.length > 0) {
        await prisma.movimentacao.createMany({
          data: novas.map((m) => ({
            processoId: processo.id,
            data: new Date(m.dataHora),
            descricao:
              m.complementos.length > 0
                ? `${m.nome} — ${m.complementos.join(', ')}`
                : m.nome,
            tipo: m.nome,
            fonte: 'DATAJUD',
            codigoExterno: String(m.codigo),
          })),
        })

        // Cria notificação resumindo as novas movimentações
        const ultima = novas[0]
        await prisma.notificacao.create({
          data: {
            escritorioId: processo.escritorioId,
            tipo: 'DATAJUD_MOVIMENTACAO',
            titulo:
              novas.length === 1
                ? `Nova movimentação: ${processo.numero}`
                : `${novas.length} novas movimentações: ${processo.numero}`,
            descricao: `${processo.cliente.nomeCompleto} — ${ultima.nome}`,
            link: `/processos/${processo.id}`,
            metadata: {
              processoId: processo.id,
              numeroCNJ: processo.numero,
              quantidade: novas.length,
            },
          },
        })
      }

      await prisma.processo.update({
        where: { id: processo.id },
        data: { lastSyncAt: new Date() },
      })

      resultado.processados++
      resultado.novosTotal += novas.length
    } catch {
      resultado.erros++
    }
  }

  return apiJsonResponse(resultado)
}
