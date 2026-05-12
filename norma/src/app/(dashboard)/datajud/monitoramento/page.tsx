import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import MonitoramentoClient from '@/components/datajud/MonitoramentoClient'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

export default async function MonitoramentoPage() {
  const session = await auth()
  if (!session) redirect('/login')

  // Apenas GESTOR_GERAL e GERENTE podem gerenciar
  const perfil = session.user.perfil
  if (perfil === 'COLABORADOR') {
    redirect('/datajud')
  }

  const escritorioId = session.user.escritorioId

  const monitorados = await prisma.advogadoMonitorado.findMany({
    where: { escritorioId },
    orderBy: [{ ativo: 'desc' }, { createdAt: 'desc' }],
    include: { usuario: { select: { id: true, nome: true } } },
  })

  const data = monitorados.map((m) => ({
    id: m.id,
    oab: m.oab,
    nome: m.nome,
    tribunais: m.tribunais,
    ativo: m.ativo,
    ultimaVerificacaoAt: m.ultimaVerificacaoAt?.toISOString() ?? null,
    ultimoResultadoCount: m.ultimoResultadoCount,
    createdAt: m.createdAt.toISOString(),
    usuario: m.usuario,
  }))

  return (
    <div className="page-enter px-6 py-8 xl:px-10">
      <div className="max-w-5xl space-y-6">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <Link
            href="/datajud"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground transition hover:text-foreground"
          >
            <ArrowLeft size={12} />
            Voltar para DataJud
          </Link>
          <p className="mt-4 text-xs uppercase tracking-[0.36em] text-slate-400">
            DataJud · Monitoramento
          </p>
          <h1 className="mt-2 text-3xl font-bold text-foreground">
            OABs monitoradas
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Cadastre as OABs que devem ser monitoradas. Diariamente o sistema
            consulta o DataJud do CNJ e cria uma notificação no sino 🔔 sempre
            que aparecer um processo novo em nome do advogado — antes mesmo de
            você ser intimado.
          </p>
        </div>

        <MonitoramentoClient initial={data} />
      </div>
    </div>
  )
}
