import ClienteForm from '@/components/clientes/ClienteForm'

export default function NovoClientePage() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Novo Cliente</h1>
        <p className="text-gray-500 text-sm mt-1">Preencha os dados do cliente</p>
      </div>
      <ClienteForm />
    </div>
  )
}