import ClienteForm from '@/components/clientes/ClienteForm'

export default async function NovoClientePage({
  searchParams,
}: {
  searchParams: Promise<{ leadId?: string; nome?: string; email?: string; telefone?: string }>
}) {
  const { leadId, nome, email, telefone } = await searchParams

  const initialData = (nome || email || telefone)
    ? {
        nomeCompleto: nome,
        email: email,
        telefone: telefone,
      }
    : undefined

  return (
    <div className="page-enter px-6 py-8 xl:px-10">
      <div className="mb-8">
        <p className="text-[10px] uppercase tracking-[0.36em] text-muted-foreground mb-1">Clientes</p>
        <h1 className="text-2xl font-bold text-foreground">Novo Cliente</h1>
        {leadId && (
          <p className="text-sm text-gold mt-1">Convertendo lead — dados pré-preenchidos.</p>
        )}
        {!leadId && (
          <p className="text-muted-foreground text-sm mt-1">Preencha os dados do cliente</p>
        )}
      </div>
      <ClienteForm initialData={initialData} leadId={leadId} />
    </div>
  )
}
