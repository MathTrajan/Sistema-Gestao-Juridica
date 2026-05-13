import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import AdvogadoSearchClient from '@/components/datajud/AdvogadoSearchClient'

export default async function DataJudPage() {
  const session = await auth()
  const usuarioId = session?.user?.id
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

            <div className="rounded-2xl border border-white/10 bg-black/5 p-4 text-sm text-foreground">
              <p className="font-semibold">OAB do usuário</p>
              <p className="mt-1 text-muted-foreground">{usuario?.oab ?? 'Nenhuma OAB cadastrada'}</p>
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
