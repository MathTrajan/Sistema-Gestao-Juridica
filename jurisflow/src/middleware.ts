import NextAuth from 'next-auth'
import { authConfig } from '@/lib/auth.config'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const { auth } = NextAuth(authConfig)

// In-memory rate limiter.
// Note: in serverless environments each instance has separate memory.
// For multi-instance production, replace with Upstash Redis (@upstash/ratelimit).
const rateLimitStore = new Map<string, { count: number; resetAt: number }>()

const RATE_LIMIT_WINDOW_MS = 60_000 // 1 minute

const ROUTE_LIMITS: { pattern: RegExp; limit: number }[] = [
  { pattern: /^\/api\/auth\/callback\/credentials/, limit: 10 },
  { pattern: /^\/api\//, limit: 200 },
]

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'
  )
}

function checkRateLimit(key: string, limit: number): boolean {
  const now = Date.now()
  const record = rateLimitStore.get(key)

  if (!record || now > record.resetAt) {
    rateLimitStore.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS })
    return true
  }

  if (record.count >= limit) return false
  record.count++
  return true
}

// Periodically prune expired entries to avoid memory leaks
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    for (const [key, record] of rateLimitStore.entries()) {
      if (now > record.resetAt) rateLimitStore.delete(key)
    }
  }, RATE_LIMIT_WINDOW_MS * 2)
}

export default auth((req) => {
  const { pathname } = req.nextUrl

  const matchedRoute = ROUTE_LIMITS.find((r) => r.pattern.test(pathname))
  if (matchedRoute) {
    const ip = getClientIp(req)
    const key = `${ip}:${pathname.split('/').slice(0, 3).join('/')}`

    if (!checkRateLimit(key, matchedRoute.limit)) {
      return NextResponse.json(
        { error: 'Muitas requisições. Tente novamente em instantes.' },
        { status: 429, headers: { 'Retry-After': '60' } }
      )
    }
  }

  const isLoggedIn = !!req.auth
  const isPublic = pathname.startsWith('/login') || pathname.startsWith('/api/auth')

  if (isPublic) return NextResponse.next()

  if (!isLoggedIn) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
