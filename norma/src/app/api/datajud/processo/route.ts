import { auth } from '@/lib/auth'
import { apiJsonResponse, apiErrorResponse } from '@/lib/api-helpers'
import { buscarProcessoDataJud } from '@/lib/datajud'

export async function GET(req: Request) {
  const session = await auth()
  if (!session) return apiErrorResponse('Não autorizado', 401)

  const apiKey = process.env.DATAJUD_API_KEY
  if (!apiKey || apiKey === 'COLOQUE_SUA_CHAVE_AQUI') {
    return apiErrorResponse('DATAJUD_API_KEY não configurada', 503)
  }

  const { searchParams } = new URL(req.url)
  const numero = searchParams.get('numero')?.trim()
  const tribunal = searchParams.get('tribunal')?.trim() || 'TJGO'

  if (!numero) return apiErrorResponse('Parâmetro numero é obrigatório', 400)

  try {
    const processo = await buscarProcessoDataJud(numero, tribunal, apiKey)
    if (!processo) return apiErrorResponse('Processo não encontrado no DataJud', 404)
    return apiJsonResponse({ processo })
  } catch (err: any) {
    return apiErrorResponse(`Erro ao consultar DataJud: ${err.message}`, 502)
  }
}
