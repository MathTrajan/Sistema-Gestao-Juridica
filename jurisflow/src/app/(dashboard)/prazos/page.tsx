import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { AlertTriangle } from 'lucide-react'

const tipoPrazoLabels: Record<string, string> = {
  RECURSO: 'Recurso', CONTESTACAO: 'Contestação', MANIFESTACAO: 'Manifestação',
  REPLICA: 'Réplica', APELACAO: 'Apelação', CONTRARRAZOES: 'Contrarrazões',
  EMBARGOS: 'Embargos', OUTRO: 'Outro',
}

const statusConfig: Record<string, { label: string; color: string }> = {
  ABERTO: { label: 'Aberto', color: 'bg-amber-100 text-amber-800' },
  CUMPRIDO: { label: 'Cumprido', color: 'bg-green-100 text-green-800' },
  PERDIDO: { label: 'Perdido', color: 'bg-red-100 text-red-800' },
  SUSPENSO: { label: 'Suspenso', color: 'bg-gray-100 text-gray-600' },
}

function getDiasRestantes(dataFinal: Date) {
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  const final = new Date(dataFinal)
  final.setHours(0, 0, 0, 0)
  return Math.ceil((final.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24))
}

export default async function PrazosPage() {
  const session = await auth()
  const escritorioId = (session?.user as any)?.escritorioId

  const prazos = await prisma.prazo.findMany({
    where: { processo: { escritorioId } },
    orderBy: { dataFinal: 'asc' },
    include: {
      processo: {
        select: {
          id: true,
          numero: true,
          cliente: { select: { nomeCompleto: true } },
        },
      },
    },
  })

  const criticos = prazos.filter(p => {
    const dias = getDiasRestantes(p.dataFinal)
    return p.status === 'ABERTO' && dias <= 2
  })

  return (
    <div className="p-8">

      {/* Alerta críticos */}
      {criticos.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-center gap-3">
          <AlertTriangle size={18} className="text-red-600 flex-shrink-0" />
          <span className="text-sm text-red-700 font-medium">
            {criticos.length} prazo{criticos.length !== 1 ? 's' : ''} vence{criticos.length === 1 ? '' : 'm'} nas próximas 48 horas. Verifique imediatamente!
          </span>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        {prazos.length === 0 ? (
          <div className="p-16 text-center">
            <div className="text-gray-300 text-5xl mb-4">⏰</div>
            <div className="text-gray-500 font-medium">Nenhum prazo cadastrado</div>
            <div className="text-gray-400 text-sm mt-1">Clique em "Novo Prazo" para começar</div>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-5 py-3">Título / Processo</th>
                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-5 py-3">Tipo</th>
                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-5 py-3">Cliente</th>
                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-5 py-3">Vencimento</th>
                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-5 py-3">Restam</th>
                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {prazos.map((prazo) => {
                const status = statusConfig[prazo.status]
                const dias = getDiasRestantes(prazo.dataFinal)
                const critico = prazo.status === 'ABERTO' && dias <= 2
                const atencao = prazo.status === 'ABERTO' && dias > 2 && dias <= 5
                return (
                  <tr
                    key={prazo.id}
                    className={`border-b border-gray-50 last:border-0 ${critico ? 'bg-red-50' : atencao ? 'bg-amber-50' : 'hover:bg-gray-50'} transition-colors`}
                  >
                    <td className="px-5 py-3">
                      <div className="font-medium text-sm text-gray-900">{prazo.titulo}</div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        <Link href={`/processos/${prazo.processo.id}`} className="hover:underline text-green-700">
                          {prazo.processo.numero || 'Sem número'}
                        </Link>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-xs font-medium bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                        {tipoPrazoLabels[prazo.tipo]}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-600">
                      {prazo.processo.cliente.nomeCompleto}
                    </td>
                    <td className={`px-5 py-3 text-sm font-medium ${critico ? 'text-red-700' : atencao ? 'text-amber-700' : 'text-gray-700'}`}>
                      {new Date(prazo.dataFinal).toLocaleDateString('pt-BR')}
                    </td>
                    <td className={`px-5 py-3 text-sm font-bold ${critico ? 'text-red-700' : atencao ? 'text-amber-700' : 'text-gray-600'}`}>
                      {prazo.status === 'ABERTO'
                        ? dias < 0 ? 'Vencido' : dias === 0 ? 'Hoje!' : `${dias} dia${dias !== 1 ? 's' : ''}`
                        : '—'}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${status.color}`}>
                        {status.label}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}