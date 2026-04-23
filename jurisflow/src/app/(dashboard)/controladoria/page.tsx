import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { AlertTriangle, Clock, FileText, Users, CheckSquare } from 'lucide-react'

export const dynamic = 'force-dynamic'

function getDiasRestantes(dataFinal: string) {
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  const final = new Date(dataFinal)
  final.setHours(0, 0, 0, 0)
  return Math.ceil((final.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24))
}

const prioridadeConfig: Record<string, { label: string; color: string }> = {
  URGENTE: { label: 'Urgente', color: 'bg-red-100 text-red-800' },
  ALTA: { label: 'Alta', color: 'bg-amber-100 text-amber-800' },
  NORMAL: { label: 'Normal', color: 'bg-gray-100 text-gray-600' },
  BAIXA: { label: 'Baixa', color: 'bg-blue-100 text-blue-800' },
}

const areaLabels: Record<string, string> = {
  TRABALHISTA: 'Trabalhista', CIVIL: 'Cível', TRIBUTARIO: 'Tributário',
  PREVIDENCIARIO: 'Previdenciário', CRIMINAL: 'Criminal', FAMILIA: 'Família',
  EMPRESARIAL: 'Empresarial', CONSUMIDOR: 'Consumidor', AMBIENTAL: 'Ambiental', OUTRO: 'Outro',
}

