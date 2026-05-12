import Link from 'next/link'
import { Eye } from 'lucide-react'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import AdvogadoSearchClient from '@/components/datajud/AdvogadoSearchClient'

export default async function DataJudPage() {
  const session = await auth()
  const usuarioId = session?.user?.id
  const perfil = session?.user?.perfil
  const podeMonitorar = perfil === 'GESTOR_GERAL' || perfil === 'GERENTE'
  const usuario = usuarioId
    ? await prisma.usuario.findUnique({
        where: { id: usuarioId },
        select: { oab: true },
      })
    : null

  return (
    <div className="page-enter px-6 py-8 xl:px-10">
      <div className="max-w-6xl space-y-6">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.36em] text-slate-400">DataJud</p>
              <h1 className="mt-2 text-3xl font-bold text-foreground">Consulta de Processos</h1>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                Busque movimentações de qualquer processo pelo número CNJ. Para sincronizar automaticamente os processos cadastrados no sistema, use o botão "Sincronizar DataJud" na página de cada processo.
              </p>
            </div>

            <div className="flex flex-col items-stretch gap-2 md:items-end">
              <div className="rounded-2xl border border-white/10 bg-black/5 p-4 text-sm text-foreground">
                <p className="font-semibold">OAB do usuário</p>
                <p className="mt-1 text-muted-foreground">{usuario?.oab ?? 'Nenhuma OAB cadastrada'}</p>
              </div>
              {podeMonitorar && (
                <Link
                  href="/datajud/monitoramento"
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-[rgba(184,150,42,0.4)] bg-[rgba(184,150,42,0.1)] px-3 py-2 text-xs font-semibold text-[#d4af37] transition hover:bg-[rgba(184,150,42,0.18)]"
                >
                  <Eye size={13} />
                  Monitoramento automático
                </Link>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <AdvogadoSearchClient initialOab={usuario?.oab ?? ''} initialTribunal="TJGO" />
        </div>
      </div>
    </div>
  )
}
