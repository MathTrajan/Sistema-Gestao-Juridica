import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { apiJsonResponse, apiErrorResponse } from '@/lib/api-helpers'
import { buscarProcessoDataJud } from '@/lib/datajud'

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
    return apiErrorResponse(
      'API Key do DataJud não configurada. Solicite em datajud-wiki.cnj.jus.br e adicione DATAJUD_API_KEY no .env',
      503
    )
  }

  const processo = await prisma.processo.findFirst({
    where: { id, escritorioId },
    select: {
      id: true,
      numero: true,
      tribunal: true,
      vara: true,
      tipoAcao: true,
      dataDistribuicao: true,
    },
  })

  if (!processo) return apiErrorResponse('Processo não encontrado', 404)
  if (!processo.numero) return apiErrorResponse('Processo sem número CNJ cadastrado', 400)
  if (!processo.tribunal) return apiErrorResponse('Processo sem tribunal definido', 400)

  let dadosDataJud
  try {
    dadosDataJud = await buscarProcessoDataJud(
      processo.numero,
      processo.tribunal,
      apiKey
    )
  } catch (err: any) {
    return apiErrorResponse(`Erro ao consultar DataJud: ${err.message}`, 502)
  }

  if (!dadosDataJud) {
    return apiErrorResponse(
      'Processo não encontrado no DataJud. Verifique o número e tribunal.',
      404
    )
  }

  // Busca códigos já importados para evitar duplicatas
  const existentes = await prisma.movimentacao.findMany({
    where: { processoId: id, fonte: 'DATAJUD' },
    select: { codigoExterno: true },
  })
  const codigosExistentes = new Set(
    existentes.map((m) => m.codigoExterno).filter(Boolean)
  )

  const novas = dadosDataJud.movimentos.filter(
    (m) => !codigosExistentes.has(String(m.codigo))
  )

  if (novas.length > 0) {
    await prisma.movimentacao.createMany({
      data: novas.map((m) => ({
        processoId: id,
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

  // Monta o patch com os dados oficiais (DataJud / CNJ).
  // Campos exclusivos da fonte oficial sempre sobrescrevem; campos manuais
  // (vara, tipoAcao, dataDistribuicao) só são preenchidos se estiverem vazios.
  const parseDate = (s: string | null) => {
    if (!s) return null
    const d = new Date(s)
    return Number.isNaN(d.getTime()) ? null : d
  }

  const dataAjuizamento = parseDate(dadosDataJud.dataAjuizamento)
  const dataUltAtualizacao = parseDate(dadosDataJud.dataHoraUltimaAtualizacao)

  const updateData: Record<string, unknown> = {
    lastSyncAt: new Date(),
    grau: dadosDataJud.grau || null,
    sistema: dadosDataJud.sistema,
    formato: dadosDataJud.formato,
    nivelSigilo: dadosDataJud.nivelSigilo,
    classeCodigo: dadosDataJud.classe?.codigo ?? null,
    classeNome: dadosDataJud.classe?.nome ?? null,
    assuntos: dadosDataJud.assuntos.length > 0 ? dadosDataJud.assuntos : null,
    orgaoJulgador: dadosDataJud.orgaoJulgador?.nome ?? null,
    orgaoJulgadorCodigo: dadosDataJud.orgaoJulgador?.codigo ?? null,
    municipioIbge: dadosDataJud.orgaoJulgador?.codigoMunicipioIBGE ?? null,
    dataAjuizamentoDataJud: dataAjuizamento,
    dataUltimaAtualizacaoDataJud: dataUltAtualizacao,
  }

  // Preenche campos manuais somente se ainda estiverem vazios
  if (!processo.dataDistribuicao && dataAjuizamento) {
    updateData.dataDistribuicao = dataAjuizamento
  }
  if (!processo.vara && dadosDataJud.orgaoJulgador?.nome) {
    updateData.vara = dadosDataJud.orgaoJulgador.nome
  }
  if (!processo.tipoAcao && dadosDataJud.classe?.nome) {
    updateData.tipoAcao = dadosDataJud.classe.nome
  }

  await prisma.processo.update({ where: { id }, data: updateData })

  return apiJsonResponse({
    novas: novas.length,
    total: dadosDataJud.movimentos.length,
    dadosAtualizados: true,
    mensagem:
      novas.length > 0
        ? `${novas.length} nova(s) movimentação(ões) importada(s) · dados oficiais atualizados`
        : 'Sem movimentações novas — dados oficiais atualizados',
  })
}
