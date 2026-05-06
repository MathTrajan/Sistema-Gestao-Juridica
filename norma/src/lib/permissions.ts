import { NextResponse } from 'next/server'

interface SessionUser {
  perfil: string
  area?: string | null
}

// null = acesso permitido; NextResponse = 403 bloqueado
export function guardArea(user: SessionUser, area: string): NextResponse | null {
  if (user.perfil === 'GESTOR_GERAL' || user.perfil === 'GERENTE') return null
  if (user.area === area) return null
  return NextResponse.json({ error: 'Sem permissão para esta área' }, { status: 403 })
}

export function guardGestorGeral(user: SessionUser): NextResponse | null {
  if (user.perfil === 'GESTOR_GERAL') return null
  return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
}

export function guardGerenteOuSuperior(user: SessionUser): NextResponse | null {
  if (user.perfil === 'GESTOR_GERAL' || user.perfil === 'GERENTE') return null
  return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
}
