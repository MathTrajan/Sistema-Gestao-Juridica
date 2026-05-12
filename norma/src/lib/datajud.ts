const BASE_URL = 'https://api-publica.datajud.cnj.jus.br'

export interface DataJudMovimento {
  codigo: number
  nome: string
  dataHora: string
  complementos: string[]
}

export interface DataJudClasse {
  codigo: number
  nome: string
}

export interface DataJudAssunto {
  codigo: number
  nome: string
}

export interface DataJudOrgaoJulgador {
  codigo: string
  nome: string
  codigoMunicipioIBGE?: number
}

export interface DataJudProcesso {
  numeroProcesso: string
  tribunal: string
  grau: string
  sistema: string | null
  formato: string | null
  nivelSigilo: number | null
  dataAjuizamento: string | null
  dataHoraUltimaAtualizacao: string | null
  classe: DataJudClasse | null
  assuntos: DataJudAssunto[]
  orgaoJulgador: DataJudOrgaoJulgador | null
  movimentos: DataJudMovimento[]
}

export interface DataJudAdvogado {
  nome: string
  oab: string | null
}

export interface DataJudProcessoAdvogado {
  numeroProcesso: string
  tribunal: string
  grau: string
  dataAjuizamento: string | null
  advogados: DataJudAdvogado[]
  movimentos: DataJudMovimento[]
}

// Converte "TJGO", "TRF-1", "STJ" → "tjgo", "trf1", "stj"
function normalizarTribunal(tribunal: string): string {
  return tribunal.toLowerCase().replace(/[^a-z0-9]/g, '')
}

function normalizarOAB(value: string): string {
  return value.trim().toUpperCase()
}

function parseAdvogados(source: any): DataJudAdvogado[] {
  const raw = source?.advogados ?? source?.advogado
  if (!raw) return []

  const itens = Array.isArray(raw) ? raw : [raw]
  return itens.map((adv: any) => ({
    nome: String(adv.nome ?? adv.nomeAdvogado ?? adv.nomeAdvogadoPrincipal ?? '').trim(),
    oab: adv.numeroOAB ? String(adv.numeroOAB).trim() : adv.oab ? String(adv.oab).trim() : null,
  }))
}

export async function buscarProcessoDataJud(
  numeroProcesso: string,
  tribunal: string,
  apiKey: string
): Promise<DataJudProcesso | null> {
  const codTribunal = normalizarTribunal(tribunal)
  const url = `${BASE_URL}/api_publica_${codTribunal}/_search`

  const numero = numeroProcesso.trim()
  // O DataJud armazena o número sem formatação (só dígitos)
  // "1064414-42.2025.4.01.3300" → "10644144220254013300"
  const numeroDigitos = numero.replace(/[^0-9]/g, '')

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `APIKey ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: {
        bool: {
          should: [
            { term: { 'numeroProcesso.keyword': numeroDigitos } },
            { match: { numeroProcesso: numeroDigitos } },
            { term: { 'numeroProcesso.keyword': numero } },
            { match: { numeroProcesso: numero } },
          ],
          minimum_should_match: 1,
        },
      },
      size: 1,
    }),
    cache: 'no-store',
  })

  if (res.status === 404) return null

  if (!res.ok) {
    const txt = await res.text().catch(() => '')
    throw new Error(`DataJud ${res.status}: ${txt.slice(0, 200)}`)
  }

  const json = await res.json()
  const hits: any[] = json?.hits?.hits ?? []

  if (hits.length === 0) return null

  const src = hits[0]._source

  const movimentos: DataJudMovimento[] = (src.movimentos ?? []).map((m: any) => ({
    codigo: Number(m.codigo),
    nome: String(m.nome ?? ''),
    dataHora: String(m.dataHora ?? ''),
    complementos: (m.complementosTabelados ?? [])
      .map((c: any) => String(c.nome ?? ''))
      .filter(Boolean),
  }))

  return {
    numeroProcesso: src.numeroProcesso ?? numero,
    tribunal: src.tribunal ?? tribunal,
    grau: src.grau ?? '',
    sistema: src.sistema ?? null,
    formato: src.formato ?? null,
    nivelSigilo: src.nivelSigilo ?? null,
    dataAjuizamento: src.dataAjuizamento ?? null,
    dataHoraUltimaAtualizacao: src.dataHoraUltimaAtualizacao ?? null,
    classe: src.classe
      ? { codigo: Number(src.classe.codigo), nome: String(src.classe.nome ?? '') }
      : null,
    assuntos: (src.assuntos ?? []).map((a: any) => ({
      codigo: Number(a.codigo),
      nome: String(a.nome ?? ''),
    })),
    orgaoJulgador: src.orgaoJulgador
      ? {
          codigo: String(src.orgaoJulgador.codigo ?? ''),
          nome: String(src.orgaoJulgador.nome ?? ''),
          codigoMunicipioIBGE: src.orgaoJulgador.codigoMunicipioIBGE,
        }
      : null,
    movimentos,
  }
}

// Monta cláusulas de busca para um campo dentro de nested partes.advogados
function nestedAdvogadoQuery(field: string, value: string) {
  return {
    nested: {
      path: 'partes',
      query: {
        nested: {
          path: 'partes.advogados',
          query: { match: { [field]: value } },
        },
      },
    },
  }
}

export async function buscarProcessosPorAdvogado(
  oab: string,
  tribunal: string,
  apiKey: string,
  nome?: string
): Promise<DataJudProcessoAdvogado[]> {
  const codTribunal = normalizarTribunal(tribunal)
  const url = `${BASE_URL}/api_publica_${codTribunal}/_search`
  const oabNorm = normalizarOAB(oab)

  // Tenta nested queries (estrutura real do DataJud) + flat como fallback
  const shouldClauses: object[] = [
    // nested path correto (mais provável)
    nestedAdvogadoQuery('partes.advogados.numeroOAB', oabNorm),
    nestedAdvogadoQuery('partes.advogados.oab', oabNorm),
    // flat — caso o tribunal não use nested type
    { match: { 'partes.advogados.numeroOAB': oabNorm } },
    { match: { 'partes.advogados.oab': oabNorm } },
  ]

  if (nome) {
    const nomeUpper = nome.trim().toUpperCase()
    shouldClauses.push(nestedAdvogadoQuery('partes.advogados.nome', nomeUpper))
    shouldClauses.push({ match: { 'partes.advogados.nome': nomeUpper } })
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `APIKey ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: { bool: { should: shouldClauses, minimum_should_match: 1 } },
      size: 50,
      sort: [{ dataAjuizamento: 'desc' }],
    }),
    cache: 'no-store',
  })

  if (res.status === 404) return []

  if (!res.ok) {
    const txt = await res.text().catch(() => '')
    throw new Error(`DataJud ${res.status}: ${txt.slice(0, 200)}`)
  }

  const json = await res.json()
  const hits: any[] = json?.hits?.hits ?? []

  return hits.map((hit) => {
    const src = hit._source ?? {}
    const movimentos: DataJudMovimento[] = (src.movimentos ?? []).map((m: any) => ({
      codigo: Number(m.codigo),
      nome: String(m.nome ?? ''),
      dataHora: String(m.dataHora ?? ''),
      complementos: (m.complementosTabelados ?? [])
        .map((c: any) => String(c.nome ?? ''))
        .filter(Boolean),
    }))

    return {
      numeroProcesso: src.numeroProcesso ?? '',
      tribunal: src.tribunal ?? tribunal,
      grau: src.grau ?? '',
      dataAjuizamento: src.dataAjuizamento ?? null,
      advogados: parseAdvogados(src),
      movimentos,
    }
  })
}
