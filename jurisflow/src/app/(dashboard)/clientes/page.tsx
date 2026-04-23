import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { formatDocumento } from '@/lib/utils'

const areaLabels: Record<string, string> = {
  TRABALHISTA: 'Trabalhista',
  CIVIL: 'Cível',
  TRIBUTARIO: 'Tributário',
  PREVIDENCIARIO: 'Previdenciário',
  CRIMINAL: 'Criminal',
  FAMILIA: 'Família',
  EMPRESARIAL: 'Empresarial',
  CONSUMIDOR: 'Consumidor',
  AMBIENTAL: 'Ambiental',
  OUTRO: 'Outro',
}

const statusConfig: Record<string, { label: string; color: string }> = {
  ATIVO: { label: 'Ativo', color: 'bg-green-100 text-green-800' },
  INATIVO: { label: 'Inativo', color: 'bg-gray-100 text-gray-600' },
  PROSPECTO: { label: 'Prospecto', color: 'bg-blue-100 text-blue-800' },
  DOCUMENTACAO_PENDENTE: { label: 'Doc. Pendente', color: 'bg-amber-100 text-amber-800' },
}

export default async function ClientesPage() {
  const session = await auth()
  const escritorioId = (session?.user as any)?.escritorioId

  const clientes = await prisma.cliente.findMany({
    where: { escritorioId },
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { processos: true } }
    }
  })

  return (
    <div className="p-8">

      {/* Tabela */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        {clientes.length === 0 ? (
          <div className="p-16 text-center">
            <div className="text-gray-300 text-5xl mb-4">👤</div>
            <div className="text-gray-500 font-medium">Nenhum cliente cadastrado</div>
            <div className="text-gray-400 text-sm mt-1">Clique em "Novo Cliente" para começar</div>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-5 py-3">Nome</th>
                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-5 py-3">Documento</th>
                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-5 py-3">Contato</th>
                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-5 py-3">Área</th>
                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-5 py-3">Processos</th>
                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-5 py-3">Status</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {clientes.map((cliente) => {
                const status = statusConfig[cliente.status]
                const doc = cliente.cpf || cliente.cnpj
                return (
                  <tr key={cliente.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3">
                      <div className="font-medium text-gray-900 text-sm">{cliente.nomeCompleto}</div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        {cliente.tipo === 'PESSOA_FISICA' ? 'Pessoa Física' : 'Pessoa Jurídica'}
                      </div>
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-600">
                      {doc ? formatDocumento(doc) : '—'}
                    </td>
                    <td className="px-5 py-3">
                      <div className="text-sm text-gray-600">{cliente.telefone || '—'}</div>
                      <div className="text-xs text-gray-400">{cliente.email || ''}</div>
                    </td>
                    <td className="px-5 py-3">
                      {cliente.areaJuridica ? (
                        <span className="text-xs font-medium bg-blue-50 text-blue-700 px-2 py-1 rounded-full">
                          {areaLabels[cliente.areaJuridica]}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-5 py-3 text-sm font-semibold text-gray-700">
                      {cliente._count.processos}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${status.color}`}>
                        {status.label}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <Link
                        href={`/clientes/${cliente.id}`}
                        className="text-xs text-green-700 hover:underline font-medium"
                      >
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