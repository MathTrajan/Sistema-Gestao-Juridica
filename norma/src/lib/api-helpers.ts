import { NextResponse } from 'next/server'
import { sanitizeUTF8Deep } from './utils'

/**
 * Retorna um JSON com charset UTF-8 garantido e dados sanitizados.
 * 
 * Uso:
 *   return apiJsonResponse({ data: processos })
 *   return apiJsonResponse({ error: 'Erro' }, { status: 400 })
 */
export function apiJsonResponse<T>(
  data: T,
  options?: {
    status?: number
    headers?: Record<string, string>
  }
) {
  const sanitized = sanitizeUTF8Deep(data)
  
  const headers = {
    'Content-Type': 'application/json; charset=utf-8',
    ...options?.headers,
  }
  
  return NextResponse.json(sanitized, {
    status: options?.status ?? 200,
    headers,
  })
}

/**
 * Retorna um erro com charset UTF-8 garantido.
 */
export function apiErrorResponse(
  message: string,
  status: number = 500,
  headers?: Record<string, string>
) {
  return apiJsonResponse(
    { error: message },
    { status, headers }
  )
}
