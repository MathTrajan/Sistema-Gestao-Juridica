import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Sanitiza strings que possam ter encoding UTF-8 corrompido.
 * Exemplo: "mês" mal-codificado → "mês" corrigido
 * 
 * Este é um fix para casos onde dados foram salvos com encoding incorreto.
 * Tenta recuperar o texto original assumindo que foi corrompido por dupla codificação.
 */
export function sanitizeUTF8(str: string): string {
  if (!str || typeof str !== 'string') return str
  
  try {
    // Tenta detectar e corrigir codificação dupla (UTF-8 como Latin-1)
    // Padrão: caracteres acentuados aparecem como sequências malformadas
    const bytes = Buffer.from(str, 'latin1')
    const corrected = bytes.toString('utf8')
    
    // Se o resultado parecer válido e diferente, usa-o
    if (corrected !== str && !/[\uFFFD]/g.test(corrected)) {
      return corrected
    }
  } catch {
    // Se algo der errado, retorna original
  }
  
  return str
}

/**
 * Aplica sanitizeUTF8 recursivamente em um objeto ou array.
 * Útil para garantir que toda resposta de API tenha encoding correto.
 */
export function sanitizeUTF8Deep<T>(data: T): T {
  if (typeof data === 'string') {
    return sanitizeUTF8(data) as T
  }

  if (Array.isArray(data)) {
    return data.map(item => sanitizeUTF8Deep(item)) as T
  }

  if (data !== null && typeof data === 'object') {
    const result: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
      result[key] = sanitizeUTF8Deep(value)
    }
    return result as T
  }

  return data
}

export function formatCPF(cpf: string) {
  return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
}

export function formatCNPJ(cnpj: string) {
  return cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
}

export function formatTelefone(tel: string) {
  const digits = tel.replace(/\D/g, '')
  if (digits.length === 11) {
    return digits.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
  }
  return digits.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
}

export function formatDocumento(doc: string) {
  const digits = doc.replace(/\D/g, '')
  if (digits.length === 11) return formatCPF(digits)
  if (digits.length === 14) return formatCNPJ(digits)
  return doc
}