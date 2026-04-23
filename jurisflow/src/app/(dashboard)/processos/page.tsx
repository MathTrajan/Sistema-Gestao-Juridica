import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'

const areaLabels: Record<string, string> = {
  TRABALHISTA: 'Trabalhista', CIVIL: 'Cível', TRIBUTARIO: 'Tributário',
  PREVIDENCIARIO: 'Previdenciário', CRIMINAL: 'Criminal', FAMILIA: 'Família',
  EMPRESARIAL: 'Empresarial', CONSUMIDOR: 'Consumidor', AMBIENTAL: 'Ambiental', OUTRO: 'Outro',
}

const faseConfig: Record<string, { label: string; color: string }> = {
  CONHECIMENTO: { label: 'Conhecimento', color: 'bg-blue-50 text-blue-700' },
  RECURSAL: { label: 'Recursal', color: 'bg-amber-50 text-amber-700' },
  EXECUCAO: { label: 'Execução', color: 'bg-purple-50 text-purple-700' },
  ENCERRADO: { label: 'Encerrado', color: 'bg-gray-100 text-gray-500' },
}

const statusConfig: Record<string, { label: string; color: string }> = {
  EM_ANDAMENTO: { label: 'Em Andamento', color: 'bg-green-100 text-green-800' },
  AGUARDANDO_PECA: { label: 'Aguard. Peça', color: 'bg-amber-100 text-amber-800' },
  AGUARDANDO_CLIENTE: { label: 'Aguard. Cliente', color: 'bg-blue-100 text-blue-800' },
  SUSPENSO: { label: 'Suspenso', color: 'bg-gray-100 text-gray-600' },
  ENCERRADO_PROCEDENTE: { label: 'Procedente', color: 'bg-green-100 text-green-800' },
  ENCERRADO_IMPROCEDENTE: { label: 'Improcedente', color: 'bg-red-100 text-red-800' },
  ARQUIVADO: { label: 'Arquivado', color: 'bg-gray-100 text-gray-500' },
}

export default async function ProcessosPage() {
  const session = await auth()
  const escritorioId = (session?.user as any)?.escritorioId

  const processos = await prisma.processo.findMany({
    where: { escritorioId },
    orderBy: { createdAt: 'desc' },
    include: {
      cliente: { select: { id: true, nomeCompleto: true } },
      responsavel: { select: { nome: true } },
      _count: { select: { prazos: true, tarefas: true } },
    },
  })

  return (
    <div className="p-8">

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        {processos.length === 0 ? (
          <div className="p-16 text-center">
            <div className="text-gray-300 text-5xl mb-4">📄</div>
            <div className="text-gray-500 font-medium">Nenhum processo cadastrado</div>
            <div className="text-gray-400 text-sm mt-1">Clique em "Novo Processo" para começar</div>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-5 py-3">Número / Cliente</th>
                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-5 py-3">Área</th>
                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-5 py-3">Tribunal</th>
                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-5 py-3">Fase</th>
                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-5 py-3">Status</th>
                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-5 py-3">Responsável</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {processos.map((p) => {
                const fase = faseConfig[p.fase]
                const status = statusConfig[p.status]
                return (
                  <tr key={p.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3">
                      <div className="font-medium text-sm text-green-700">
                        {p.numero || 'Sem número'}
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">{p.cliente.nomeCompleto}</div>
                    </td>
                    <td className="px-5 py-3">
                      {p.areaJuridica ? (
                        <span className="text-xs font-medium bg-blue-50 text-blue-700 px-2 py-1 rounded-full">
                          {areaLabels[p.areaJuridica]}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-600">{p.tribunal || '—'}</td>
                    <td className="px-5 py-3">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${fase.color}`}>
                        {fase.label}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${status.color}`}>
                        {status.label}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-600">
                      {p.responsavel?.nome || '—'}
                    </td>
                    <td className="px-5 py-3">
                      <Link href={`/processos/${p.id}`} className="text-xs text-green-700 hover:underline font-medium">
                        Ver
                      </Link>
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