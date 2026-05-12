import { prisma } from '@/lib/prisma'
import { apiJsonResponse, apiErrorResponse } from '@/lib/api-helpers'
import { buscarProcessoDataJud } from '@/lib/datajud'

// Vercel chama este endpoint via cron (vercel.json) às 06:00 UTC diariamente.
// O header Authorization: Bearer <CRON_SECRET> protege contra chamadas externas.
export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return apiErrorResponse('Não autorizado', 401)
  }

  const apiKey = process.env.DATAJUD_API_KEY
  if (!apiKey || apiKey === 'COLOQUE_SUA_CHAVE_AQUI') {
    return apiErrorResponse('DATAJUD_API_KEY não configurada', 503)
  }

  // Só sincroniza processos ativos com número e tribunal definidos
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
    },
  })

  const resultados = {
    processados: 0,
    novosTotal: 0,
    erros: 0,
    detalhes: [] as { processoId: string; novas: number; erro?: string }[],
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

      if (!dados) {
        resultados.detalhes.push({ processoId: processo.id, novas: 0 })
        continue
      }

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
      }

      await prisma.processo.update({
        where: { id: processo.id },
        data: { lastSyncAt: new Date() },
      })

      resultados.processados++
      resultados.novosTotal += novas.length
      resultados.detalhes.push({ processoId: processo.id, novas: novas.length })
    } catch (err: any) {
      resultados.erros++
      resultados.detalhes.push({
        processoId: processo.id,
        novas: 0,
        erro: err.message,
      })
    }
  }

  return apiJsonResponse(resultados)
}
