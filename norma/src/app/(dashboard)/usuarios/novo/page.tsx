import UsuarioForm from '@/components/usuarios/UsuarioForm'

export default function NovoUsuarioPage() {
  return (
    <div className="page-enter px-6 py-8 xl:px-10">
      <div className="mb-8">
        <p className="text-[10px] uppercase tracking-[0.36em] text-slate-500 mb-1">Usuários</p>
        <h1 className="text-2xl font-bold text-foreground">Novo Usuário</h1>
        <p className="text-muted-foreground text-sm mt-1">Cadastre um novo membro da equipe</p>
      </div>
      <UsuarioForm />
    </div>
  )
}
