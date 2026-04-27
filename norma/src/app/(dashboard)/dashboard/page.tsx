import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Users, FileText, CheckSquare, Clock } from 'lucide-react'
import Link from 'next/link'

const areaLabels: Record<string, string> = {
  TRABALHISTA: 'Trabalhista', CIVIL: 'Cível', TRIBUTARIO: 'Tributário',
  PREVIDENCIARIO: 'Previdenciário', CRIMINAL: 'Criminal', FAMILIA: 'Família',
  EMPRESARIAL: 'Empresarial', CONSUMIDOR: 'Consumidor', AMBIENTAL: 'Ambiental', OUTRO: 'Outro',
}

const statusBadge: Record<string, { label: string; bg: string; color: string }> = {
  ATIVO:                  { label: 'Ativo',         bg: 'var(--accent-light)', color: 'var(--accent2)' },
  INATIVO:                { label: 'Inativo',        bg: 'var(--surface2)',     color: 'var(--text2)'   },
  PROSPECTO:              { label: 'Prospecto',      bg: 'var(--blue-light)',   color: 'var(--blue)'    },
  DOCUMENTACAO_PENDENTE:  { label: 'Doc. Pendente',  bg: 'var(--amber-light)', color: 'var(--amber)'   },
}

const prioridadeBadge: Record<string, { label: string; bg: string; color: string }> = {
  URGENTE: { label: 'Urgente', bg: 'var(--red-light)',   color: 'var(--red)'   },
  ALTA:    { label: 'Alta',    bg: 'var(--amber-light)', color: 'var(--amber)' },
  NORMAL:  { label: 'Normal',  bg: 'var(--surface2)',    color: 'var(--text2)' },
  BAIXA:   { label: 'Baixa',   bg: 'var(--blue-light)',  color: 'var(--blue)'  },
}

const periodoOptions = [
  { value: 'este-mes',        label: 'Este mês' },
  { value: 'ultimos-3-meses', label: 'Últimos 3 meses' },
  { value: 'este-ano',        label: 'Este ano' },
  { value: 'tudo',            label: 'Todo período' },
]

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

async function getDashboardData(escritorioId: string, periodo: string) {
  const agora = new Date()
  const inicio = getPeriodoInicio(periodo)
  const limite48h = new Date(agora.getTime() + 48 * 60 * 60 * 1000)

  const [
    totalClientes, totalProcessos, totalTarefas, prazosAbertos,
    processosNovos, clientesNovos,
    prazosUrgentes, clientesRecentes, tarefasPendentes,
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
            id: true, numero: true, areaJuridica: true,
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
        id: true, nomeCompleto: true, areaJuridica: true, status: true,
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
    totalClientes, totalProcessos, totalTarefas, prazosAbertos,
    processosNovos, clientesNovos, prazosUrgentes, clientesRecentes, tarefasPendentes,
  }
}

const card = {
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-lg)',
  boxShadow: 'var(--shadow)',
} as const

