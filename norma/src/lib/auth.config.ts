import type { NextAuthConfig } from 'next-auth'

export const authConfig: NextAuthConfig = {
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.perfil = (user as any).perfil
        token.escritorioId = (user as any).escritorioId
        token.area = (user as any).area ?? null
        token.permissoes = (user as any).permissoes ?? []
      }
      return token
    },
    session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        ;(session.user as any).perfil = token.perfil
        ;(session.user as any).escritorioId = token.escritorioId
        ;(session.user as any).area = token.area ?? null
        ;(session.user as any).permissoes = token.permissoes ?? []
      }
      return session
    },
  },
  providers: [],
}
