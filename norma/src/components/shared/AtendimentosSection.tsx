'use client'

import { useState, useEffect } from 'react'
import { Phone, Plus, X, Trash2 } from 'lucide-react'

const TIPOS = [
  { value: 'REUNIAO',    label: 'Reunião' },
  { value: 'LIGACAO',    label: 'Ligação' },
  { value: 'EMAIL',      label: 'E-mail' },
  { value: 'WHATSAPP',   label: 'WhatsApp' },
  { value: 'PRESENCIAL', label: 'Presencial' },
  { value: 'OUTRO',      label: 'Outro' },
]

const tipoIcons: Record<string, string> = {
  REUNIAO: '🤝', LIGACAO: '📞', EMAIL: '✉️',
  WHATSAPP: '💬', PRESENCIAL: '🏢', OUTRO: '📋',
}

interface Atendimento {
  id: string
  tipo: string
  descricao: string
  data: string
  usuario: { id: string; nome: string } | null
}

interface Props {
  clienteId?: string
  leadId?: string
  atendimentosIniciais: Atendimento[]
}

export default function AtendimentosSection({ clienteId, leadId, atendimentosIniciais }: Props) {
  const [atendimentos, setAtendimentos] = useState(atendimentosIniciais)

  useEffect(() => {
    if (atendimentosIniciais.length > 0) return
    const qs = clienteId ? `clienteId=${clienteId}` : leadId ? `leadId=${leadId}` : null
    if (!qs) return
    fetch(`/api/atendimentos?${qs}`)
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setAtendimentos(data) })
      .catch(() => {})
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clienteId, leadId])
  const [mostrando, setMostrando] = useState(false)
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const [confirmando, setConfirmando] = useState<Record<string, boolean>>({})
  const [form, setForm] = useState({ tipo: 'REUNIAO', descricao: '', data: new Date().toISOString().slice(0, 10) })

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  }

  async function handleSalvar(e: React.FormEvent) {
    e.preventDefault()
    if (!form.descricao.trim()) return
    setLoading(true)
    setErro('')
    try {
      const res = await fetch('/api/atendimentos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, clienteId, leadId }),
      })
      if (!res.ok) throw new Error()
      const novo = await res.json()
      setAtendimentos(prev => [novo, ...prev])
      setForm({ tipo: 'REUNIAO', descricao: '', data: new Date().toISOString().slice(0, 10) })
      setMostrando(false)
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
      await fetch(`/api/atendimentos/${id}`, { method: 'DELETE' })
      setAtendimentos(prev => prev.filter(a => a.id !== id))
    } catch {}
    setConfirmando(p => ({ ...p, [id]: false }))
  }

  return (
    <section className="rounded-xl border border-white/10 bg-white/5">
      <div className="flex items-center justify-between border-b border-white/8 px-5 py-4">
        <div className="flex items-center gap-2">
          <Phone size={14} className="text-muted-foreground" />
          <span className="text-sm font-semibold text-foreground">Atendimentos ({atendimentos.length})</span>
        </div>
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
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide mb-1 text-muted-foreground">Tipo</label>
              <select
                name="tipo"
                value={form.tipo}
                onChange={handleChange}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-foreground outline-none transition focus:border-[rgba(184,150,42,0.4)]"
              >
                {TIPOS.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide mb-1 text-muted-foreground">Data</label>
              <input
                type="date"
                name="data"
                value={form.data}
                onChange={handleChange}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-foreground outline-none transition focus:border-[rgba(184,150,42,0.4)]"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide mb-1 text-muted-foreground">Descrição *</label>
            <textarea
              name="descricao"
              value={form.descricao}
              onChange={handleChange}
              placeholder="Descreva o atendimento..."
              rows={2}
              required
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-foreground outline-none transition focus:border-[rgba(184,150,42,0.4)] resize-none"
            />
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
              disabled={loading || !form.descricao.trim()}
              className="rounded-lg px-4 py-2 text-sm font-semibold text-black disabled:opacity-50 hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #d4af37, #B8962A)' }}
            >
              {loading ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      )}

      {atendimentos.length === 0 ? (
        <div className="p-8 text-center text-sm text-muted-foreground">Nenhum atendimento registrado.</div>
      ) : (
        <div className="divide-y divide-white/6">
          {atendimentos.map(a => (
            <div key={a.id} className="flex items-start gap-3 px-5 py-3">
              <span className="text-base mt-0.5">{tipoIcons[a.tipo] ?? '📋'}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground/90 leading-snug">{a.descricao}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {TIPOS.find(t => t.value === a.tipo)?.label ?? a.tipo}
                  {a.usuario ? ` · ${a.usuario.nome}` : ''}
                  {' · '}{new Date(a.data).toLocaleDateString('pt-BR')}
                </p>
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
