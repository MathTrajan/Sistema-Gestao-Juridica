import { auth } from '@/lib/auth'
import { apiJsonResponse, apiErrorResponse } from '@/lib/api-helpers'
import { buscarProcessosPorAdvogado } from '@/lib/datajud'

export async function GET(req: Request) {
  const session = await auth()
  if (!session) return apiErrorResponse('Não autorizado', 401)

  const apiKey = process.env.DATAJUD_API_KEY
  if (!apiKey || apiKey === 'COLOQUE_SUA_CHAVE_AQUI') {
    return apiErrorResponse('DATAJUD_API_KEY não configurada', 503)
  }

  const { searchParams } = new URL(req.url)
  const oab = searchParams.get('oab')?.trim()
  const tribunal = searchParams.get('tribunal')?.trim() || 'TJGO'

  if (!oab) return apiErrorResponse('Parâmetro oab é obrigatório', 400)

  try {
    const processos = await buscarProcessosPorAdvogado(oab, tribunal, apiKey)
    return apiJsonResponse({ processos, total: processos.length })
  } catch (err: any) {
    return apiErrorResponse(`Erro ao consultar DataJud: ${err.message}`, 502)
  }
}
