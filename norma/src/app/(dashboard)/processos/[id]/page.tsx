import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus } from 'lucide-react'
import ProcessoEditModal from '@/components/processos/ProcessoEditModal'
import ProcessoDeleteButton from '@/components/processos/ProcessoDeleteButton'
import SincronizarButton from '@/components/processos/SincronizarButton'

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

const grauLabels: Record<string, string> = {
  G1: '1º Grau',
  G2: '2º Grau',
  GS: 'Tribunal Superior',
}

type AssuntoDataJud = { codigo: number; nome: string }

export default async function ProcessoDetalhePage({
  params,
}: {
  params: { id: string }
}) {
  const session = await auth()
  const escritorioId = (session?.user as any)?.escritorioId

  const [processo, usuarios] = await Promise.all([
    prisma.processo.findFirst({
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
        movimentacoes: { orderBy: { data: 'desc' }, take: 50 },
      },
    }),
    prisma.usuario.findMany({
      where: { escritorioId, ativo: true },
      select: { id: true, nome: true },
      orderBy: { nome: 'asc' },
    }),
  ])

  if (!processo) notFound()

  const fase = faseConfig[processo.fase]
  const status = statusConfig[processo.status]

  const assuntos = Array.isArray(processo.assuntos)
    ? (processo.assuntos as unknown as AssuntoDataJud[])
    : []
  const temDadosDataJud =
    !!processo.classeNome ||
    !!processo.orgaoJulgador ||
    !!processo.grau ||
    !!processo.sistema ||
    !!processo.formato ||
    assuntos.length > 0 ||
    !!processo.dataAjuizamentoDataJud ||
    !!processo.dataUltimaAtualizacaoDataJud

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
        <div className="flex items-center gap-2">
          <SincronizarButton
            processoId={processo.id}
            temNumero={!!processo.numero}
            temTribunal={!!processo.tribunal}
            lastSyncAt={processo.lastSyncAt?.toISOString() ?? null}
          />
          <ProcessoDeleteButton processoId={processo.id} />
          <ProcessoEditModal
          processoId={processo.id}
          usuarios={usuarios}
          initial={{
            numero: processo.numero,
            tribunal: processo.tribunal,
            vara: processo.vara,
            comarca: processo.comarca,
            tipoAcao: processo.tipoAcao,
            areaJuridica: processo.areaJuridica,
            tipo: processo.tipo,
            fase: processo.fase,
            status: processo.status,
            dataDistribuicao: processo.dataDistribuicao?.toISOString() ?? null,
            valorCausa: processo.valorCausa ? Number(processo.valorCausa) : null,
            observacoes: processo.observacoes,
            responsavelId: processo.responsavelId,
          }}
        />
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

          {/* Dados Oficiais (DataJud / CNJ) */}
          <div className="bg-white border border-blue-100 rounded-xl shadow-sm">
            <div className="px-5 py-4 border-b border-blue-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-gray-700">Dados Oficiais</h2>
                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 uppercase tracking-wide">
                  DataJud / CNJ
                </span>
              </div>
              {processo.dataUltimaAtualizacaoDataJud && (
                <span className="text-xs text-gray-400">
                  Atualizado no tribunal:{' '}
                  {new Date(processo.dataUltimaAtualizacaoDataJud).toLocaleString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              )}
            </div>
            {!temDadosDataJud ? (
              <div className="p-8 text-center text-gray-400 text-sm">
                {processo.numero && processo.tribunal
                  ? 'Sincronize com o DataJud para puxar classe processual, assuntos, órgão julgador e demais dados oficiais.'
                  : 'Cadastre o número e tribunal do processo para sincronizar com o DataJud.'}
              </div>
            ) : (
              <div className="p-5 flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-4">
                  {processo.classeNome && (
                    <Info
                      label="Classe Processual"
                      value={
                        processo.classeCodigo
                          ? `${processo.classeNome} (${processo.classeCodigo})`
                          : processo.classeNome
                      }
                    />
                  )}
                  {processo.orgaoJulgador && (
                    <Info label="Órgão Julgador" value={processo.orgaoJulgador} />
                  )}
                  {processo.grau && (
                    <Info label="Grau" value={grauLabels[processo.grau] ?? processo.grau} />
                  )}
                  {processo.sistema && <Info label="Sistema" value={processo.sistema} />}
                  {processo.formato && <Info label="Formato" value={processo.formato} />}
                  {processo.nivelSigilo != null && (
                    <Info
                      label="Nível de Sigilo"
                      value={
                        processo.nivelSigilo === 0
                          ? 'Público (0)'
                          : `Restrito (${processo.nivelSigilo})`
                      }
                    />
                  )}
                  {processo.dataAjuizamentoDataJud && (
                    <Info
                      label="Data de Ajuizamento"
                      value={new Date(processo.dataAjuizamentoDataJud).toLocaleDateString(
                        'pt-BR'
                      )}
                    />
                  )}
                  {processo.municipioIbge && (
                    <Info label="Município (IBGE)" value={String(processo.municipioIbge)} />
                  )}
                </div>
                {assuntos.length > 0 && (
                  <div className="pt-3 border-t border-gray-100">
                    <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                      Assuntos
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {assuntos.map((a) => (
                        <span
                          key={a.codigo}
                          title={`Código CNJ ${a.codigo}`}
                          className="text-xs font-medium px-2 py-1 rounded-full bg-blue-50 text-blue-700"
                        >
                          {a.nome}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
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
          {/* Movimentações DataJud */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-900 text-sm">
                  Movimentações ({processo.movimentacoes.length})
                </span>
                <span className="text-xs text-gray-400 font-normal">via DataJud / CNJ</span>
              </div>
              <SincronizarButton
                processoId={processo.id}
                temNumero={!!processo.numero}
                temTribunal={!!processo.tribunal}
                lastSyncAt={processo.lastSyncAt?.toISOString() ?? null}
              />
            </div>
            {processo.movimentacoes.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-sm">
                {processo.numero && processo.tribunal
                  ? 'Nenhuma movimentação importada — clique em "Sincronizar DataJud" acima'
                  : 'Cadastre o número e tribunal do processo para sincronizar'}
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {processo.movimentacoes.map((mov) => (
                  <div key={mov.id} className="flex gap-4 px-5 py-3">
                    <div className="flex-shrink-0 mt-1">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          mov.fonte === 'DATAJUD' ? 'bg-blue-500' : 'bg-gray-400'
                        }`}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-800">{mov.descricao}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-gray-400">
                          {new Date(mov.data).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        {mov.fonte === 'DATAJUD' && (
                          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 uppercase tracking-wide">
                            DataJud
                          </span>
                        )}
                        {mov.fonte === 'MANUAL' && (
                          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 uppercase tracking-wide">
                            Manual
                          </span>
                        )}
                      </div>
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