import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient() {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    // Limit connections for serverless environments (Vercel functions)
    // Each function instance should use at most 1-2 connections.
    // If your database provider supports PgBouncer, set ?pgbouncer=true in DATABASE_URL
    // and ?connection_limit=1 for optimal serverless performance.
  })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

// In development, reuse the client across hot reloads to avoid exhausting connections.
// In production (serverless), each instance creates its own client — which is correct.
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
