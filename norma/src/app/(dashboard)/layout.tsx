import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Sidebar from '@/components/layout/Sidebar'
import Topbar from '@/components/layout/Topbar'
import { SidebarProvider } from '@/components/layout/SidebarContext'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session) redirect('/login')

  const escritorioId = (session?.user as any)?.escritorioId

  const [badgeTarefas, badgePrazos] = await Promise.all([
    prisma.tarefa.count({
      where: {
        escritorioId,
        status: { in: ['A_FAZER', 'EM_ANDAMENTO'] },
      },
    }),
    prisma.prazo.count({
      where: {
        processo: { escritorioId },
        status: 'ABERTO',
        dataFinal: { lte: new Date(Date.now() + 48 * 60 * 60 * 1000) },
      },
    }),
  ])

  const user = session.user.name
    ? {
        nome: session.user.name,
        perfil: (session.user as any).perfil ?? '',
        area: (session.user as any).area ?? null,
      }
    : null

  return (
    <SidebarProvider>
      <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
        <Sidebar user={user} badgeTarefas={badgeTarefas} badgePrazos={badgePrazos} />
        <main className="flex-1 md:ml-60 ml-0 min-w-0 overflow-x-hidden flex flex-col">
          <Topbar />
          {children}
        </main>
      </div>
    </SidebarProvider>
  )
}
