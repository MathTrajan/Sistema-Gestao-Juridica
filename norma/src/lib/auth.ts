import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from './prisma'
import { authConfig } from './auth.config'
import './env'

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        senha: { label: 'Senha', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.senha) return null

        const usuarios = await prisma.usuario.findMany({
          where: {
            email: credentials.email as string,
            ativo: true,
          },
        })

        if (usuarios.length === 0) return null

        for (const usuario of usuarios) {
          const senhaValida = await bcrypt.compare(
            credentials.senha as string,
            usuario.senha
          )
          if (senhaValida) {
            return {
              id: usuario.id,
              name: usuario.nome,
              email: usuario.email,
              perfil: usuario.perfil,
              escritorioId: usuario.escritorioId,
              area: usuario.area ?? null,
              permissoes: usuario.permissoes ?? [],
            }
          }
        }

        return null
      },
    }),
  ],
})