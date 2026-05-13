import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { apiJsonResponse, apiErrorResponse } from '@/lib/api-helpers'
import { buscarProcessosPorAdvogado } from '@/lib/datajud'

// Dispara verificação imediata de uma OAB monitorada — mesma lógica do
// cron diário, mas escopada a um único AdvogadoMonitorado.
// Cria Notificacao(DATAJUD_PROCESSO_DESCOBERTO) para processos novos
// encontrados em qualquer dos tribunais cadastrados.
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return apiErrorResponse('Não autorizado', 401)

  const { id } = await params
  const escritorioId = session.user.escritorioId

  const apiKey = process.env.DATAJUD_API_KEY
  if (!apiKey || apiKey === 'COLOQUE_SUA_CHAVE_AQUI') {
    return apiErrorResponse('DATAJUD_API_KEY não configurada', 503)
  }

  const adv = await prisma.advogadoMonitorado.findFirst({
    where: { id, escritorioId },
  })
  if (!adv) return apiErrorResponse('Advogado monitorado não encontrado', 404)
  if (!adv.ativo) return apiErrorResponse('Este monitoramento está pausado', 400)
  if (adv.tribunais.length === 0)
    return apiErrorResponse('Nenhum tribunal cadastrado', 400)

  // Processos já cadastrados no escritório → só os dígitos
  const cadastrados = await prisma.processo.findMany({
    where: { escritorioId, numero: { not: null } },
    select: { numero: true },
  })
  const numerosExistentes = new Set(
    cadastrados.map((p) => (p.numero ?? '').replace(/[^0-9]/g, ''))
  )

  let totalEncontrados = 0
  let descobertos = 0
  const errosPorTribunal: { tribunal: string; erro: string }[] = []

  for (const tribunal of adv.tribunais) {
    try {
      const resultados = await buscarProcessosPorAdvogado(
        adv.oab,
        tribunal,
        apiKey,
        adv.nome ?? undefined
      )
      totalEncontrados += resultados.length

      for (const proc of resultados) {
        const digitos = (proc.numeroProcesso ?? '').replace(/[^0-9]/g, '')
        if (!digitos || numerosExistentes.has(digitos)) continue

        // Anti-spam: não duplica notificação para o mesmo número CNJ
        const jaNotificado = await prisma.notificacao.findFirst({
          where: {
            escritorioId,
            tipo: 'DATAJUD_PROCESSO_DESCOBERTO',
            metadata: { path: ['numeroCNJ'], equals: proc.numeroProcesso },
          },
          select: { id: true },
        })
        if (jaNotificado) continue

        await prisma.notificacao.create({
          data: {
            escritorioId,
            tipo: 'DATAJUD_PROCESSO_DESCOBERTO',
            titulo: `Novo processo na OAB ${adv.oab}`,
            descricao: `${proc.numeroProcesso} — ${tribunal}`,
            link: `/processos/novo?numero=${encodeURIComponent(proc.numeroProcesso)}&tribunal=${encodeURIComponent(tribunal)}`,
            metadata: {
              numeroCNJ: proc.numeroProcesso,
              tribunal,
              grau: proc.grau,
              dataAjuizamento: proc.dataAjuizamento,
              advogadoMonitoradoId: adv.id,
              oab: adv.oab,
            },
          },
        })

        numerosExistentes.add(digitos)
        descobertos++
      }
    } catch (err: any) {
      errosPorTribunal.push({
        tribunal,
        erro: err?.message ?? 'Erro desconhecido',
      })
    }
  }

  await prisma.advogadoMonitorado.update({
    where: { id: adv.id },
    data: {
      ultimaVerificacaoAt: new Date(),
      ultimoResultadoCount: totalEncontrados,
    },
  })

  return apiJsonResponse({
    ok: true,
    totalEncontrados,
    descobertos,
    novasNotificacoes: descobertos,
    errosPorTribunal,
    mensagem:
      descobertos > 0
        ? `${descobertos} processo(s) novo(s) descoberto(s) — confira o sino 🔔`
        : totalEncontrados > 0
        ? `${totalEncontrados} processo(s) encontrado(s), todos já cadastrados`
        : 'Nenhum processo encontrado para esta OAB',
  })
}
