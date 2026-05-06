import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Users, FileText, CheckSquare, Clock } from 'lucide-react'
import { GlassCard } from '@/components/dashboard/glass-card'
import { StatCard } from '@/components/dashboard/stat-card'
import { AnimatedChart } from '@/components/dashboard/animated-chart'
import { AnimatedProgress } from '@/components/dashboard/animated-progress'
import { ParticlesBackground } from '@/components/dashboard/particles-background'

const periodoOptions = [
  { value: 'este-mes', label: 'Este mes' },
  { value: 'ultimos-3-meses', label: 'Ultimos 3 meses' },
  { value: 'este-ano', label: 'Este ano' },
  { value: 'tudo', label: 'Todo periodo' },
]

const periodoLabel: Record<string, string> = {
  'este-mes': 'este mes',
  'ultimos-3-meses': 'ultimos 3 meses',
  'este-ano': 'este ano',
  tudo: 'todo periodo',
}

const statusLabelMap: Record<string, string> = {
  EM_ANDAMENTO: 'Em andamento',
  AGUARDANDO_PECA: 'Aguardando peca',
  AGUARDANDO_CLIENTE: 'Aguardando cliente',
  SUSPENSO: 'Suspenso',
  ENCERRADO_PROCEDENTE: 'Encerrado procedente',
  ENCERRADO_IMPROCEDENTE: 'Encerrado improcedente',
  ARQUIVADO: 'Arquivado',
}

const areaLabels: Record<string, string> = {
  TRABALHISTA: 'Trabalhista',
  CIVIL: 'Civel',
  TRIBUTARIO: 'Tributario',
  PREVIDENCIARIO: 'Previdenciario',
  CRIMINAL: 'Criminal',
  FAMILIA: 'Familia',
  EMPRESARIAL: 'Empresarial',
  CONSUMIDOR: 'Consumidor',
  AMBIENTAL: 'Ambiental',
  OUTRO: 'Outro',
}

function getPeriodoInicio(periodo: string): Date {
  const agora = new Date()
  switch (periodo) {
    case 'ultimos-3-meses':
      return new Date(agora.getFullYear(), agora.getMonth() - 3, 1)
    case 'este-ano':
      return new Date(agora.getFullYear(), 0, 1)
    case 'tudo':
      return new Date(2000, 0, 1)
    default:
      return new Date(agora.getFullYear(), agora.getMonth(), 1)
  }
}

function getDiasRestantes(data: Date) {
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  const final = new Date(data)
  final.setHours(0, 0, 0, 0)
  return Math.ceil((final.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24))
}

function getChartMonths() {
  const agora = new Date()
  return Array.from({ length: 6 }).map((_, index) => {
    const date = new Date(agora.getFullYear(), agora.getMonth() - 5 + index, 1)
    const label = date.toLocaleString('pt-BR', { month: 'short' })
    return {
      label: label.charAt(0).toUpperCase() + label.slice(1),
      start: date,
      end: new Date(date.getFullYear(), date.getMonth() + 1, 1),
    }
  })
}

type DashboardData = {
  totalClientes: number
  totalProcessos: number
  totalTarefas: number
  prazosAbertos: number
  processosNovos: number
  clientesNovos: number
  prazosUrgentes: Array<{
    id: string
    titulo: string | null
    dataFinal: Date
    processo: {
      numero: string | null
      cliente: { nomeCompleto: string } | null
    }
  }>
  clientesRecentes: Array<{
    id: string
    nomeCompleto: string
    areaJuridica: string | null
    _count: { processos: number }
  }>
  tarefasPendentes: Array<{
    id: string
    titulo: string
    responsavel: { nome: string } | null
  }>
  monthlyProcessos: Array<{ month: string; value: number }>
  statusSummary: Array<{ label: string; count: number; variant: 'gold' | 'warning' | 'info' | 'danger' }>
}