const periodoLabel: Record<string, string> = {
  'este-mes': 'este mês',
  'ultimos-3-meses': 'últimos 3 meses',
  'este-ano': 'este ano',
  'tudo': 'todo período',
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ periodo?: string }>
}) {
  const { periodo: rawPeriodo } = await searchParams
  const periodo = periodoOptions.find(o => o.value === rawPeriodo)?.value ?? 'este-mes'

  const session = await auth()
  const escritorioId = (session?.user as any)?.escritorioId
  const data = await getDashboardData(escritorioId, periodo)

  const stats = [
    {
      label: 'Processos Ativos',
      value: data.totalProcessos,
      icon: FileText,
      iconBg: 'var(--accent-light)', iconColor: 'var(--accent2)',
      sub: data.processosNovos > 0 ? `↑ ${data.processosNovos} em ${periodoLabel[periodo]}` : `Nenhum novo em ${periodoLabel[periodo]}`,
    },
    {
      label: 'Clientes Ativos',
      value: data.totalClientes,
      icon: Users,
      iconBg: 'var(--blue-light)', iconColor: 'var(--blue)',
      sub: data.clientesNovos > 0 ? `↑ ${data.clientesNovos} em ${periodoLabel[periodo]}` : `Nenhum novo em ${periodoLabel[periodo]}`,
    },
    {
      label: 'Prazos Críticos',
      value: data.prazosUrgentes.length,
      icon: Clock,
      iconBg: 'var(--red-light)', iconColor: 'var(--red)',
      valueColor: data.prazosUrgentes.length > 0 ? 'var(--red)' : undefined,
      sub: 'Próximas 48h',
    },
    {
      label: 'Tarefas Abertas',
      value: data.totalTarefas,
      icon: CheckSquare,
      iconBg: 'var(--gold-light)', iconColor: 'var(--gold)',
      sub: `${data.prazosAbertos} prazo${data.prazosAbertos !== 1 ? 's' : ''} em aberto`,
    },
  ]

  return (
    <div style={{ padding: '28px' }}>

      {/* Filtro de período */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '20px' }}>
        {periodoOptions.map(o => (
          <Link
            key={o.value}
            href={`/dashboard?periodo=${o.value}`}
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 500,
              textDecoration: 'none',
              background: periodo === o.value ? 'var(--accent2)' : 'var(--surface)',
              color: periodo === o.value ? '#fff' : 'var(--text2)',
              border: `1px solid ${periodo === o.value ? 'var(--accent2)' : 'var(--border)'}`,
              transition: 'all 0.15s',
            }}
          >
            {o.label}
          </Link>
        ))}
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '16px', marginBottom: '24px' }}>
        {stats.map(s => {
          const Icon = s.icon
          return (
            <div key={s.label} style={{ ...card, padding: '20px' }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '10px', marginBottom: '12px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: s.iconBg, color: s.iconColor,
              }}>
                <Icon size={18} />
              </div>
              <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {s.label}
              </div>
              <div style={{ fontSize: '28px', fontWeight: 600, color: s.valueColor ?? 'var(--text)', margin: '6px 0 4px', lineHeight: 1 }}>
                {s.value}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text3)' }}>{s.sub}</div>
            </div>
          )
        })}
      </div>

      {/* grid-main-aside */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '20px' }}>

        {/* Coluna principal */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Prazos Críticos */}
          <div style={card}>
            <div style={{ padding: '18px 20px 14px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)' }}>Prazos Críticos</span>
              {data.prazosUrgentes.length > 0 && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: 500, background: 'var(--red-light)', color: 'var(--red)' }}>
                  <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'currentColor', display: 'inline-block' }} />
                  {data.prazosUrgentes.length} urgente{data.prazosUrgentes.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>
            {data.prazosUrgentes.length === 0 ? (
              <div style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--text3)', fontSize: '13px' }}>
                Nenhum prazo urgente nas próximas 48h
              </div>
            ) : data.prazosUrgentes.map(prazo => {
              const dias = getDiasRestantes(prazo.dataFinal)
              const critico = dias <= 0
              const cor = critico ? 'var(--red)' : 'var(--amber)'
              const bg  = critico ? 'var(--red-light)' : 'var(--amber-light)'
              const label = dias < 0 ? 'Vencido' : dias === 0 ? 'Hoje' : dias === 1 ? 'Amanhã' : `${dias}d`
              return (
                <div key={prazo.id} style={{ padding: '12px 16px', borderBottom: '1px solid var(--surface2)', borderLeft: `3px solid ${cor}`, background: bg }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: cor }}>
                        {prazo.titulo} — {prazo.processo.numero || 'Sem nº'}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text3)', marginTop: '2px' }}>
                        {prazo.processo.cliente.nomeCompleto}
                        {prazo.processo.areaJuridica ? ` · ${areaLabels[prazo.processo.areaJuridica] ?? prazo.processo.areaJuridica}` : ''}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '16px' }}>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: cor }}>{label}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text3)' }}>
                        {new Date(prazo.dataFinal).toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Clientes Recentes */}
          <div style={card}>
            <div style={{ padding: '18px 20px 14px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)' }}>Clientes — {periodoLabel[periodo]}</span>
              <Link href="/clientes" style={{ fontSize: '12px', color: 'var(--accent2)', fontWeight: 500, textDecoration: 'none' }}>Ver todos</Link>
            </div>
            {data.clientesRecentes.length === 0 ? (
              <div style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--text3)', fontSize: '13px' }}>
                Nenhum cliente neste período
              </div>
            ) : data.clientesRecentes.map(c => {
              const s = statusBadge[c.status]
              return (
                <div key={c.id} style={{ padding: '12px 20px', borderBottom: '1px solid var(--surface2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: '13.5px', fontWeight: 500, color: 'var(--text)' }}>{c.nomeCompleto}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text3)', marginTop: '2px' }}>
                      {c.areaJuridica ? areaLabels[c.areaJuridica] : '—'} · {c._count.processos} processo{c._count.processos !== 1 ? 's' : ''}
                    </div>
                  </div>
                  {s && (
                    <span style={{ fontSize: '11px', fontWeight: 500, padding: '3px 8px', borderRadius: '20px', background: s.bg, color: s.color, whiteSpace: 'nowrap' }}>
                      {s.label}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Aside — Tarefas Pendentes */}
        <div style={{ ...card, display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '18px 20px 14px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)' }}>Tarefas Pendentes</span>
            <Link href="/tarefas" style={{ fontSize: '12px', color: 'var(--accent2)', fontWeight: 500, textDecoration: 'none' }}>Ver todas</Link>
          </div>
          {data.tarefasPendentes.length === 0 ? (
            <div style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--text3)', fontSize: '13px' }}>
              Nenhuma tarefa pendente
            </div>
          ) : data.tarefasPendentes.map(t => {
            const p = prioridadeBadge[t.prioridade]
            return (
              <div key={t.id} style={{ padding: '12px 20px', borderBottom: '1px solid var(--surface2)' }}>
                <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text)', marginBottom: '6px', lineHeight: 1.4 }}>
                  {t.titulo}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                  {p && (
                    <span style={{ fontSize: '11px', fontWeight: 500, padding: '2px 7px', borderRadius: '20px', background: p.bg, color: p.color }}>
                      {p.label}
                    </span>
                  )}
                  {t.responsavel && (
                    <span style={{ fontSize: '11px', color: 'var(--text3)' }}>{t.responsavel.nome}</span>
                  )}
                  {t.dataVencimento && (
                    <span style={{ fontSize: '11px', color: 'var(--text3)', marginLeft: 'auto' }}>
                      {new Date(t.dataVencimento).toLocaleDateString('pt-BR')}
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>

      </div>
    </div>
  )
}
