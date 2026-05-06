'use client'

import { useEffect } from 'react'

export default function RootError({
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center max-w-md px-6">
        <div className="text-5xl mb-4">⚠️</div>
        <h1 className="text-xl font-semibold text-gray-800 mb-2">Algo deu errado</h1>
        <p className="text-sm text-gray-500 mb-6">
          Ocorreu um erro inesperado. Se o problema persistir, entre em contato com o suporte.
        </p>
        <button
          onClick={reset}
          className="px-5 py-2 text-sm font-medium text-white bg-green-800 rounded-lg hover:bg-green-700 transition-colors"
        >
          Tentar novamente
        </button>
      </div>
    </div>
  )
}
