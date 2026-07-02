import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Pencil, Plus } from 'lucide-react'
import { formatDocumento, formatTelefone } from '@/lib/utils'
import AtendimentosSection from '@/components/shared/AtendimentosSection'
import DocumentosSection from '@/components/shared/DocumentosSection'

const areaLabels: Record<string, string> = {
  TRABALHISTA: 'Trabalhista', CIVIL: 'Cível', TRIBUTARIO: 'Tributário',
  PREVIDENCIARIO: 'Previdenciário', CRIMINAL: 'Criminal', FAMILIA: 'Família',
  EMPRESARIAL: 'Empresarial', CONSUMIDOR: 'Consumidor', AMBIENTAL: 'Ambiental', OUTRO: 'Outro',
}

const statusConfig: Record<string, { label: string; color: string }> = {
  ATIVO:                  { label: 'Ativo',         color: 'bg-success-bg text-success' },
  INATIVO:                { label: 'Inativo',        color: 'bg-white/8 text-muted-foreground' },
  PROSPECTO:              { label: 'Prospecto',      color: 'bg-info-bg text-info' },
  DOCUMENTACAO_PENDENTE:  { label: 'Doc. Pendente',  color: 'bg-warning-bg text-warning' },
}

const faseConfig: Record<string, { label: string; color: string }> = {
  CONHECIMENTO: { label: 'Conhecimento', color: 'bg-info-bg text-info' },
  RECURSAL:     { label: 'Recursal',     color: 'bg-warning-bg text-warning' },
  EXECUCAO:     { label: 'Execução',     color: 'bg-gold/12 text-gold' },
  ENCERRADO:    { label: 'Encerrado',    color: 'bg-white/8 text-muted-foreground' },
}

const statusProcessoConfig: Record<string, { label: string; color: string }> = {
  EM_ANDAMENTO:           { label: 'Em andamento', color: 'bg-success-bg text-success' },
  AGUARDANDO_PECA:        { label: 'Aguard. Peça', color: 'bg-warning-bg text-warning' },
  AGUARDANDO_CLIENTE:     { label: 'Aguard. Cliente', color: 'bg-info-bg text-info' },
  SUSPENSO:               { label: 'Suspenso',     color: 'bg-white/8 text-muted-foreground' },
  ENCERRADO_PROCEDENTE:   { label: 'Procedente',   color: 'bg-success-bg text-success' },
  ENCERRADO_IMPROCEDENTE: { label: 'Improcedente', color: 'bg-danger-bg text-danger' },
  ARQUIVADO:              { label: 'Arquivado',    color: 'bg-white/8 text-muted-foreground' },
}

