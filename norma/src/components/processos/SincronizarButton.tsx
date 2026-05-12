'use client'

import { useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface Props {
  processoId: string
  temNumero: boolean
  temTribunal: boolean
  lastSyncAt: string | null
}

export default function SincronizarButton({
  processoId,
  temNumero,
  temTribunal,
  lastSyncAt,
}: Props) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  if (!temNumero || !temTribunal) return null

  async function sincronizar() {
    setLoading(true)
    try {
      const res = await fetch(`/api/processos/${processoId}/sincronizar`, {
        method: 'POST',
      })
      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error ?? 'Erro ao sincronizar com DataJud')
        return
      }

      toast.success(data.mensagem)
      router.refresh()
    } catch {
      toast.error('Erro de conexão ao sincronizar')
    } finally {
      setLoading(false)
    }
  }

  const syncLabel = lastSyncAt
    ? `Sync DataJud · ${new Date(lastSyncAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}`
    : 'Sincronizar DataJud'

  return (
    <button
      onClick={sincronizar}
      disabled={loading}
      title="Buscar movimentações no DataJud (CNJ)"
      className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
      {loading ? 'Sincronizando...' : syncLabel}
    </button>
  )
}
