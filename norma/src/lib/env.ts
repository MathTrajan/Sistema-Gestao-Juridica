import { z } from 'zod'

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL é obrigatória'),
  NEXTAUTH_SECRET: z
    .string()
    .min(32, 'NEXTAUTH_SECRET deve ter pelo menos 32 caracteres')
    .refine(
      (val) =>
        process.env.NODE_ENV !== 'production' ||
        val !== 'chave-super-secreta-troque-em-producao-32chars',
      'Em produção, NEXTAUTH_SECRET não pode ser o valor padrão. Gere um novo com: openssl rand -base64 32'
    ),
  NEXTAUTH_URL: z.string().url('NEXTAUTH_URL deve ser uma URL válida'),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  // DataJud — opcional; endpoints de sync retornam 503 quando ausente
  DATAJUD_API_KEY: z.string().optional(),
  // Cron — obrigatório em produção; o endpoint /api/cron/datajud sempre exige o token
  CRON_SECRET: z
    .string()
    .refine(
      (val) => process.env.NODE_ENV !== 'production' || (!!val && val.length >= 16),
      'Em produção, CRON_SECRET deve ser definido com pelo menos 16 caracteres'
    )
    .optional(),
})

function validateEnv() {
  const result = envSchema.safeParse(process.env)

  if (!result.success) {
    const errors = result.error.issues.map((i) => `  • ${i.path.join('.')}: ${i.message}`)
    throw new Error(`\n❌ Variáveis de ambiente inválidas:\n${errors.join('\n')}\n`)
  }

  return result.data
}

export const env = validateEnv()
