import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Sidebar from '@/components/layout/Sidebar'
import Topbar from '@/components/layout/Topbar'
import { SidebarProvider } from '@/components/layout/SidebarContext'
import { MainWrapper } from '@/components/layout/MainWrapper'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session) redirect('/login')

  const userData = session.user as typeof session.user & {
    escritorioId?: string
    perfil?: string
    area?: string | null
  }
  const escritorioId = userData.escritorioId
  const limitePrazo = new Date()
  limitePrazo.setHours(limitePrazo.getHours() + 48)

  const [badgeTarefas, badgePrazos] = await Promise.all([
    prisma.tarefa
      .count({ where: { escritorioId, status: { in: ['A_FAZER', 'EM_ANDAMENTO'] } } })
      .catch(() => 0),
    prisma.prazo
      .count({ where: { processo: { escritorioId }, status: 'ABERTO', dataFinal: { lte: limitePrazo } } })
      .catch(() => 0),
  ])

  const user = session.user.name
    ? { nome: session.user.name, perfil: userData.perfil ?? '', area: userData.area ?? null }
    : null

  return (
    <SidebarProvider>
      <div className="relative flex min-h-screen" style={{ background: 'var(--bg)' }}>

        {/* Padrão de pontos sutil */}
        <div
          className="pointer-events-none fixed inset-0 opacity-40"
          style={{
            backgroundImage: 'radial-gradient(rgba(184,150,42,0.06) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />

        {/* Orbe dourado sutil */}
        <div
          className="pointer-events-none fixed bottom-0 right-0 h-[500px] w-[500px] rounded-full opacity-[0.04] blur-[120px]"
          style={{ background: 'radial-gradient(circle, #B8962A, transparent)' }}
        />

        <Sidebar user={user} badgeTarefas={badgeTarefas} badgePrazos={badgePrazos} />

        <MainWrapper>
          <Topbar />
          {children}
        </MainWrapper>
      </div>
    </SidebarProvider>
  )
}
