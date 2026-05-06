import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Pencil } from 'lucide-react'
import { formatDocumento, formatTelefone } from '@/lib/utils'

const areaLabels: Record<string, string> = {
  TRABALHISTA: 'Trabalhista', CIVIL: 'Cível', TRIBUTARIO: 'Tributário',
  PREVIDENCIARIO: 'Previdenciário', CRIMINAL: 'Criminal', FAMILIA: 'Família',
  EMPRESARIAL: 'Empresarial', CONSUMIDOR: 'Consumidor', AMBIENTAL: 'Ambiental', OUTRO: 'Outro',
}

const statusConfig: Record<string, { label: string; color: string }> = {
  ATIVO: { label: 'Ativo', color: 'bg-green-100 text-green-800' },
  INATIVO: { label: 'Inativo', color: 'bg-gray-100 text-gray-600' },
  PROSPECTO: { label: 'Prospecto', color: 'bg-blue-100 text-blue-800' },
  DOCUMENTACAO_PENDENTE: { label: 'Doc. Pendente', color: 'bg-amber-100 text-amber-800' },
}

const faseLabels: Record<string, string> = {
  CONHECIMENTO: 'Conhecimento', RECURSAL: 'Recursal',
  EXECUCAO: 'Execução', ENCERRADO: 'Encerrado',
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
      atendimentos: { orderBy: { createdAt: 'desc' }, take: 5 },
      lancamentos: { orderBy: { createdAt: 'desc' }, take: 5 },
      _count: { select: { processos: true, documentos: true } },
    },
  })

  if (!cliente) notFound()

  const status = statusConfig[cliente.status]
  const doc = cliente.cpf || cliente.cnpj

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link href="/clientes" className="text-gray-400 hover:text-gray-600 transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{cliente.nomeCompleto}</h1>
              <span className={`text-xs font-medium px-2 py-1 rounded-full ${status.color}`}>
                {status.label}
              </span>
            </div>
            <p className="text-gray-400 text-sm mt-0.5">
              {cliente.tipo === 'PESSOA_FISICA' ? 'Pessoa Física' : 'Pessoa Jurídica'}
              {doc && ` · ${formatDocumento(doc)}`}
            </p>
          </div>
        </div>
        <Link
          href={`/clientes/${cliente.id}/editar`}
          className="flex items-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <Pencil size={14} />
          Editar
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Coluna principal */}
        <div className="col-span-2 flex flex-col gap-5">

          {/* Dados pessoais */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Dados Pessoais</h2>
            <div className="grid grid-cols-2 gap-4">
              <Info label="Nome Completo" value={cliente.nomeCompleto} />
              {cliente.cpf && <Info label="CPF" value={formatDocumento(cliente.cpf)} />}
              {cliente.cnpj && <Info label="CNPJ" value={formatDocumento(cliente.cnpj)} />}
              {cliente.rg && <Info label="RG" value={cliente.rg} />}
              {cliente.dataNascimento && (
                <Info label="Data de Nascimento" value={new Date(cliente.dataNascimento).toLocaleDateString('pt-BR')} />
              )}
              {cliente.razaoSocial && <Info label="Razão Social" value={cliente.razaoSocial} />}
            </div>
          </div>

          {/* Contato */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Contato</h2>
            <div className="grid grid-cols-2 gap-4">
              <Info label="E-mail" value={cliente.email || '—'} />
              <Info label="Telefone" value={cliente.telefone ? formatTelefone(cliente.telefone) : '—'} />
              <Info label="WhatsApp" value={cliente.whatsapp ? formatTelefone(cliente.whatsapp) : '—'} />
            </div>
          </div>

          {/* Endereço */}
          {(cliente.logradouro || cliente.cidade) && (
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
              <h2 className="text-sm font-semibold text-gray-700 mb-4">Endereço</h2>
              <div className="grid grid-cols-2 gap-4">
                {cliente.logradouro && <Info label="Logradouro" value={`${cliente.logradouro}${cliente.numero ? ', ' + cliente.numero : ''}`} />}
                {cliente.complemento && <Info label="Complemento" value={cliente.complemento} />}
                {cliente.bairro && <Info label="Bairro" value={cliente.bairro} />}
                {cliente.cidade && <Info label="Cidade / Estado" value={`${cliente.cidade}${cliente.estado ? '/' + cliente.estado : ''}`} />}
                {cliente.cep && <Info label="CEP" value={cliente.cep} />}
              </div>
            </div>
          )}

          {/* Processos */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <span className="font-semibold text-gray-900 text-sm">
                Processos ({cliente._count.processos})
              </span>
              <Link
                href={`/processos/novo?clienteId=${cliente.id}`}
                className="text-xs text-green-700 hover:underline font-medium"
              >
                + Novo processo
              </Link>
            </div>
            {cliente.processos.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-sm">
                Nenhum processo vinculado
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-5 py-3">Número</th>
                    <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-5 py-3">Tribunal</th>
                    <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-5 py-3">Fase</th>
                    <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-5 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {cliente.processos.map((p) => (
                    <tr key={p.id} className="border-b border-gray-50 last:border-0">
                      <td className="px-5 py-3 text-sm font-medium text-green-700">
                        <Link href={`/processos/${p.id}`}>{p.numero || 'Sem número'}</Link>
                      </td>
                      <td className="px-5 py-3 text-sm text-gray-600">{p.tribunal || '—'}</td>
                      <td className="px-5 py-3 text-sm text-gray-600">{faseLabels[p.fase]}</td>
                      <td className="px-5 py-3">
                        <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full font-medium">
                          {p.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Coluna lateral */}
        <div className="flex flex-col gap-5">

          {/* Dados do caso */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Dados do Caso</h2>
            <div className="flex flex-col gap-3">
              <Info label="Área Jurídica" value={cliente.areaJuridica ? areaLabels[cliente.areaJuridica] : '—'} />
              <Info label="Origem" value={cliente.origemCliente?.replace(/_/g, ' ') || '—'} />
              <Info label="Status" value={status.label} />
              <Info label="Cliente desde" value={new Date(cliente.createdAt).toLocaleDateString('pt-BR')} />
            </div>
          </div>

          {/* Observações */}
          {cliente.observacoes && (
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
              <h2 className="text-sm font-semibold text-gray-700 mb-3">Observações</h2>
              <p className="text-sm text-gray-600 leading-relaxed">{cliente.observacoes}</p>
            </div>
          )}

          {/* Resumo */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Resumo</h2>
            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">Processos</span>
                <span className="text-sm font-bold text-gray-900">{cliente._count.processos}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">Documentos</span>
                <span className="text-sm font-bold text-gray-900">{cliente._count.documentos}</span>
              </div>
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