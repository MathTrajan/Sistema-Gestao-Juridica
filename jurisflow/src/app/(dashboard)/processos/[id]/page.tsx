import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus } from 'lucide-react'

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

const prioridadeConfig: Record<string, { label: string; color: string }> = {
  URGENTE: { label: 'Urgente', color: 'bg-red-100 text-red-800' },
  ALTA: { label: 'Alta', color: 'bg-amber-100 text-amber-800' },
  NORMAL: { label: 'Normal', color: 'bg-gray-100 text-gray-600' },
  BAIXA: { label: 'Baixa', color: 'bg-blue-100 text-blue-800' },
}

const statusPrazoConfig: Record<string, { label: string; color: string }> = {
  ABERTO: { label: 'Aberto', color: 'bg-amber-100 text-amber-800' },
  CUMPRIDO: { label: 'Cumprido', color: 'bg-green-100 text-green-800' },
  PERDIDO: { label: 'Perdido', color: 'bg-red-100 text-red-800' },
  SUSPENSO: { label: 'Suspenso', color: 'bg-gray-100 text-gray-600' },
}

export default async function ProcessoDetalhePage({
  params,
}: {
  params: { id: string }
}) {
  const session = await auth()
  const escritorioId = (session?.user as any)?.escritorioId

  const processo = await prisma.processo.findFirst({
    where: { id: params.id, escritorioId },
    include: {
      cliente: true,
      responsavel: { select: { id: true, nome: true } },
      tarefas: {
        orderBy: { createdAt: 'desc' },
        include: { responsavel: { select: { nome: true } } },
      },
      prazos: { orderBy: { dataFinal: 'asc' } },
      andamentos: { orderBy: { data: 'desc' } },
      movimentacoes: { orderBy: { data: 'desc' }, take: 10 },
    },
  })

  if (!processo) notFound()

  const fase = faseConfig[processo.fase]
  const status = statusConfig[processo.status]

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link href="/processos" className="text-gray-400 hover:text-gray-600 transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-gray-900">
                {processo.numero || 'Processo sem número'}
              </h1>
              <span className={`text-xs font-medium px-2 py-1 rounded-full ${fase.color}`}>
                {fase.label}
              </span>
              <span className={`text-xs font-medium px-2 py-1 rounded-full ${status.color}`}>
                {status.label}
              </span>
            </div>
            <p className="text-gray-400 text-sm mt-0.5">
              Cliente: <Link href={`/clientes/${processo.cliente.id}`} className="text-green-700 hover:underline">{processo.cliente.nomeCompleto}</Link>
              {processo.tribunal && ` · ${processo.tribunal}`}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Coluna principal */}
        <div className="col-span-2 flex flex-col gap-5">

          {/* Dados do processo */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Dados do Processo</h2>
            <div className="grid grid-cols-2 gap-4">
              <Info label="Número" value={processo.numero || '—'} />
              <Info label="Área Jurídica" value={processo.areaJuridica ? areaLabels[processo.areaJuridica] : '—'} />
              <Info label="Tribunal" value={processo.tribunal || '—'} />
              <Info label="Vara" value={processo.vara || '—'} />
              <Info label="Comarca" value={processo.comarca || '—'} />
              <Info label="Tipo de Ação" value={processo.tipoAcao || '—'} />
              <Info label="Tipo" value={processo.tipo === 'JUDICIAL' ? 'Judicial' : 'Administrativo'} />
              <Info label="Responsável" value={processo.responsavel?.nome || '—'} />
              {processo.dataDistribuicao && (
                <Info label="Data de Distribuição" value={new Date(processo.dataDistribuicao).toLocaleDateString('pt-BR')} />
              )}
              {processo.valorCausa && (
                <Info label="Valor da Causa" value={`R$ ${Number(processo.valorCausa).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} />
              )}
            </div>
            {processo.observacoes && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Observações</div>
                <p className="text-sm text-gray-600">{processo.observacoes}</p>
              </div>
            )}
          </div>

          {/* Prazos */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <span className="font-semibold text-gray-900 text-sm">Prazos ({processo.prazos.length})</span>
              <Link href={`/prazos/novo?processoId=${processo.id}`} className="flex items-center gap-1 text-xs text-green-700 hover:underline font-medium">
                <Plus size={12} /> Novo prazo
              </Link>
            </div>
            {processo.prazos.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-sm">Nenhum prazo cadastrado</div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-5 py-3">Título</th>
                    <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-5 py-3">Vencimento</th>
                    <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-5 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {processo.prazos.map((prazo) => {
                    const sp = statusPrazoConfig[prazo.status]
                    const vencido = new Date(prazo.dataFinal) < new Date() && prazo.status === 'ABERTO'
                    return (
                      <tr key={prazo.id} className="border-b border-gray-50 last:border-0">
                        <td className="px-5 py-3 text-sm font-medium text-gray-900">{prazo.titulo}</td>
                        <td className={`px-5 py-3 text-sm font-medium ${vencido ? 'text-red-600' : 'text-gray-600'}`}>
                          {new Date(prazo.dataFinal).toLocaleDateString('pt-BR')}
                          {vencido && ' ⚠️'}
                        </td>
                        <td className="px-5 py-3">
                          <span className={`text-xs font-medium px-2 py-1 rounded-full ${sp.color}`}>{sp.label}</span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Tarefas */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <span className="font-semibold text-gray-900 text-sm">Tarefas ({processo.tarefas.length})</span>
              <Link href={`/tarefas/novo?processoId=${processo.id}`} className="flex items-center gap-1 text-xs text-green-700 hover:underline font-medium">
                <Plus size={12} /> Nova tarefa
              </Link>
            </div>
            {processo.tarefas.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-sm">Nenhuma tarefa vinculada</div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-5 py-3">Título</th>
                    <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-5 py-3">Responsável</th>
                    <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-5 py-3">Prioridade</th>
                    <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-5 py-3">Vencimento</th>
                  </tr>
                </thead>
                <tbody>
                  {processo.tarefas.map((tarefa) => {
                    const p = prioridadeConfig[tarefa.prioridade]
                    return (
                      <tr key={tarefa.id} className="border-b border-gray-50 last:border-0">
                        <td className="px-5 py-3 text-sm font-medium text-gray-900">{tarefa.titulo}</td>
                        <td className="px-5 py-3 text-sm text-gray-600">{tarefa.responsavel?.nome || '—'}</td>
                        <td className="px-5 py-3">
                          <span className={`text-xs font-medium px-2 py-1 rounded-full ${p.color}`}>{p.label}</span>
                        </td>
                        <td className="px-5 py-3 text-sm text-gray-600">
                          {tarefa.dataVencimento ? new Date(tarefa.dataVencimento).toLocaleDateString('pt-BR') : '—'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Andamentos */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
            <div className="px-5 py-4 border-b border-gray-100">
              <span className="font-semibold text-gray-900 text-sm">Andamentos ({processo.andamentos.length})</span>
            </div>
            {processo.andamentos.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-sm">Nenhum andamento registrado</div>
            ) : (
              <div className="p-5">
                {processo.andamentos.map((a, i) => (
                  <div key={a.id} className={`flex gap-4 ${i < processo.andamentos.length - 1 ? 'mb-4 pb-4 border-b border-gray-100' : ''}`}>
                    <div className="w-2 h-2 rounded-full bg-green-600 mt-1.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-gray-800">{a.texto}</p>
                      <p className="text-xs text-gray-400 mt-1">{new Date(a.data).toLocaleDateString('pt-BR')}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Coluna lateral */}
        <div className="flex flex-col gap-5">
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Resumo</h2>
            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">Prazos</span>
                <span className="text-sm font-bold text-gray-900">{processo.prazos.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">Tarefas</span>
                <span className="text-sm font-bold text-gray-900">{processo.tarefas.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">Andamentos</span>
                <span className="text-sm font-bold text-gray-900">{processo.andamentos.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">Movimentações</span>
                <span className="text-sm font-bold text-gray-900">{processo.movimentacoes.length}</span>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Cliente</h2>
            <div className="flex flex-col gap-2">
              <Link href={`/clientes/${processo.cliente.id}`} className="text-sm font-medium text-green-700 hover:underline">
                {processo.cliente.nomeCompleto}
              </Link>
              {processo.cliente.telefone && (
                <span className="text-xs text-gray-500">{processo.cliente.telefone}</span>
              )}
              {processo.cliente.email && (
                <span className="text-xs text-gray-500">{processo.cliente.email}</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">{label}</div>
      <div className="text-sm text-gray-800">{value}</div>
    </div>
  )
}