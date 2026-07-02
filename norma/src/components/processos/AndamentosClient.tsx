'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, X, Trash2 } from 'lucide-react'

interface Andamento {
  id: string
  texto: string
  data: string
}

export default function AndamentosClient({
  processoId,
  andamentosIniciais,
}: {
  processoId: string
  andamentosIniciais: Andamento[]
}) {
  const router = useRouter()
  const [andamentos, setAndamentos] = useState(andamentosIniciais)
  const [mostrando, setMostrando] = useState(false)
  const [texto, setTexto] = useState('')
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const [confirmando, setConfirmando] = useState<Record<string, boolean>>({})

  async function handleSalvar(e: React.FormEvent) {
    e.preventDefault()
    if (!texto.trim()) return
    setLoading(true)
    setErro('')

    try {
      const res = await fetch(`/api/processos/${processoId}/andamentos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ texto: texto.trim() }),
      })

      if (!res.ok) throw new Error()

      const novo = await res.json()
      setAndamentos(prev => [
        { id: novo.id, texto: novo.texto, data: novo.data },
        ...prev,
      ])
      setTexto('')
      setMostrando(false)
      router.refresh()
    } catch {
      setErro('Erro ao salvar. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  async function handleDeletar(id: string) {
    if (!confirmando[id]) {
      setConfirmando(p => ({ ...p, [id]: true }))
      setTimeout(() => setConfirmando(p => ({ ...p, [id]: false })), 3000)
      return
    }
    try {
      await fetch(`/api/processos/${processoId}/andamentos/${id}`, { method: 'DELETE' })
      setAndamentos(prev => prev.filter(a => a.id !== id))
      router.refresh()
    } catch {}
    setConfirmando(p => ({ ...p, [id]: false }))
  }

  return (
    <section className="rounded-xl border border-white/10 bg-white/5">
      <div className="flex items-center justify-between border-b border-white/8 px-5 py-4">
        <span className="text-sm font-semibold text-foreground">Andamentos ({andamentos.length})</span>
        <button
          onClick={() => { setMostrando(v => !v); setErro('') }}
          className="flex items-center gap-1 text-xs font-medium text-gold hover:text-gold-light transition-colors"
        >
          {mostrando ? <X size={12} /> : <Plus size={12} />}
          {mostrando ? 'Cancelar' : 'Registrar'}
        </button>
      </div>

      {mostrando && (
        <form onSubmit={handleSalvar} className="border-b border-white/8 p-5 flex flex-col gap-3">
          <textarea
            value={texto}
            onChange={e => setTexto(e.target.value)}
            placeholder="Descreva o andamento do processo..."
            rows={3}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-foreground outline-none transition focus:border-[rgba(184,150,42,0.4)] focus:bg-white/[0.08] resize-none"
            required
          />
          {erro && (
            <div className="rounded-lg border border-danger/30 bg-danger/10 px-4 py-2 text-sm text-danger">{erro}</div>
          )}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => { setMostrando(false); setTexto(''); setErro('') }}
              className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-foreground hover:bg-white/10 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !texto.trim()}
              className="rounded-lg px-4 py-2 text-sm font-semibold text-black disabled:opacity-50 transition-opacity hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #d4af37, #B8962A)' }}
            >
              {loading ? 'Salvando...' : 'Salvar andamento'}
            </button>
          </div>
        </form>
      )}

      {andamentos.length === 0 ? (
        <div className="p-8 text-center text-sm text-muted-foreground">
          Nenhum andamento registrado. Clique em &ldquo;Registrar&rdquo; para adicionar.
        </div>
      ) : (
        <div className="p-5">
          {andamentos.map((a, i) => (
            <div
              key={a.id}
              className={`flex gap-4 ${i < andamentos.length - 1 ? 'mb-4 border-b border-white/6 pb-4' : ''}`}
            >
              <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-success" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground/90">{a.texto}</p>
                <p className="mt-1 text-xs text-muted-foreground">{new Date(a.data).toLocaleDateString('pt-BR')}</p>
              </div>
              <button
                onClick={() => handleDeletar(a.id)}
                className={`shrink-0 rounded-md px-2 py-1 text-xs transition-colors ${
                  confirmando[a.id]
                    ? 'bg-danger/15 text-danger'
                    : 'text-muted-foreground/40 hover:text-danger hover:bg-danger/10'
                }`}
              >
                {confirmando[a.id] ? '?' : <Trash2 size={12} />}
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