export default async function ClienteDetalhePage({
  params,
}: {
  params: { id: string }
}) {
  const session = await auth()
  const escritorioId = (session?.user as any)?.escritorioId

  const cliente = await prisma.cliente.findFirst({
    where: { id: params.id, escritorioId },
    include: {
      processos: { orderBy: { createdAt: 'desc' } },
      atendimentos: {
        orderBy: { data: 'desc' },
        include: { usuario: { select: { id: true, nome: true } } },
      },
      documentos: { orderBy: { createdAt: 'desc' } },
      lancamentos: { orderBy: { createdAt: 'desc' }, take: 5 },
      _count: { select: { processos: true, documentos: true } },
    },
  })

  if (!cliente) notFound()

  const status = statusConfig[cliente.status]
  const doc = cliente.cpf || cliente.cnpj

  return (
    <div className="page-enter px-6 py-8 xl:px-10">

      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-4">
          <Link
            href="/clientes"
            className="mt-0.5 shrink-0 text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <p className="text-[10px] uppercase tracking-[0.36em] text-muted-foreground">Clientes</p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold text-foreground">{cliente.nomeCompleto}</h1>
              <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${status.color}`}>
                {status.label}
              </span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {cliente.tipo === 'PESSOA_FISICA' ? 'Pessoa Física' : 'Pessoa Jurídica'}
              {doc && ` · ${formatDocumento(doc)}`}
            </p>
          </div>
        </div>

        <Link
          href={`/clientes/${cliente.id}/editar`}
          className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-white/10"
        >
          <Pencil size={14} />
          Editar cliente
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Coluna principal */}
        <div className="flex flex-col gap-5 lg:col-span-2">

          {/* Dados pessoais */}
          <section className="rounded-xl border border-white/10 bg-white/5 p-5">
            <h2 className="mb-4 text-sm font-semibold text-foreground">Dados Pessoais</h2>
            <div className="grid grid-cols-2 gap-4">
              <Info label="Nome Completo" value={cliente.nomeCompleto} />
              {cliente.cpf  && <Info label="CPF"  value={formatDocumento(cliente.cpf)} />}
              {cliente.cnpj && <Info label="CNPJ" value={formatDocumento(cliente.cnpj)} />}
              {cliente.rg   && <Info label="RG"   value={cliente.rg} />}
              {cliente.dataNascimento && (
                <Info label="Data de Nascimento" value={new Date(cliente.dataNascimento).toLocaleDateString('pt-BR')} />
              )}
              {cliente.razaoSocial && <Info label="Razão Social" value={cliente.razaoSocial} />}
            </div>
          </section>

          {/* Contato */}
          <section className="rounded-xl border border-white/10 bg-white/5 p-5">
            <h2 className="mb-4 text-sm font-semibold text-foreground">Contato</h2>
            <div className="grid grid-cols-2 gap-4">
              <Info label="E-mail"    value={cliente.email    || '—'} />
              <Info label="Telefone"  value={cliente.telefone  ? formatTelefone(cliente.telefone)  : '—'} />
              <Info label="WhatsApp"  value={cliente.whatsapp  ? formatTelefone(cliente.whatsapp)  : '—'} />
            </div>
          </section>

          {/* Endereço */}
          {(cliente.logradouro || cliente.cidade) && (
            <section className="rounded-xl border border-white/10 bg-white/5 p-5">
              <h2 className="mb-4 text-sm font-semibold text-foreground">Endereço</h2>
              <div className="grid grid-cols-2 gap-4">
                {cliente.logradouro && (
                  <Info
                    label="Logradouro"
                    value={`${cliente.logradouro}${cliente.numero ? ', ' + cliente.numero : ''}`}
                  />
                )}
                {cliente.complemento && <Info label="Complemento" value={cliente.complemento} />}
                {cliente.bairro     && <Info label="Bairro"       value={cliente.bairro} />}
                {cliente.cidade     && (
                  <Info label="Cidade / Estado" value={`${cliente.cidade}${cliente.estado ? '/' + cliente.estado : ''}`} />
                )}
                {cliente.cep && <Info label="CEP" value={cliente.cep} />}
              </div>
            </section>
          )}

          {/* Processos */}
          <section className="rounded-xl border border-white/10 bg-white/5">
            <div className="flex items-center justify-between border-b border-white/8 px-5 py-4">
              <span className="text-sm font-semibold text-foreground">
                Processos ({cliente._count.processos})
              </span>
              <Link
                href={`/processos/novo?clienteId=${cliente.id}`}
                className="flex items-center gap-1 text-xs font-medium text-gold hover:text-gold-light transition-colors"
              >
                <Plus size={12} /> Novo processo
              </Link>
            </div>
            {cliente.processos.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">Nenhum processo vinculado</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[480px]">
                  <thead>
                    <tr className="border-b border-white/8 bg-white/3">
                      <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">Número</th>
                      <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground hidden md:table-cell">Tribunal</th>
                      <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground hidden sm:table-cell">Fase</th>
                      <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cliente.processos.map((p) => {
                      const f  = faseConfig[p.fase]
                      const sp = statusProcessoConfig[p.status]
                      return (
                        <tr key={p.id} className="border-b border-white/6 last:border-0 transition-colors hover:bg-white/4">
                          <td className="px-5 py-3 text-sm font-medium">
                            <Link href={`/processos/${p.id}`} className="text-gold hover:text-gold-light transition-colors">
                              {p.numero || 'Sem número'}
                            </Link>
                          </td>
                          <td className="px-5 py-3 text-sm text-muted-foreground hidden md:table-cell">{p.tribunal || '—'}</td>
                          <td className="px-5 py-3 hidden sm:table-cell">
                            <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${f.color}`}>{f.label}</span>
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

          {/* Atendimentos */}
          <AtendimentosSection
            clienteId={cliente.id}
            atendimentosIniciais={cliente.atendimentos.map(a => ({
              id: a.id,
              tipo: a.tipo,
              descricao: a.descricao,
              data: a.data.toISOString(),
              usuario: a.usuario ? { id: a.usuario.id, nome: a.usuario.nome } : null,
            }))}
          />

          {/* Documentos */}
          <DocumentosSection
            clienteId={cliente.id}
            documentosIniciais={cliente.documentos.map(d => ({
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
          {/* Dados do caso */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-5">
            <h2 className="mb-4 text-sm font-semibold text-foreground">Dados do Caso</h2>
            <div className="flex flex-col gap-4">
              <Info label="Área Jurídica" value={cliente.areaJuridica ? areaLabels[cliente.areaJuridica] : '—'} />
              <Info label="Origem"        value={cliente.origemCliente?.replace(/_/g, ' ') || '—'} />
              <Info label="Status"        value={status.label} />
              <Info label="Cliente desde" value={new Date(cliente.createdAt).toLocaleDateString('pt-BR')} />
              {cliente.valorContrato && (
                <Info
                  label="Valor do Contrato"
                  value={`R$ ${Number(cliente.valorContrato).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                />
              )}
              {cliente.dataContrato && (
                <Info label="Data do Contrato" value={new Date(cliente.dataContrato).toLocaleDateString('pt-BR')} />
              )}
            </div>
          </div>

          {/* Resumo */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-5">
            <h2 className="mb-4 text-sm font-semibold text-foreground">Resumo</h2>
            <div className="flex flex-col gap-3">
              <ResumoItem label="Processos"  value={cliente._count.processos} />
              <ResumoItem label="Documentos" value={cliente._count.documentos} />
            </div>
          </div>

          {/* Observações */}
          {cliente.observacoes && (
            <div className="rounded-xl border border-white/10 bg-white/5 p-5">
              <h2 className="mb-3 text-sm font-semibold text-foreground">Observações</h2>
              <p className="text-sm leading-relaxed text-foreground/80">{cliente.observacoes}</p>
            </div>
          )}
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