async function getDashboardData(escritorioId: string, periodo: string): Promise<DashboardData> {
  const agora = new Date()
  const inicio = getPeriodoInicio(periodo)
  const limite48h = new Date(agora.getTime() + 48 * 60 * 60 * 1000)

  const months = getChartMonths()
  const monthlyCounts = await Promise.all(
    months.map((month) =>
      prisma.processo.count({
        where: { escritorioId, createdAt: { gte: month.start, lt: month.end } },
      })
    )
  )

  const processosStatus = await prisma.processo.groupBy({
    by: ['status'],
    where: { escritorioId },
    _count: { _all: true },
  })

  const statusSummary = processosStatus.map((item) => ({
    label: statusLabelMap[item.status] ?? item.status,
    count: item._count._all,
    variant:
      item.status === 'EM_ANDAMENTO'
        ? 'gold'
        : item.status === 'AGUARDANDO_CLIENTE' || item.status === 'AGUARDANDO_PECA'
          ? 'warning'
          : item.status === 'SUSPENSO'
            ? 'info'
            : 'danger',
  }))

  const [
    totalClientes,
    totalProcessos,
    totalTarefas,
    prazosAbertos,
    processosNovos,
    clientesNovos,
    prazosUrgentes,
    clientesRecentes,
    tarefasPendentes,
  ] = await Promise.all([
    prisma.cliente.count({ where: { escritorioId, status: 'ATIVO' } }),
    prisma.processo.count({ where: { escritorioId, status: 'EM_ANDAMENTO' } }),
    prisma.tarefa.count({ where: { escritorioId, status: { in: ['A_FAZER', 'EM_ANDAMENTO'] } } }),
    prisma.prazo.count({ where: { processo: { escritorioId }, status: 'ABERTO' } }),
    prisma.processo.count({ where: { escritorioId, createdAt: { gte: inicio } } }),
    prisma.cliente.count({ where: { escritorioId, createdAt: { gte: inicio } } }),
    prisma.prazo.findMany({
      where: { processo: { escritorioId }, status: 'ABERTO', dataFinal: { lte: limite48h } },
      orderBy: { dataFinal: 'asc' },
      take: 5,
      include: {
        processo: {
          select: {
            numero: true,
            cliente: { select: { nomeCompleto: true } },
          },
        },
      },
    }),
    prisma.cliente.findMany({
      where: { escritorioId, createdAt: { gte: inicio } },
      orderBy: { createdAt: 'desc' },
      take: 6,
      select: {
        id: true,
        nomeCompleto: true,
        areaJuridica: true,
        _count: { select: { processos: true } },
      },
    }),
    prisma.tarefa.findMany({
      where: { escritorioId, status: { in: ['A_FAZER', 'EM_ANDAMENTO'] } },
      orderBy: [{ prioridade: 'desc' }, { dataVencimento: 'asc' }],
      take: 8,
      include: { responsavel: { select: { nome: true } } },
    }),
  ])

  return {
    totalClientes,
    totalProcessos,
    totalTarefas,
    prazosAbertos,
    processosNovos,
    clientesNovos,
    prazosUrgentes,
    clientesRecentes,
    tarefasPendentes,
    monthlyProcessos: months.map((month, index) => ({ month: month.label, value: monthlyCounts[index] })),
    statusSummary,
  }
}

