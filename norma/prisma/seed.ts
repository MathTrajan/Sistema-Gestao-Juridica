import { PrismaClient, Perfil } from '@prisma/client'
import bcrypt from 'bcryptjs'

if (process.env.NODE_ENV === 'production') {
  console.error('❌ O seed não deve ser executado em produção!')
  process.exit(1)
}

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Criando dados iniciais...')

  // Escritório
  const escritorio = await prisma.escritorio.upsert({
    where: { cnpj: '00000000000000' },
    update: {},
    create: {
      nome: 'Meu Escritório de Advocacia',
      cnpj: '00000000000000',
      plano: 'PROFISSIONAL',
    },
  })

  // Usuário administrador
  const senhaHash = await bcrypt.hash('123456', 10)

  await prisma.usuario.upsert({
    where: {
      email_escritorioId: {
        email: 'admin@escritorio.com',
        escritorioId: escritorio.id,
      },
    },
    update: {},
    create: {
      nome: 'Administrador',
      email: 'admin@escritorio.com',
      senha: senhaHash,
      perfil: Perfil.GESTOR_GERAL,
      escritorioId: escritorio.id,
    },
  })

  console.log('✅ Pronto!')
  console.log('   Login: admin@escritorio.com')
  console.log('   Senha: 123456')
  console.log('   ⚠️  Troque a senha após o primeiro acesso!')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())