import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus } from 'lucide-react'
import ProcessoEditModal from '@/components/processos/ProcessoEditModal'
import ProcessoDeleteButton from '@/components/processos/ProcessoDeleteButton'
import SincronizarButton from '@/components/processos/SincronizarButton'
import AndamentosClient from '@/components/processos/AndamentosClient'
import DocumentosSection from '@/components/shared/DocumentosSection'

const areaLabels: Record<string, string> = {
  TRABALHISTA: 'Trabalhista', CIVIL: 'Cível', TRIBUTARIO: 'Tributário',
  PREVIDENCIARIO: 'Previdenciário', CRIMINAL: 'Criminal', FAMILIA: 'Família',
  EMPRESARIAL: 'Empresarial', CONSUMIDOR: 'Consumidor', AMBIENTAL: 'Ambiental', OUTRO: 'Outro',
}

const faseConfig: Record<string, { label: string; color: string }> = {
  CONHECIMENTO: { label: 'Conhecimento', color: 'bg-info-bg text-info' },
  RECURSAL:     { label: 'Recursal',     color: 'bg-warning-bg text-warning' },
  EXECUCAO:     { label: 'Execução',     color: 'bg-gold/12 text-gold' },
  ENCERRADO:    { label: 'Encerrado',    color: 'bg-white/8 text-muted-foreground' },
}

const statusConfig: Record<string, { label: string; color: string }> = {
  EM_ANDAMENTO:            { label: 'Em Andamento',      color: 'bg-success-bg text-success' },
  AGUARDANDO_PECA:         { label: 'Aguard. Peça',      color: 'bg-warning-bg text-warning' },
  AGUARDANDO_CLIENTE:      { label: 'Aguard. Cliente',   color: 'bg-info-bg text-info' },
  SUSPENSO:                { label: 'Suspenso',          color: 'bg-white/8 text-muted-foreground' },
  ENCERRADO_PROCEDENTE:    { label: 'Procedente',        color: 'bg-success-bg text-success' },
  ENCERRADO_IMPROCEDENTE:  { label: 'Improcedente',      color: 'bg-danger-bg text-danger' },
  ARQUIVADO:               { label: 'Arquivado',         color: 'bg-white/8 text-muted-foreground' },
}

const prioridadeConfig: Record<string, { label: string; color: string }> = {
  URGENTE: { label: 'Urgente', color: 'bg-danger-bg text-danger' },
  ALTA:    { label: 'Alta',    color: 'bg-warning-bg text-warning' },
  NORMAL:  { label: 'Normal',  color: 'bg-white/8 text-muted-foreground' },
  BAIXA:   { label: 'Baixa',   color: 'bg-info-bg text-info' },
}

