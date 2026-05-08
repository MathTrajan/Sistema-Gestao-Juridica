import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import ClienteForm from '@/components/clientes/ClienteForm'

export default async function EditarClientePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  const escritorioId = (session?.user as any)?.escritorioId

  const cliente = await prisma.cliente.findFirst({
    where: { id, escritorioId },
  })

  if (!cliente) notFound()

  const initialData = {
    tipo: cliente.tipo as 'PESSOA_FISICA' | 'PESSOA_JURIDICA',
    nomeCompleto: cliente.nomeCompleto,
    cpf: cliente.cpf ?? '',
    rg: cliente.rg ?? '',
    dataNascimento: cliente.dataNascimento ? cliente.dataNascimento.toISOString().slice(0, 10) : '',
    razaoSocial: cliente.razaoSocial ?? '',
    cnpj: cliente.cnpj ?? '',
    email: cliente.email ?? '',
    telefone: cliente.telefone ?? '',
    whatsapp: cliente.whatsapp ?? '',
    cep: cliente.cep ?? '',
    logradouro: cliente.logradouro ?? '',
    numero: cliente.numero ?? '',
    complemento: cliente.complemento ?? '',
    bairro: cliente.bairro ?? '',
    cidade: cliente.cidade ?? '',
    estado: cliente.estado ?? '',
    areaJuridica: cliente.areaJuridica ?? '',
    origemCliente: cliente.origemCliente ?? '',
    status: cliente.status as 'ATIVO' | 'INATIVO' | 'PROSPECTO' | 'DOCUMENTACAO_PENDENTE',
    observacoes: cliente.observacoes ?? '',
  }

  return (
    <div className="page-enter px-6 py-8 xl:px-10">
      <div className="mb-8">
        <p className="text-[10px] uppercase tracking-[0.36em] text-slate-500 mb-1">Clientes</p>
        <h1 className="text-2xl font-bold text-foreground">Editar Cliente</h1>
        <p className="text-muted-foreground text-sm mt-1">{cliente.nomeCompleto}</p>
      </div>
      <ClienteForm clienteId={id} initialData={initialData} />
    </div>
  )
}
