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
        console.log('[auth] authorize called, email:', credentials?.email, 'has senha:', !!credentials?.senha)
        if (!credentials?.email || !credentials?.senha) {
          console.log('[auth] missing credentials')
          return null
        }

        let usuario
        try {
          usuario = await prisma.usuario.findFirst({
            where: { email: credentials.email as string, ativo: true },
          })
        } catch (e) {
          console.error('[auth] prisma error:', e)
          return null
        }

        console.log('[auth] usuario found:', !!usuario)
        if (!usuario) return null

        let senhaValida
        try {
          senhaValida = await bcrypt.compare(credentials.senha as string, usuario.senha)
        } catch (e) {
          console.error('[auth] bcrypt error:', e)
          return null
        }

        console.log('[auth] senha valida:', senhaValida)
        if (!senhaValida) return null

        return {
          id: usuario.id,
          name: usuario.nome,
          email: usuario.email,
          perfil: usuario.perfil,
          escritorioId: usuario.escritorioId,
        }
      },
    }),
  ],
})