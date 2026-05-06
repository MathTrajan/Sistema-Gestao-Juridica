import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { formatDocumento, formatTelefone } from '@/lib/utils'
import { Users, FileText, UserCheck } from 'lucide-react'
import { StatCard } from '@/components/dashboard/stat-card'
import { GlassCard } from '@/components/dashboard/glass-card'

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

const statusConfig: Record<string, { label: string; color: string }> = {
  ATIVO: { label: 'Ativo', color: 'bg-success-bg text-success' },
  INATIVO: { label: 'Inativo', color: 'bg-white/8 text-muted-foreground' },
  PROSPECTO: { label: 'Prospecto', color: 'bg-info-bg text-info' },
  DOCUMENTACAO_PENDENTE: { label: 'Doc. pendente', color: 'bg-warning-bg text-warning' },
}

export default async function ClientesPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>
}) {
  const { search } = await searchParams
  const session = await auth()
  const userData = session?.user as (typeof session.user & { escritorioId?: string }) | undefined
  const escritorioId = userData?.escritorioId

  const clientes = await prisma.cliente
    .findMany({
      where: {
        escritorioId,
        ...(search
          ? {
              OR: [
                { nomeCompleto: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
                { cpf: { contains: search } },
                { cnpj: { contains: search } },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { processos: true } },
      },
    })
    .catch(() => [])

  const ativos = clientes.filter((cliente) => cliente.status === 'ATIVO').length
  const comProcessos = clientes.filter((cliente) => cliente._count.processos > 0).length
  const limite = new Date()
  limite.setDate(limite.getDate() - 30)
  const novos30d = clientes.filter((cliente) => cliente.createdAt >= limite).length

  return (
    <div className="page-enter px-6 py-8 xl:px-10">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.32em] text-muted-foreground">Relacionamento</p>
          <h1 className="mt-3 text-3xl font-semibold text-foreground">Carteira de clientes</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Visualize status, contatos e volume de processos em um painel unico.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <StatCard icon={<Users size={18} />} label="Clientes cadastrados" value={clientes.length} sub={`${ativos} ativos hoje`} iconColor="gold" />
        <StatCard icon={<FileText size={18} />} label="Com processos" value={comProcessos} sub="Clientes com acompanhamento em curso" iconColor="blue" index={1} />
        <StatCard icon={<UserCheck size={18} />} label="Entradas recentes" value={novos30d} sub="Cadastros nos ultimos 30 dias" iconColor="green" index={2} />
      </div>

      {search ? (
        <div className="mt-6 flex items-center gap-3 rounded-2xl border border-gold/20 bg-gold/8 px-4 py-3 text-sm text-gold">
          <span>
            Resultados para: <strong>{search}</strong>
          </span>
          <Link href="/clientes" className="text-xs font-semibold uppercase tracking-[0.24em] text-gold-light hover:text-gold">
            Limpar
          </Link>
        </div>
      ) : null}

      <div className="mt-6">
        <GlassCard title="Base de clientes" badge={{ text: `${clientes.length} registros`, variant: 'gold' }}>
          {clientes.length === 0 ? (
            <div className="rounded-3xl border border-white/10 bg-white/5 p-16 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-white/6 text-gold">
                <Users size={30} />
              </div>
              <div className="font-medium text-foreground">Nenhum cliente cadastrado</div>
              <div className="mt-1 text-sm text-muted-foreground">Use o botao Novo Cliente para comecar.</div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px]">
                <thead>
                  <tr className="border-b border-white/10 bg-white/3">
                    <th className="px-5 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">Nome</th>
                    <th className="px-5 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground hidden lg:table-cell">Documento</th>
                    <th className="px-5 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground hidden lg:table-cell">Contato</th>
                    <th className="px-5 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground hidden sm:table-cell">Area</th>
                    <th className="px-5 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground hidden md:table-cell">Processos</th>
                    <th className="px-5 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">Status</th>
                    <th className="px-5 py-4" />
                  </tr>
                </thead>
                <tbody>
                  {clientes.map((cliente) => {
                    const status = statusConfig[cliente.status]
                    const doc = cliente.cpf || cliente.cnpj

                    return (
                      <tr key={cliente.id} className="border-b border-white/6 transition-colors hover:bg-white/4">
                        <td className="px-5 py-3">
                          <div className="text-sm font-medium text-foreground">{cliente.nomeCompleto}</div>
                          <div className="mt-0.5 text-xs text-muted-foreground">
                            {cliente.tipo === 'PESSOA_FISICA' ? 'Pessoa fisica' : 'Pessoa juridica'}
                          </div>
                        </td>
                        <td className="px-5 py-3 text-sm text-slate-300 hidden lg:table-cell">{doc ? formatDocumento(doc) : '-'}</td>
                        <td className="px-5 py-3 hidden lg:table-cell">
                          <div className="text-sm text-slate-200">{cliente.telefone ? formatTelefone(cliente.telefone) : '-'}</div>
                          <div className="text-xs text-muted-foreground">{cliente.email || 'Sem email'}</div>
                        </td>
                        <td className="px-5 py-3 hidden sm:table-cell">
                          {cliente.areaJuridica ? (
                            <span className="rounded-full bg-info-bg px-2.5 py-1 text-xs font-medium text-info">
                              {areaLabels[cliente.areaJuridica]}
                            </span>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td className="px-5 py-3 text-sm font-semibold text-foreground hidden md:table-cell">{cliente._count.processos}</td>
                        <td className="px-5 py-3">
                          <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${status.color}`}>{status.label}</span>
                        </td>
                        <td className="px-5 py-3">
                          <Link
                            href={`/clientes/${cliente.id}`}
                            className="text-xs font-semibold uppercase tracking-[0.24em] text-gold hover:text-gold-light"
                          >
                            Ver
                          </Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  )
}
