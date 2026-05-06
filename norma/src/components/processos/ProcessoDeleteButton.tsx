'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'

export default function ProcessoDeleteButton({ processoId }: { processoId: string }) {
  const router = useRouter()
  const [confirmando, setConfirmando] = useState(false)
  const [loading, setLoading] = useState(false)

  function handleClick() {
    if (!confirmando) {
      setConfirmando(true)
      setTimeout(() => setConfirmando(false), 4000)
      return
    }
    excluir()
  }

  async function excluir() {
    setLoading(true)
    try {
      const res = await fetch(`/api/processos/${processoId}`, { method: 'DELETE' })
      if (res.ok) {
        router.push('/processos')
        router.refresh()
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      title={confirmando ? 'Clique novamente para confirmar exclusão' : 'Excluir processo'}
      className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg transition-colors disabled:opacity-50 ${
        confirmando
          ? 'bg-red-100 text-red-700 hover:bg-red-200'
          : 'text-gray-500 hover:text-red-600 hover:bg-red-50 border border-gray-200'
      }`}
    >
      <Trash2 size={13} />
      {loading ? 'Excluindo...' : confirmando ? 'Confirmar exclusão?' : 'Excluir'}
    </button>
  )
}