function getEmptyDashboardData(): DashboardData {
  const months = getChartMonths()

  return {
    totalClientes: 0,
    totalProcessos: 0,
    totalTarefas: 0,
    prazosAbertos: 0,
    processosNovos: 0,
    clientesNovos: 0,
    prazosUrgentes: [],
    clientesRecentes: [],
    tarefasPendentes: [],
    monthlyProcessos: months.map((month) => ({ month: month.label, value: 0 })),
    statusSummary: [],
  }
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ periodo?: string }>
}) {
  const { periodo: rawPeriodo } = await searchParams
  const periodo = periodoOptions.find((option) => option.value === rawPeriodo)?.value ?? 'este-mes'

  const session = await auth()
  const userData = session?.user as (typeof session.user & { escritorioId?: string }) | undefined
  const escritorioId = userData?.escritorioId ?? ''

  let data = getEmptyDashboardData()
  let databaseUnavailable = false

  try {
    data = await getDashboardData(escritorioId, periodo)
  } catch {
    databaseUnavailable = true
  }

  const cardStats = [
    {
      label: 'Processos ativos',
      value: data.totalProcessos,
      icon: FileText,
      iconColor: 'gold' as const,
      sub: data.processosNovos > 0 ? `+ ${data.processosNovos} em ${periodoLabel[periodo]}` : `Nenhum novo em ${periodoLabel[periodo]}`,
      trend: data.processosNovos > 0 ? ('positive' as const) : ('neutral' as const),
      progress: data.totalProcessos > 0 ? Math.min(Math.round((data.processosNovos / Math.max(data.totalProcessos, 1)) * 100 + 40), 100) : 0,
      badge: data.processosNovos > 0 ? { text: 'Ativo', variant: 'success' as const } : undefined,
    },
    {
      label: 'Clientes ativos',
      value: data.totalClientes,
      icon: Users,
      iconColor: 'blue' as const,
      sub: data.clientesNovos > 0 ? `+ ${data.clientesNovos} em ${periodoLabel[periodo]}` : `Nenhum novo em ${periodoLabel[periodo]}`,
      trend: data.clientesNovos > 0 ? ('positive' as const) : ('neutral' as const),
      progress: data.totalClientes > 0 ? 78 : 0,
      badge: data.totalClientes > 0 ? { text: 'Ativos', variant: 'success' as const } : undefined,
    },
    {
      label: 'Prazos criticos',
      value: data.prazosUrgentes.length,
      icon: Clock,
      iconColor: 'red' as const,
      sub: 'Proximas 48h',
      trend: data.prazosUrgentes.length > 0 ? ('negative' as const) : ('neutral' as const),
      progress: data.prazosUrgentes.length > 0 ? 88 : 0,
      badge: data.prazosUrgentes.length > 0 ? { text: 'Urgente', variant: 'danger' as const } : { text: 'OK', variant: 'success' as const },
    },
    {
      label: 'Tarefas abertas',
      value: data.totalTarefas,
      icon: CheckSquare,
      iconColor: 'green' as const,
      sub: `${data.prazosAbertos} prazo${data.prazosAbertos !== 1 ? 's' : ''} em aberto`,
      trend: 'neutral' as const,
      progress: data.totalTarefas > 0 ? 65 : 0,
      badge: data.totalTarefas > 0 ? { text: 'Em andamento', variant: 'warning' as const } : undefined,
    },
  ]

  return (
    <div className="page-enter relative min-h-[calc(100vh-60px)] overflow-hidden pb-16">
      <ParticlesBackground />
      <div className="relative z-10 px-6 py-8 xl:px-10">
        {databaseUnavailable ? (
          <div className="mb-6 rounded-3xl border border-danger/30 bg-danger/10 px-5 py-4 text-sm text-danger">
            Nao foi possivel carregar os dados do dashboard porque a conexao com o banco esta indisponivel no momento.
          </div>
        ) : null}

        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.32em] text-muted-foreground">Painel de controle</p>
            <h1 className="mt-3 text-3xl font-semibold text-foreground">Resumo operacional</h1>
          </div>
          <div className="flex flex-wrap gap-3">
            {periodoOptions.map((option) => (
              <Link
                key={option.value}
                href={`/dashboard?periodo=${option.value}`}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  periodo === option.value ? 'bg-gold text-black shadow-lg shadow-gold/15' : 'bg-white/5 text-foreground hover:bg-white/10'
                }`}
              >
                {option.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {cardStats.map((item, index) => (
            <StatCard
              key={item.label}
              icon={<item.icon size={18} />}
              label={item.label}
              value={item.value}
              sub={item.sub}
              trend={item.trend}
              iconColor={item.iconColor}
              index={index}
              progress={item.progress}
              badge={item.badge}
            />
          ))}
        </div>

        <div className="mt-8 grid gap-6 xl:grid-cols-[1.9fr_1fr]">
          <GlassCard title="Processos criados" badge={{ text: 'Ultimos 6 meses', variant: 'gold' }}>
            <AnimatedChart data={data.monthlyProcessos} />
          </GlassCard>

          <div className="flex flex-col gap-6">
            <GlassCard title="Distribuicao de processos" badge={{ text: 'Status', variant: 'blue' }}>
              {data.statusSummary.length === 0 ? (
                <div className="rounded-3xl bg-white/5 p-6 text-center text-sm text-muted-foreground">
                  Sem dados disponiveis para distribuicao de processos.
                </div>
              ) : (
                <div className="space-y-4">
                  {data.statusSummary.map((item) => (
                    <AnimatedProgress
                      key={item.label}
                      value={item.count}
                      max={Math.max(data.totalProcessos, 1)}
                      label={item.label}
                      showPercentage
                      variant={item.variant}
                    />
                  ))}
                </div>
              )}
            </GlassCard>

            <GlassCard
              title="Prazos urgentes"
              badge={{ text: `${data.prazosUrgentes.length} agora`, variant: data.prazosUrgentes.length > 0 ? 'red' : 'green' }}
            >
              {data.prazosUrgentes.length === 0 ? (
                <div className="rounded-3xl bg-white/5 p-6 text-center text-sm text-muted-foreground">
                  Nenhum prazo urgente nas proximas 48 horas.
                </div>
              ) : (
                <div className="space-y-4">
                  {data.prazosUrgentes.map((prazo) => {
                    const dias = getDiasRestantes(prazo.dataFinal)
                    const statusLabel = dias < 0 ? 'Vencido' : dias === 0 ? 'Hoje' : dias === 1 ? 'Amanha' : `${dias} dias`

                    return (
                      <div key={prazo.id} className="rounded-3xl border border-white/10 bg-white/5 p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-sm font-semibold text-foreground">{prazo.titulo || 'Prazo sem titulo'}</p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              Processo {prazo.processo.numero || 'Sem numero'} - {prazo.processo.cliente?.nomeCompleto ?? 'Cliente nao informado'}
                            </p>
                          </div>
                          <span className={`rounded-full px-3 py-1 text-[11px] font-semibold ${dias <= 1 ? 'bg-danger text-white' : 'bg-warning text-black'}`}>
                            {statusLabel}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </GlassCard>
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <GlassCard title="Ultimos clientes cadastrados" badge={{ text: 'Recente', variant: 'amber' }}>
            <div className="space-y-4">
              {data.clientesRecentes.length === 0 ? (
                <div className="rounded-3xl bg-white/5 p-6 text-center text-sm text-muted-foreground">Nenhum cliente recente disponivel.</div>
              ) : (
                data.clientesRecentes.map((cliente) => (
                  <div key={cliente.id} className="flex items-center justify-between gap-4 rounded-3xl border border-white/10 bg-white/5 p-4">
                    <div>
                      <p className="font-semibold text-foreground">{cliente.nomeCompleto}</p>
                      <p className="text-xs text-muted-foreground">{areaLabels[cliente.areaJuridica ?? 'OUTRO']}</p>
                    </div>
                    <span className="text-xs font-medium text-muted-foreground">{cliente._count.processos} processos</span>
                  </div>
                ))
              )}
            </div>
          </GlassCard>

          <GlassCard title="Acompanhamento rapido" badge={{ text: 'Visao geral', variant: 'green' }}>
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-foreground">Tarefas em aberto</p>
                  <p className="text-xs text-muted-foreground">Atualizado em tempo real</p>
                </div>
                <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold text-muted-foreground">{data.totalTarefas} itens</span>
              </div>
              <AnimatedProgress value={data.totalTarefas} max={Math.max(data.totalTarefas, 10)} label="Capacidade de resposta" showPercentage variant="info" />
              <div className="space-y-3">
                {data.tarefasPendentes.length === 0 ? (
                  <div className="rounded-3xl bg-white/5 p-6 text-center text-sm text-muted-foreground">Nenhuma tarefa em aberto disponivel.</div>
                ) : (
                  data.tarefasPendentes.slice(0, 4).map((tarefa) => (
                    <div key={tarefa.id} className="rounded-3xl border border-white/10 bg-white/5 p-4">
                      <p className="font-semibold text-foreground">{tarefa.titulo}</p>
                      <p className="text-xs text-muted-foreground">Responsavel: {tarefa.responsavel?.nome ?? 'Nao atribuido'}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  )
}
