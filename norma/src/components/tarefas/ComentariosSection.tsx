'use client'

import { useState, useEffect } from 'react'
import { MessageSquare, Send, Trash2 } from 'lucide-react'

interface Comentario {
  id: string
  texto: string
  createdAt: string
  usuario: { id: string; nome: string } | null
}

export default function ComentariosSection({ tarefaId }: { tarefaId: string }) {
  const [comentarios, setComentarios] = useState<Comentario[]>([])
  const [texto, setTexto] = useState('')
  const [loading, setLoading] = useState(false)
  const [carregando, setCarregando] = useState(true)
  const [confirmando, setConfirmando] = useState<Record<string, boolean>>({})

  useEffect(() => {
    fetch(`/api/tarefas/${tarefaId}/comentarios`)
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setComentarios(data) })
      .catch(() => {})
      .finally(() => setCarregando(false))
  }, [tarefaId])

  async function handleEnviar(e: React.FormEvent) {
    e.preventDefault()
    if (!texto.trim() || loading) return
    setLoading(true)
    try {
      const res = await fetch(`/api/tarefas/${tarefaId}/comentarios`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ texto: texto.trim() }),
      })
      if (res.ok) {
        const novo = await res.json()
        setComentarios(prev => [...prev, novo])
        setTexto('')
      }
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
      await fetch(`/api/tarefas/${tarefaId}/comentarios/${id}`, { method: 'DELETE' })
      setComentarios(prev => prev.filter(c => c.id !== id))
    } catch {}
    setConfirmando(p => ({ ...p, [id]: false }))
  }

  return (
    <div className="mt-5 border-t border-white/8 pt-4">
      <div className="flex items-center gap-2 mb-3">
        <MessageSquare size={14} className="text-muted-foreground" />
        <span className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
          Comentários ({comentarios.length})
        </span>
      </div>

      {carregando ? (
        <div className="text-xs text-muted-foreground py-2">Carregando...</div>
      ) : (
        <div className="space-y-2 max-h-40 overflow-y-auto mb-3 pr-1">
          {comentarios.length === 0 ? (
            <div className="text-xs text-muted-foreground/60 italic">Nenhum comentário ainda.</div>
          ) : (
            comentarios.map(c => (
              <div key={c.id} className="rounded-lg bg-white/[0.04] px-3 py-2 flex gap-2 items-start">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground/90 leading-snug">{c.texto}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {c.usuario?.nome ?? 'Sistema'} · {new Date(c.createdAt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <button
                  onClick={() => handleDeletar(c.id)}
                  className={`shrink-0 rounded px-1.5 py-1 text-xs transition-colors ${
                    confirmando[c.id]
                      ? 'bg-danger/15 text-danger'
                      : 'text-muted-foreground/30 hover:text-danger hover:bg-danger/10'
                  }`}
                >
                  {confirmando[c.id] ? '?' : <Trash2 size={11} />}
                </button>
              </div>
            ))
          )}
        </div>
      )}

      <form onSubmit={handleEnviar} className="flex gap-2">
        <input
          value={texto}
          onChange={e => setTexto(e.target.value)}
          placeholder="Adicionar comentário..."
          className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-foreground outline-none transition focus:border-[rgba(184,150,42,0.4)] focus:bg-white/[0.08]"
        />
        <button
          type="submit"
          disabled={loading || !texto.trim()}
          className="rounded-lg px-3 py-1.5 text-black disabled:opacity-40 transition-opacity hover:opacity-90"
          style={{ background: 'linear-gradient(135deg, #d4af37, #B8962A)' }}
        >
          <Send size={14} />
        </button>
      </form>
    </div>
  )
}
