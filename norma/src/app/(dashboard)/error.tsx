'use client'

import { useEffect } from 'react'

export default function DashboardError({
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
      <h2 className="text-lg font-semibold text-foreground">Erro ao carregar esta seção</h2>
      <p className="text-sm text-muted-foreground text-center max-w-sm">
        Não foi possível carregar os dados. Verifique sua conexão e tente novamente.
      </p>
      {process.env.NODE_ENV === 'development' && (
        <p className="text-xs text-red-400 text-center max-w-sm font-mono bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
          {error.message}
        </p>
      )}
      <button
        onClick={reset}
        className="px-4 py-2 text-sm font-semibold text-black rounded-lg transition-all hover:opacity-90"
        style={{ background: 'linear-gradient(135deg, #d4af37, #B8962A)' }}
      >
        Tentar novamente
      </button>
    </div>
  )
}
