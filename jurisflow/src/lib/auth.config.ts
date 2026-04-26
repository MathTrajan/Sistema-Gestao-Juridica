import type { NextAuthConfig } from 'next-auth'

export const authConfig: NextAuthConfig = {
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.perfil = (user as any).perfil
        token.escritorioId = (user as any).escritorioId
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        ;(session.user as any).perfil = token.perfil
        ;(session.user as any).escritorioId = token.escritorioId
      }
      return session
    },
  },
  providers: [],
}
