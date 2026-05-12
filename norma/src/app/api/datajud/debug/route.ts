import { auth } from '@/lib/auth'
import { apiJsonResponse, apiErrorResponse } from '@/lib/api-helpers'

// Busca um documento real do DataJud para inspecionar a estrutura de campos
export async function GET(req: Request) {
  const session = await auth()
  if (!session) return apiErrorResponse('Não autorizado', 401)

  const apiKey = process.env.DATAJUD_API_KEY
  if (!apiKey || apiKey === 'COLOQUE_SUA_CHAVE_AQUI') {
    return apiErrorResponse('DATAJUD_API_KEY não configurada', 503)
  }

  const { searchParams } = new URL(req.url)
  const tribunal = searchParams.get('tribunal') || 'TJGO'
  const codTribunal = tribunal.toLowerCase().replace(/[^a-z0-9]/g, '')

  // Busca qualquer processo com movimentos para inspeção
  const body = {
    query: { match_all: {} },
    size: 1,
    _source: true,
  }

  const res = await fetch(
    `https://api-publica.datajud.cnj.jus.br/api_publica_${codTribunal}/_search`,
    {
      method: 'POST',
      headers: {
        Authorization: `APIKey ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      cache: 'no-store',
    }
  )

  const raw = await res.json()
  const doc = raw?.hits?.hits?.[0]?._source ?? null

  if (!doc) {
    return apiJsonResponse({ erro: 'Nenhum documento encontrado', raw })
  }

  // Extrai apenas os campos que interessam para debug
  return apiJsonResponse({
    campos_raiz: Object.keys(doc),
    partes_sample: doc.partes?.slice(0, 2) ?? null,
    advogados_raiz: doc.advogados ?? null,
    advogado_raiz: doc.advogado ?? null,
    movimentos_count: doc.movimentos?.length ?? 0,
    movimento_sample: doc.movimentos?.[0] ?? null,
    numero: doc.numeroProcesso,
    tribunal: doc.tribunal,
  })
}
