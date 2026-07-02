'use client'

import { useState } from 'react'
import { FileText, Plus, X, Trash2, ExternalLink } from 'lucide-react'

interface Documento {
  id: string
  nome: string
  tipo: string | null
  url: string
  createdAt: string
}

interface Props {
  clienteId?: string
  processoId?: string
  documentosIniciais: Documento[]
}

const TIPOS = [
  { value: 'PDF', label: 'PDF' },
  { value: 'CONTRATO', label: 'Contrato' },
  { value: 'PETICAO', label: 'Petição' },
  { value: 'PROCURACAO', label: 'Procuração' },
  { value: 'SENTENCA', label: 'Sentença' },
  { value: 'DECISAO', label: 'Decisão' },
  { value: 'RECURSO', label: 'Recurso' },
  { value: 'PLANILHA', label: 'Planilha' },
  { value: 'IMAGEM', label: 'Imagem' },
  { value: 'OUTRO', label: 'Outro' },
]

export default function DocumentosSection({ clienteId, processoId, documentosIniciais }: Props) {
  const [documentos, setDocumentos] = useState(documentosIniciais)
  const [mostrando, setMostrando] = useState(false)
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const [confirmando, setConfirmando] = useState<Record<string, boolean>>({})
  const [form, setForm] = useState({ nome: '', url: '', tipo: 'PDF' })

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  }

  async function handleSalvar(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nome.trim() || !form.url.trim()) return
    setLoading(true)
    setErro('')
    try {
      const res = await fetch('/api/documentos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, clienteId, processoId }),
      })
      if (!res.ok) throw new Error()
      const novo = await res.json()
      setDocumentos(prev => [novo, ...prev])
      setForm({ nome: '', url: '', tipo: 'PDF' })
      setMostrando(false)
    } catch {
      setErro('Erro ao salvar. Verifique os dados.')
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
      await fetch(`/api/documentos/${id}`, { method: 'DELETE' })
      setDocumentos(prev => prev.filter(d => d.id !== id))
    } catch {}
    setConfirmando(p => ({ ...p, [id]: false }))
  }

  return (
    <section className="rounded-xl border border-white/10 bg-white/5">
      <div className="flex items-center justify-between border-b border-white/8 px-5 py-4">
        <div className="flex items-center gap-2">
          <FileText size={14} className="text-muted-foreground" />
          <span className="text-sm font-semibold text-foreground">Documentos ({documentos.length})</span>
        </div>
        <button
          onClick={() => { setMostrando(v => !v); setErro('') }}
          className="flex items-center gap-1 text-xs font-medium text-gold hover:text-gold-light transition-colors"
        >
          {mostrando ? <X size={12} /> : <Plus size={12} />}
          {mostrando ? 'Cancelar' : 'Adicionar link'}
        </button>
      </div>

      {mostrando && (
        <form onSubmit={handleSalvar} className="border-b border-white/8 p-5 flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wide mb-1 text-muted-foreground">Nome do documento *</label>
              <input
                name="nome"
                value={form.nome}
                onChange={handleChange}
                placeholder="Ex: Contrato de honorários 2024"
                required
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-foreground outline-none transition focus:border-[rgba(184,150,42,0.4)]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide mb-1 text-muted-foreground">Tipo</label>
              <select
                name="tipo"
                value={form.tipo}
                onChange={handleChange}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-foreground outline-none transition focus:border-[rgba(184,150,42,0.4)]"
              >
                {TIPOS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide mb-1 text-muted-foreground">URL / Link *</label>
              <input
                name="url"
                value={form.url}
                onChange={handleChange}
                placeholder="https://drive.google.com/..."
                required
                type="url"
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-foreground outline-none transition focus:border-[rgba(184,150,42,0.4)]"
              />
            </div>
          </div>
          {erro && <div className="rounded-lg border border-danger/30 bg-danger/10 px-4 py-2 text-sm text-danger">{erro}</div>}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setMostrando(false)}
              className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-foreground hover:bg-white/10 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !form.nome.trim() || !form.url.trim()}
              className="rounded-lg px-4 py-2 text-sm font-semibold text-black disabled:opacity-50 hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #d4af37, #B8962A)' }}
            >
              {loading ? 'Salvando...' : 'Adicionar'}
            </button>
          </div>
        </form>
      )}

      {documentos.length === 0 ? (
        <div className="p-8 text-center text-sm text-muted-foreground">Nenhum documento vinculado.</div>
      ) : (
        <div className="divide-y divide-white/6">
          {documentos.map(d => (
            <div key={d.id} className="flex items-center gap-3 px-5 py-3">
              <FileText size={16} className="shrink-0 text-muted-foreground/60" />
              <div className="flex-1 min-w-0">
                <a
                  href={d.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-gold hover:text-gold-light transition-colors flex items-center gap-1 truncate"
                >
                  {d.nome}
                  <ExternalLink size={11} className="shrink-0" />
                </a>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {d.tipo ?? 'Outro'} · {new Date(d.createdAt).toLocaleDateString('pt-BR')}
                </p>
              </div>
              <button
                onClick={() => handleDeletar(d.id)}
                className={`shrink-0 rounded-md px-2 py-1 text-xs transition-colors ${
                  confirmando[d.id]
                    ? 'bg-danger/15 text-danger'
                    : 'text-muted-foreground/40 hover:text-danger hover:bg-danger/10'
                }`}
              >
                {confirmando[d.id] ? '?' : <Trash2 size={12} />}
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
