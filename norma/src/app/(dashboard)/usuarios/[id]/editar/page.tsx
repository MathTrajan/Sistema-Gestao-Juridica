import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import UsuarioForm from '@/components/usuarios/UsuarioForm'

export default async function EditarUsuarioPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  const escritorioId = (session?.user as any)?.escritorioId

  const usuario = await prisma.usuario.findFirst({
    where: { id, escritorioId },
  })

  if (!usuario) notFound()

  const initialData = {
    nome: usuario.nome,
    email: usuario.email,
    senha: '',
    perfil: usuario.perfil as string,
    area: usuario.area ?? '',
    oab: usuario.oab ?? '',
    telefone: usuario.telefone ?? '',
    permissoes: (usuario.permissoes as string[]) ?? ['/dashboard'],
  }

  return (
    <div className="page-enter px-6 py-8 xl:px-10">
      <div className="mb-8">
        <p className="text-[10px] uppercase tracking-[0.36em] text-slate-500 mb-1">Usuários</p>
        <h1 className="text-2xl font-bold text-foreground">Editar Usuário</h1>
        <p className="text-muted-foreground text-sm mt-1">{usuario.nome}</p>
      </div>
      <UsuarioForm usuarioId={id} initialData={initialData} />
    </div>
  )
}