const statusPrazoConfig: Record<string, { label: string; color: string }> = {
  ABERTO:   { label: 'Aberto',   color: 'bg-warning-bg text-warning' },
  CUMPRIDO: { label: 'Cumprido', color: 'bg-success-bg text-success' },
  PERDIDO:  { label: 'Perdido',  color: 'bg-danger-bg text-danger' },
  SUSPENSO: { label: 'Suspenso', color: 'bg-white/8 text-muted-foreground' },
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
        documentos: { orderBy: { createdAt: 'desc' } },
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

  const fase   = faseConfig[processo.fase]
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
    <div className="page-enter px-6 py-8 xl:px-10">

      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-4">
          <Link
            href="/processos"
            className="mt-0.5 shrink-0 text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <p className="text-[10px] uppercase tracking-[0.36em] text-muted-foreground">Processos</p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold text-foreground">
                {processo.numero || 'Processo sem número'}
              </h1>
              <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${fase.color}`}>
                {fase.label}
              </span>
              <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${status.color}`}>
                {status.label}
              </span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              <Link href={`/clientes/${processo.cliente.id}`} className="text-gold hover:text-gold-light transition-colors">
                {processo.cliente.nomeCompleto}
              </Link>
              {processo.tribunal && (
                <span className="text-muted-foreground"> · {processo.tribunal}</span>
              )}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
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

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Coluna principal */}
        <div className="flex flex-col gap-5 lg:col-span-2">

          {/* Dados do processo */}
          <section className="rounded-xl border border-white/10 bg-white/5 p-5">
            <h2 className="mb-4 text-sm font-semibold text-foreground">Dados do Processo</h2>
            <div className="grid grid-cols-2 gap-4">
              <Info label="Número"        value={processo.numero || '—'} />
              <Info label="Área Jurídica" value={processo.areaJuridica ? areaLabels[processo.areaJuridica] : '—'} />
              <Info label="Tribunal"      value={processo.tribunal || '—'} />
              <Info label="Vara"          value={processo.vara || '—'} />
              <Info label="Comarca"       value={processo.comarca || '—'} />
              <Info label="Tipo de Ação"  value={processo.tipoAcao || '—'} />
              <Info label="Tipo"          value={processo.tipo === 'JUDICIAL' ? 'Judicial' : 'Administrativo'} />
              <Info label="Responsável"   value={processo.responsavel?.nome || '—'} />
              {processo.dataDistribuicao && (
                <Info label="Data de Distribuição" value={new Date(processo.dataDistribuicao).toLocaleDateString('pt-BR')} />
              )}
              {processo.valorCausa && (
                <Info label="Valor da Causa" value={`R$ ${Number(processo.valorCausa).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} />
              )}
            </div>
            {processo.observacoes && (
              <div className="mt-4 border-t border-white/8 pt-4">
                <div className="mb-1 text-[10px] font-semibold uppercase tracking-[0.28em] text-muted-foreground">Observações</div>
                <p className="text-sm text-foreground/80">{processo.observacoes}</p>
              </div>
            )}
          </section>

          {/* Dados Oficiais — DataJud */}
          <section className="rounded-xl border border-info/20 bg-info/5">
            <div className="flex items-center justify-between border-b border-info/15 px-5 py-4">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-foreground">Dados Oficiais</h2>
                <span className="rounded bg-info-bg px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-info">
                  DataJud / CNJ
                </span>
              </div>
              {processo.dataUltimaAtualizacaoDataJud && (
                <span className="text-xs text-muted-foreground">
                  Atualizado:{' '}
                  {new Date(processo.dataUltimaAtualizacaoDataJud).toLocaleString('pt-BR', {
                    day: '2-digit', month: '2-digit', year: 'numeric',
                    hour: '2-digit', minute: '2-digit',
                  })}
                </span>
              )}
            </div>

            {!temDadosDataJud ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                {processo.numero && processo.tribunal
                  ? 'Sincronize com o DataJud para importar dados oficiais do CNJ.'
                  : 'Cadastre o número e tribunal do processo para sincronizar com o DataJud.'}
              </div>
            ) : (
              <div className="p-5">
                <div className="grid grid-cols-2 gap-4">
                  {processo.classeNome && (
                    <Info
                      label="Classe Processual"
                      value={processo.classeCodigo ? `${processo.classeNome} (${processo.classeCodigo})` : processo.classeNome}
                    />
                  )}
                  {processo.orgaoJulgador   && <Info label="Órgão Julgador" value={processo.orgaoJulgador} />}
                  {processo.grau            && <Info label="Grau"           value={grauLabels[processo.grau] ?? processo.grau} />}
                  {processo.sistema         && <Info label="Sistema"        value={processo.sistema} />}
                  {processo.formato         && <Info label="Formato"        value={processo.formato} />}
                  {processo.nivelSigilo != null && (
                    <Info label="Nível de Sigilo" value={processo.nivelSigilo === 0 ? 'Público (0)' : `Restrito (${processo.nivelSigilo})`} />
                  )}
                  {processo.dataAjuizamentoDataJud && (
                    <Info label="Data de Ajuizamento" value={new Date(processo.dataAjuizamentoDataJud).toLocaleDateString('pt-BR')} />
                  )}
                  {processo.municipioIbge && (
                    <Info label="Município (IBGE)" value={String(processo.municipioIbge)} />
                  )}
                </div>
                {assuntos.length > 0 && (
                  <div className="mt-4 border-t border-white/8 pt-4">
                    <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.28em] text-muted-foreground">Assuntos</div>
                    <div className="flex flex-wrap gap-1.5">
                      {assuntos.map((a) => (
                        <span key={a.codigo} title={`Código CNJ ${a.codigo}`}
                          className="rounded-full bg-info-bg px-2.5 py-1 text-xs font-medium text-info"
                        >
                          {a.nome}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Prazos */}
          <section className="rounded-xl border border-white/10 bg-white/5">
            <div className="flex items-center justify-between border-b border-white/8 px-5 py-4">
              <span className="text-sm font-semibold text-foreground">Prazos ({processo.prazos.length})</span>
              <Link
                href={`/prazos/novo?processoId=${processo.id}`}
                className="flex items-center gap-1 text-xs font-medium text-gold hover:text-gold-light transition-colors"
              >
                <Plus size={12} /> Novo prazo
              </Link>
            </div>
            {processo.prazos.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">Nenhum prazo cadastrado</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[480px]">
                  <thead>
                    <tr className="border-b border-white/8 bg-white/3">
                      <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">Título</th>
                      <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">Vencimento</th>
                      <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {processo.prazos.map((prazo) => {
                      const sp = statusPrazoConfig[prazo.status]
                      const vencido = new Date(prazo.dataFinal) < new Date() && prazo.status === 'ABERTO'
                      return (
                        <tr key={prazo.id} className="border-b border-white/6 last:border-0 transition-colors hover:bg-white/4">
                          <td className="px-5 py-3 text-sm font-medium text-foreground">{prazo.titulo}</td>
                          <td className={`px-5 py-3 text-sm font-medium ${vencido ? 'text-danger' : 'text-muted-foreground'}`}>
                            {new Date(prazo.dataFinal).toLocaleDateString('pt-BR')}
                            {vencido && <span className="ml-1">⚠</span>}
                          </td>
                          <td className="px-5 py-3">
                            <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${sp.color}`}>{sp.label}</span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Tarefas */}
          <section className="rounded-xl border border-white/10 bg-white/5">
            <div className="flex items-center justify-between border-b border-white/8 px-5 py-4">
              <span className="text-sm font-semibold text-foreground">Tarefas ({processo.tarefas.length})</span>
              <Link
                href={`/tarefas/novo?processoId=${processo.id}`}
                className="flex items-center gap-1 text-xs font-medium text-gold hover:text-gold-light transition-colors"
              >
                <Plus size={12} /> Nova tarefa
              </Link>
            </div>
            {processo.tarefas.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">Nenhuma tarefa vinculada</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[540px]">
                  <thead>
                    <tr className="border-b border-white/8 bg-white/3">
                      <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">Título</th>
                      <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground hidden sm:table-cell">Responsável</th>
                      <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">Prioridade</th>
                      <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground hidden md:table-cell">Vencimento</th>
                    </tr>
                  </thead>
                  <tbody>
                    {processo.tarefas.map((tarefa) => {
                      const p = prioridadeConfig[tarefa.prioridade]
                      return (
                        <tr key={tarefa.id} className="border-b border-white/6 last:border-0 transition-colors hover:bg-white/4">
                          <td className="px-5 py-3 text-sm font-medium text-foreground">{tarefa.titulo}</td>
                          <td className="px-5 py-3 text-sm text-muted-foreground hidden sm:table-cell">{tarefa.responsavel?.nome || '—'}</td>
                          <td className="px-5 py-3">
                            <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${p.color}`}>{p.label}</span>
                          </td>
                          <td className="px-5 py-3 text-sm text-muted-foreground hidden md:table-cell">
                            {tarefa.dataVencimento ? new Date(tarefa.dataVencimento).toLocaleDateString('pt-BR') : '—'}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Andamentos */}
          <AndamentosClient
            processoId={processo.id}
            andamentosIniciais={processo.andamentos.map(a => ({
              id: a.id,
              texto: a.texto,
              data: a.data.toISOString(),
            }))}
          />

          {/* Movimentações DataJud */}
          <section className="rounded-xl border border-white/10 bg-white/5">
            <div className="flex items-center justify-between border-b border-white/8 px-5 py-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-foreground">
                  Movimentações ({processo.movimentacoes.length})
                </span>
                <span className="text-xs text-muted-foreground">via DataJud / CNJ</span>
              </div>
              <SincronizarButton
                processoId={processo.id}
                temNumero={!!processo.numero}
                temTribunal={!!processo.tribunal}
                lastSyncAt={processo.lastSyncAt?.toISOString() ?? null}
              />
            </div>
            {processo.movimentacoes.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                {processo.numero && processo.tribunal
                  ? 'Nenhuma movimentação importada — clique em "Sincronizar DataJud" acima'
                  : 'Cadastre o número e tribunal do processo para sincronizar'}
              </div>
            ) : (
              <div className="divide-y divide-white/6">
                {processo.movimentacoes.map((mov) => (
                  <div key={mov.id} className="flex gap-4 px-5 py-3">
                    <div className="mt-1.5 shrink-0">
                      <div className={`h-2 w-2 rounded-full ${mov.fonte === 'DATAJUD' ? 'bg-info' : 'bg-white/30'}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-foreground/90">{mov.descricao}</p>
                      <div className="mt-0.5 flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {new Date(mov.data).toLocaleString('pt-BR', {
                            day: '2-digit', month: '2-digit', year: 'numeric',
                            hour: '2-digit', minute: '2-digit',
                          })}
                        </span>
                        {mov.fonte === 'DATAJUD' && (
                          <span className="rounded bg-info-bg px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-info">
                            DataJud
                          </span>
                        )}
                        {mov.fonte === 'MANUAL' && (
                          <span className="rounded bg-white/8 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                            Manual
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Documentos */}
          <DocumentosSection
            processoId={processo.id}
            documentosIniciais={processo.documentos.map(d => ({
              id: d.id,
              nome: d.nome,
              tipo: d.tipo,
              url: d.url,
              createdAt: d.createdAt.toISOString(),
            }))}
          />
        </div>

        {/* Coluna lateral */}
        <div className="flex flex-col gap-5">
          <div className="rounded-xl border border-white/10 bg-white/5 p-5">
            <h2 className="mb-4 text-sm font-semibold text-foreground">Resumo</h2>
            <div className="flex flex-col gap-3">
              <ResumoItem label="Prazos"        value={processo.prazos.length} />
              <ResumoItem label="Tarefas"       value={processo.tarefas.length} />
              <ResumoItem label="Andamentos"    value={processo.andamentos.length} />
              <ResumoItem label="Movimentações" value={processo.movimentacoes.length} />
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/5 p-5">
            <h2 className="mb-4 text-sm font-semibold text-foreground">Cliente</h2>
            <div className="flex flex-col gap-2">
              <Link
                href={`/clientes/${processo.cliente.id}`}
                className="text-sm font-medium text-gold hover:text-gold-light transition-colors"
              >
                {processo.cliente.nomeCompleto}
              </Link>
              {processo.cliente.telefone && (
                <span className="text-xs text-muted-foreground">{processo.cliente.telefone}</span>
              )}
              {processo.cliente.email && (
                <span className="text-xs text-muted-foreground">{processo.cliente.email}</span>
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
      <div className="mb-1 text-[10px] font-semibold uppercase tracking-[0.28em] text-muted-foreground">{label}</div>
      <div className="text-sm text-foreground">{value}</div>
    </div>
  )
}

function ResumoItem({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-bold text-foreground">{value}</span>
    </div>
  )
}
