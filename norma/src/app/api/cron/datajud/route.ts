import { prisma } from '@/lib/prisma'
import { apiJsonResponse, apiErrorResponse } from '@/lib/api-helpers'
import {
  buscarProcessoDataJud,
  buscarProcessosPorAdvogado,
} from '@/lib/datajud'

// Vercel chama este endpoint via cron (vercel.json) às 06:00 UTC diariamente.
// O header Authorization: Bearer <CRON_SECRET> protege contra chamadas externas.
//
// Faz 2 coisas em sequência:
//   A) Sincroniza movimentações de TODOS os processos ativos do escritório.
//      Para cada movimentação nova, cria Notificacao(DATAJUD_MOVIMENTACAO).
//   B) Para cada AdvogadoMonitorado ativo, consulta DataJud por OAB em cada
//      tribunal; cria Notificacao(DATAJUD_PROCESSO_DESCOBERTO) para processos
//      não cadastrados ainda no escritório.
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

  // ─── A) Sincroniza processos ativos ─────────────────────────────────────────
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

  const sincronizacao = {
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

      sincronizacao.processados++
      sincronizacao.novosTotal += novas.length
    } catch {
      sincronizacao.erros++
    }
  }

  // ─── B) Monitoramento por OAB ───────────────────────────────────────────────
  const monitorados = await prisma.advogadoMonitorado.findMany({
    where: { ativo: true },
    select: {
      id: true,
      oab: true,
      nome: true,
      tribunais: true,
      escritorioId: true,
    },
  })

  const monitoramento = {
    advogadosVerificados: 0,
    descobertos: 0,
    erros: 0,
  }

  for (const adv of monitorados) {
    // Processos já cadastrados no escritório → set de números só com dígitos
    const cadastrados = await prisma.processo.findMany({
      where: { escritorioId: adv.escritorioId, numero: { not: null } },
      select: { numero: true },
    })
    const numerosExistentes = new Set(
      cadastrados.map((p) => (p.numero ?? '').replace(/[^0-9]/g, ''))
    )

    let totalEncontrados = 0

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

          // Verifica se já existe notificação não-lida para este número
          // (evita spam diário do mesmo processo descoberto)
          const jaNotificado = await prisma.notificacao.findFirst({
            where: {
              escritorioId: adv.escritorioId,
              tipo: 'DATAJUD_PROCESSO_DESCOBERTO',
              metadata: { path: ['numeroCNJ'], equals: proc.numeroProcesso },
            },
            select: { id: true },
          })
          if (jaNotificado) continue

          await prisma.notificacao.create({
            data: {
              escritorioId: adv.escritorioId,
              tipo: 'DATAJUD_PROCESSO_DESCOBERTO',
              titulo: `Novo processo na OAB ${adv.oab}`,
              descricao: `${proc.numeroProcesso} — ${tribunal}`,
              link: `/processos/novo?numero=${encodeURIComponent(proc.numeroProcesso)}&tribunal=${encodeURIComponent(tribunal)}`,
              urgente: false,
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

          // Marca como já visto na cache local desta execução
          numerosExistentes.add(digitos)
          monitoramento.descobertos++
        }
      } catch {
        monitoramento.erros++
      }
    }

    await prisma.advogadoMonitorado.update({
      where: { id: adv.id },
      data: {
        ultimaVerificacaoAt: new Date(),
        ultimoResultadoCount: totalEncontrados,
      },
    })
    monitoramento.advogadosVerificados++
  }

  return apiJsonResponse({ sincronizacao, monitoramento })
}
