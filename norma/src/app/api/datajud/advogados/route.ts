import { auth } from '@/lib/auth'
import { apiErrorResponse, apiJsonResponse } from '@/lib/api-helpers'
import { buscarProcessosPorAdvogado } from '@/lib/datajud'

export async function GET(req: Request) {
  const session = await auth()
  if (!session) return apiErrorResponse('Não autorizado', 401)

  const url = new URL(req.url)
  const oab = String(url.searchParams.get('oab') ?? '').trim()
  const nome = String(url.searchParams.get('nome') ?? '').trim() || undefined
  const tribunal = String(url.searchParams.get('tribunal') ?? 'TJGO').trim() || 'TJGO'

  if (!oab) {
    return apiErrorResponse('OAB do advogado é obrigatória', 400)
  }

  const apiKey = process.env.DATAJUD_API_KEY
  if (!apiKey || apiKey === 'COLOQUE_SUA_CHAVE_AQUI') {
    return apiErrorResponse(
      'API Key do DataJud não configurada. Solicite em datajud-wiki.cnj.jus.br e adicione DATAJUD_API_KEY no .env',
      503
    )
  }

  let resultados
  try {
    resultados = await buscarProcessosPorAdvogado(oab, tribunal, apiKey, nome)
  } catch (err: any) {
    return apiErrorResponse(`Erro ao consultar DataJud: ${err.message}`, 502)
  }

  return apiJsonResponse({
    oab,
    tribunal,
    resultados,
    total: resultados.length,
  })
}