export default async function ControladoriPage() {
  const session = await auth()
  const escritorioId = (session?.user as any)?.escritorioId

  const [
    tarefasPendentes,
    processosSemResponsavel,
    prazosProximos,
    clientesDocPendente,
    processosRecentes,
    totalProcessos,
    totalClientes,
  ] = await Promise.all([
    prisma.tarefa.findMany({
      where: { escritorioId, status: { in: ['A_FAZER', 'EM_ANDAMENTO'] } },
      orderBy: [{ prioridade: 'desc' }, { dataVencimento: 'asc' }],
      take: 8,
      include: {
        responsavel: { select: { nome: true } },
        processo: {
          select: {
            numero: true,
            cliente: { select: { nomeCompleto: true } },
          },
        },
      },
    }),
    prisma.processo.count({
      where: { escritorioId, responsavelId: null, status: 'EM_ANDAMENTO' },
    }),
    prisma.prazo.findMany({
      where: {
        processo: { escritorioId },
        status: 'ABERTO',
        dataFinal: { lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
      },
      orderBy: { dataFinal: 'asc' },
      take: 8,
      include: {
        processo: {
          select: {
            id: true,
            numero: true,
            cliente: { select: { nomeCompleto: true } },
          },
        },
      },
    }),
    prisma.cliente.findMany({
      where: { escritorioId, status: 'DOCUMENTACAO_PENDENTE' },
      select: { id: true, nomeCompleto: true, areaJuridica: true, createdAt: true },
      take: 8,
    }),
    prisma.processo.findMany({
      where: { escritorioId, status: 'EM_ANDAMENTO' },
      orderBy: { createdAt: 'desc' },
      take: 8,
      include: {
        cliente: { select: { nomeCompleto: true } },
        responsavel: { select: { nome: true } },
        _count: { select: { tarefas: true, prazos: true } },
      },
    }),
    prisma.processo.count({ where: { escritorioId, status: 'EM_ANDAMENTO' } }),
    prisma.cliente.count({ where: { escritorioId, status: 'ATIVO' } }),
  ])

  const totalTarefas = tarefasPendentes.length
  const totalPrazos = prazosProximos.length

  return (
    <div className="p-8">

      {/* Alertas */}
      {(clientesDocPendente.length > 0 || processosSemResponsavel > 0) && (
        <div className="flex flex-col gap-3 mb-6">
          {clientesDocPendente.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
              <AlertTriangle size={16} className="text-amber-600 flex-shrink-0" />
              <span className="text-sm text-amber-800 font-medium">
                {clientesDocPendente.length} cliente{clientesDocPendente.length !== 1 ? 's' : ''} com documentação pendente
              </span>
              <Link href="/clientes" className="ml-auto text-xs text-amber-700 hover:underline font-medium">
                Ver clientes →
              </Link>
            </div>
          )}
          {processosSemResponsavel > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
              <AlertTriangle size={16} className="text-red-600 flex-shrink-0" />
              <span className="text-sm text-red-800 font-medium">
                {processosSemResponsavel} processo{processosSemResponsavel !== 1 ? 's' : ''} sem responsável atribuído
              </span>
              <Link href="/processos" className="ml-auto text-xs text-red-700 hover:underline font-medium">
                Ver processos →
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-4 gap-5 mb-8">
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="w-8 h-8 bg-blue-50 text-blue-700 rounded-lg flex items-center justify-center mb-3">
            <FileText size={16} />
          </div>
          <div className="text-2xl font-bold text-gray-900">{totalProcessos}</div>
          <div className="text-xs text-gray-500 mt-1 uppercase tracking-wide font-medium">Processos ativos</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="w-8 h-8 bg-green-50 text-green-700 rounded-lg flex items-center justify-center mb-3">
            <Users size={16} />
          </div>
          <div className="text-2xl font-bold text-gray-900">{totalClientes}</div>
          <div className="text-xs text-gray-500 mt-1 uppercase tracking-wide font-medium">Clientes ativos</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="w-8 h-8 bg-amber-50 text-amber-700 rounded-lg flex items-center justify-center mb-3">
            <CheckSquare size={16} />
          </div>
          <div className="text-2xl font-bold text-gray-900">{totalTarefas}</div>
          <div className="text-xs text-gray-500 mt-1 uppercase tracking-wide font-medium">Tarefas pendentes</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="w-8 h-8 bg-red-50 text-red-700 rounded-lg flex items-center justify-center mb-3">
            <Clock size={16} />
          </div>
          <div className="text-2xl font-bold text-gray-900">{totalPrazos}</div>
          <div className="text-xs text-gray-500 mt-1 uppercase tracking-wide font-medium">Prazos próximos (7d)</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">

        {/* Fila de Tarefas */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <span className="font-semibold text-gray-900 text-sm">Fila de Trabalho</span>
            <Link href="/tarefas" className="text-xs text-green-700 hover:underline font-medium">Ver todas</Link>
          </div>
          {tarefasPendentes.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm">Nenhuma tarefa pendente</div>
          ) : (
            <div>
              {tarefasPendentes.map((t, i) => {
                const p = prioridadeConfig[t.prioridade]
                return (
                  <div key={t.id} className={`px-5 py-3 flex items-center gap-3 ${i < tarefasPendentes.length - 1 ? 'border-b border-gray-50' : ''}`}>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">{t.titulo}</div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        {t.processo?.cliente?.nomeCompleto ?? 'Sem processo'}
                        {t.responsavel && ` · ${t.responsavel.nome}`}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {t.dataVencimento && (
                        <span className="text-xs text-gray-400">
                          {new Date(t.dataVencimento).toLocaleDateString('pt-BR')}
                        </span>
                      )}
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${p.color}`}>
                        {p.label}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Prazos Próximos */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <span className="font-semibold text-gray-900 text-sm">Prazos — Próximos 7 dias</span>
            <Link href="/prazos" className="text-xs text-green-700 hover:underline font-medium">Ver todos</Link>
          </div>
          {prazosProximos.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm">Nenhum prazo nos próximos 7 dias</div>
          ) : (
            <div>
              {prazosProximos.map((p, i) => {
                const dias = getDiasRestantes(p.dataFinal.toISOString())
                const critico = dias <= 2
                const atencao = dias > 2 && dias <= 5
                return (
                  <div key={p.id} className={`px-5 py-3 flex items-center gap-3 ${i < prazosProximos.length - 1 ? 'border-b border-gray-50' : ''} ${critico ? 'bg-red-50' : atencao ? 'bg-amber-50' : ''}`}>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">{p.titulo}</div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        <Link href={`/processos/${p.processo.id}`} className="hover:underline text-green-700">
                          {p.processo.numero || 'Sem número'}
                        </Link>
                        {` · ${p.processo.cliente.nomeCompleto}`}
                      </div>
                    </div>
                    <div className={`text-xs font-bold flex-shrink-0 ${critico ? 'text-red-700' : atencao ? 'text-amber-700' : 'text-gray-500'}`}>
                      {dias === 0 ? 'Hoje!' : dias < 0 ? 'Vencido' : `${dias}d`}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Clientes com Doc. Pendente */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <span className="font-semibold text-gray-900 text-sm">Documentação Pendente</span>
            <Link href="/clientes" className="text-xs text-green-700 hover:underline font-medium">Ver clientes</Link>
          </div>
          {clientesDocPendente.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm">Nenhum cliente com documentação pendente</div>
          ) : (
            <div>
              {clientesDocPendente.map((c, i) => (
                <div key={c.id} className={`px-5 py-3 flex items-center gap-3 ${i < clientesDocPendente.length - 1 ? 'border-b border-gray-50' : ''}`}>
                  <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-sm font-bold text-amber-800 flex-shrink-0">
                    {c.nomeCompleto.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link href={`/clientes/${c.id}`} className="text-sm font-medium text-gray-900 hover:underline hover:text-green-700 truncate block">
                      {c.nomeCompleto}
                    </Link>
                    <div className="text-xs text-gray-400 mt-0.5">
                      {c.areaJuridica ? areaLabels[c.areaJuridica] : '—'}
                      {` · Desde ${new Date(c.createdAt).toLocaleDateString('pt-BR')}`}
                    </div>
                  </div>
                  <span className="text-xs font-medium bg-amber-100 text-amber-800 px-2 py-1 rounded-full flex-shrink-0">
                    Doc. Pendente
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Processos em Andamento */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <span className="font-semibold text-gray-900 text-sm">Processos em Andamento</span>
            <Link href="/processos" className="text-xs text-green-700 hover:underline font-medium">Ver todos</Link>
          </div>
          {processosRecentes.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm">Nenhum processo em andamento</div>
          ) : (
            <div>
              {processosRecentes.map((p, i) => (
                <div key={p.id} className={`px-5 py-3 flex items-center gap-3 ${i < processosRecentes.length - 1 ? 'border-b border-gray-50' : ''}`}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Link href={`/processos/${p.id}`} className="text-sm font-medium text-green-700 hover:underline truncate">
                        {p.numero || 'Sem número'}
                      </Link>
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      {p.cliente.nomeCompleto}
                      {p.responsavel && ` · ${p.responsavel.nome}`}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0 text-xs text-gray-400">
                    <span>{p._count.tarefas} tarefa{p._count.tarefas !== 1 ? 's' : ''}</span>
                    <span>{p._count.prazos} prazo{p._count.prazos !== 1 ? 's' : ''}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Fluxo Operacional */}
      <div className="mt-6 bg-white border border-gray-200 rounded-xl shadow-sm">
        <div className="px-5 py-4 border-b border-gray-100">
          <span className="font-semibold text-gray-900 text-sm">Fluxo Operacional do Escritório</span>
        </div>
        <div className="p-5">
          <div className="flex items-center gap-0">
            {[
              { num: '1', label: 'Comercial', sub: 'Captação e cadastro', color: 'bg-green-700', href: '/comercial' },
              { num: '2', label: 'Controladoria', sub: 'Conferência documental', color: 'bg-blue-700', href: '/controladoria' },
              { num: '3', label: 'Jurídico', sub: 'Elaboração de peças', color: 'bg-purple-700', href: '/processos' },
              { num: '4', label: 'Protocolo', sub: 'Protocolo e acompanhamento', color: 'bg-amber-700', href: '/processos' },
              { num: '5', label: 'Financeiro', sub: 'Honorários e cobranças', color: 'bg-red-700', href: '/financeiro' },
            ].map((etapa, i, arr) => (
              <div key={etapa.num} className="flex items-center flex-1">
                <Link href={etapa.href} className="flex flex-col items-center flex-1 group">
                  <div className={`w-10 h-10 rounded-full ${etapa.color} flex items-center justify-center text-white font-bold text-sm group-hover:opacity-80 transition-opacity`}>
                    {etapa.num}
                  </div>
                  <div className="text-xs font-semibold text-gray-700 mt-2 text-center">{etapa.label}</div>
                  <div className="text-xs text-gray-400 text-center leading-tight mt-0.5">{etapa.sub}</div>
                </Link>
                {i < arr.length - 1 && (
                  <div className="text-gray-300 text-lg mx-1">→</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}