'use client'

import { useEffect } from 'react'

export default function TarefasError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <div className="text-4xl">⚠️</div>
      <h2 className="text-lg font-semibold text-gray-800">Erro ao carregar tarefas</h2>
      <p className="text-sm text-gray-500 text-center max-w-sm">
        Não foi possível carregar as tarefas. Tente novamente.
      </p>
      <button
        onClick={reset}
        className="px-4 py-2 text-sm font-medium text-white bg-green-800 rounded-lg hover:bg-green-700 transition-colors"
      >
        Tentar novamente
      </button>
    </div>
  )
}
