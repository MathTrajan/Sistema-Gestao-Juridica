'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { AlertTriangle, Pencil, Trash2, X, CalendarClock, CheckCircle2, Filter, Search } from 'lucide-react'
import { GlassCard } from '@/components/dashboard/glass-card'
import { cn } from '@/lib/utils'

const tipoPrazoLabels: Record<string, string> = {
  RECURSO: 'Recurso',
  CONTESTACAO: 'Contestacao',
  MANIFESTACAO: 'Manifestacao',
  REPLICA: 'Replica',
  APELACAO: 'Apelacao',
  CONTRARRAZOES: 'Contrarrazoes',
  EMBARGOS: 'Embargos',
  OUTRO: 'Outro',
}

const statusConfig: Record<string, { label: string; color: string }> = {
  ABERTO: { label: 'Aberto', color: 'bg-warning-bg text-warning' },
  CUMPRIDO: { label: 'Cumprido', color: 'bg-success-bg text-success' },
  PERDIDO: { label: 'Perdido', color: 'bg-danger-bg text-danger' },
  SUSPENSO: { label: 'Suspenso', color: 'bg-white/8 text-muted-foreground' },
}

function getDiasRestantes(dataFinal: string) {
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  const final = new Date(dataFinal)
  final.setHours(0, 0, 0, 0)
  return Math.ceil((final.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24))
}

interface Prazo {
  id: string
  titulo: string
  tipo: string
  dataInicio: string
  dataFinal: string
  diasUteis: number | null
  status: string
  observacoes: string | null
  processo: {
    id: string
    numero: string | null
    cliente: { nomeCompleto: string }
  }
}

const inputClass = 'w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-gold/30'
const labelClass = 'mb-1 block text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground'

export default function PrazosClient({ prazos: inicial }: { prazos: Prazo[] }) {
  const router = useRouter()
  const [prazos, setPrazos] = useState(inicial)
  const [editando, setEditando] = useState<Prazo | null>(null)
  const [confirmandoDeletar, setConfirmandoDeletar] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const [busca, setBusca] = useState('')
  const [filtroStatus, setFiltroStatus] = useState('')

  const [form, setForm] = useState({
    titulo: '',
    tipo: 'OUTRO',
    dataInicio: '',
    dataFinal: '',
    status: 'ABERTO',
    observacoes: '',
  })

  const criticos = useMemo(
    () => prazos.filter((prazo) => prazo.status === 'ABERTO' && getDiasRestantes(prazo.dataFinal) <= 2),
    [prazos]
  )
  const concluidos = useMemo(
    () => prazos.filter((prazo) => prazo.status === 'CUMPRIDO').length,
    [prazos]
  )
  const emAberto = useMemo(
    () => prazos.filter((prazo) => prazo.status === 'ABERTO').length,
    [prazos]
  )

  const prazosFiltrados = useMemo(() => {
    const q = busca.trim().toLowerCase()
    return prazos.filter((prazo) => {
      const matchBusca = !q ||
        prazo.titulo.toLowerCase().includes(q) ||
        prazo.processo.cliente.nomeCompleto.toLowerCase().includes(q) ||
        prazo.processo.numero?.toLowerCase().includes(q)
      const matchStatus = !filtroStatus || prazo.status === filtroStatus
      return matchBusca && matchStatus
    })
  }, [prazos, busca, filtroStatus])

  function abrirEditar(prazo: Prazo) {
    setForm({
      titulo: prazo.titulo,
      tipo: prazo.tipo,
      dataInicio: prazo.dataInicio.slice(0, 10),
      dataFinal: prazo.dataFinal.slice(0, 10),
      status: prazo.status,
      observacoes: prazo.observacoes ?? '',
    })
    setEditando(prazo)
    setErro('')
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSalvar(e: React.FormEvent) {
    e.preventDefault()
    if (!editando) return
    setLoading(true)
    setErro('')

    try {
      const res = await fetch(`/api/prazos/${editando.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      if (!res.ok) throw new Error()

      setPrazos((prev) =>
        prev.map((prazo) =>
          prazo.id === editando.id
            ? {
                ...prazo,
                ...form,
                dataInicio: new Date(form.dataInicio).toISOString(),
                dataFinal: new Date(form.dataFinal).toISOString(),
              }
            : prazo
        )
      )

      setEditando(null)
      router.refresh()
    } catch {
      setErro('Erro ao salvar. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  async function handleDeletar(id: string) {
    if (!confirmandoDeletar[id]) {
      setConfirmandoDeletar((prev) => ({ ...prev, [id]: true }))
      setTimeout(() => {
        setConfirmandoDeletar((prev) => {
          const next = { ...prev }
          delete next[id]
          return next
        })
      }, 3000)
      return
    }

    setConfirmandoDeletar((prev) => {
      const next = { ...prev }
      delete next[id]
      return next
    })

    const res = await fetch(`/api/prazos/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setPrazos((prev) => prev.filter((prazo) => prazo.id !== id))
      router.refresh()
    }
  }

  const miniCards = [
    { icon: AlertTriangle, value: criticos.length, label: 'Críticos 48h', bg: 'rgba(239,68,68,0.15)', color: '#f87171', glow: 'rgba(239,68,68,0.2)', delay: 0 },
    { icon: CalendarClock, value: emAberto,         label: 'Em aberto',   bg: 'rgba(245,158,11,0.15)', color: '#fbbf24', glow: 'rgba(245,158,11,0.2)', delay: 0.07 },
    { icon: CheckCircle2, value: concluidos,         label: 'Cumpridos',   bg: 'rgba(16,185,129,0.15)', color: '#34d399', glow: 'rgba(16,185,129,0.2)', delay: 0.14 },
  ]

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        {miniCards.map(({ icon: Icon, value, label, bg, color, glow, delay }) => (
          <motion.div
            key={label}
            className="glass-card hover-lift rounded-3xl p-5 cursor-default"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay, ease: [0.22,1,0.36,1] }}
          >
            <div className="flex items-center gap-4">
              <motion.div
                className="flex h-12 w-12 items-center justify-center rounded-2xl"
                style={{ background: bg, color, border: `1px solid ${color}30` }}
                whileHover={{ scale: 1.12, rotate: 6, boxShadow: `0 0 20px ${glow}` }}
                transition={{ type: 'spring', stiffness: 380, damping: 16 }}
              >
                <Icon size={20} />
              </motion.div>
              <div>
                <motion.p
                  className="text-2xl font-bold"
                  style={{
                    background: `linear-gradient(135deg, #FFFFFF, ${color})`,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                  initial={{ scale: 0.85 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: delay + 0.2, type: 'spring' }}
                >
                  {value}
                </motion.p>
                <p className="text-[11px] uppercase tracking-[0.22em]" style={{ color: 'var(--text3)' }}>{label}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {criticos.length > 0 ? (
        <div className="flex items-center gap-3 rounded-2xl border border-danger/30 bg-danger/10 p-4">
          <AlertTriangle size={18} className="shrink-0 text-danger" />
          <span className="text-sm font-medium text-danger">
            {criticos.length} prazo{criticos.length !== 1 ? 's' : ''} vence{criticos.length === 1 ? '' : 'm'} nas proximas 48 horas. Verifique imediatamente.
          </span>
        </div>
      ) : null}

      {/* Busca e filtro */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={busca}
            onChange={e => setBusca(e.target.value)}
            placeholder="Buscar por título, cliente, número do processo..."
            className="w-full rounded-2xl border border-white/10 bg-white/5 py-3 pl-11 pr-4 text-sm text-foreground outline-none transition focus:border-gold/35 focus:bg-white/8"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex h-12 items-center rounded-2xl border border-white/10 bg-white/5 px-4 text-muted-foreground">
            <Filter size={14} />
          </span>
          <select
            value={filtroStatus}
            onChange={e => setFiltroStatus(e.target.value)}
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-foreground outline-none transition focus:border-gold/35"
          >
            <option value="">Todos os status</option>
            <option value="ABERTO">Aberto</option>
            <option value="CUMPRIDO">Cumprido</option>
            <option value="PERDIDO">Perdido</option>
            <option value="SUSPENSO">Suspenso</option>
          </select>
        </div>
      </div>

      <GlassCard
        title="Agenda de prazos"
        badge={{ text: `${prazosFiltrados.length} itens`, variant: 'gold' }}
        action={
          <span className="inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1 text-xs text-muted-foreground">
            <Filter size={12} />
            Ordenado por vencimento
          </span>
        }
      >
        {prazos.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-16 text-center">
            <div className="mb-4 text-gold">
              <CalendarClock className="mx-auto" size={32} />
            </div>
            <div className="font-medium text-foreground">Nenhum prazo cadastrado</div>
            <div className="mt-1 text-sm text-muted-foreground">Use o botao Novo Prazo para comecar.</div>
          </div>
        ) : (
          <div className="space-y-4">
            {prazosFiltrados.length === 0 && prazos.length > 0 ? (
              <div className="rounded-3xl border border-white/10 bg-white/5 p-10 text-center text-sm text-muted-foreground">
                Nenhum prazo corresponde aos filtros selecionados.
              </div>
            ) : null}
            {prazosFiltrados.map((prazo, index) => {
              const status = statusConfig[prazo.status]
              const dias = getDiasRestantes(prazo.dataFinal)
              const critico = prazo.status === 'ABERTO' && dias <= 2
              const atencao = prazo.status === 'ABERTO' && dias > 2 && dias <= 5
              const confirmando = !!confirmandoDeletar[prazo.id]

              return (
                <motion.div
                  key={prazo.id}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.04 }}
                  className={cn(
                    'rounded-3xl border p-5 transition-colors',
                    critico ? 'border-danger/35 bg-danger/10' : atencao ? 'border-warning/30 bg-warning/10' : 'border-white/10 bg-white/5 hover:bg-white/7'
                  )}
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-3">
                        <p className="text-sm font-semibold text-foreground">{prazo.titulo}</p>
                        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${status.color}`}>{status.label}</span>
                        <span className="rounded-full bg-white/8 px-2.5 py-1 text-xs font-medium text-muted-foreground">
                          {tipoPrazoLabels[prazo.tipo]}
                        </span>
                      </div>

                      <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                        <p>
                          Cliente: <span className="text-foreground">{prazo.processo.cliente.nomeCompleto}</span>
                        </p>
                        <p>
                          Processo:{' '}
                          <Link href={`/processos/${prazo.processo.id}`} className="font-medium text-gold hover:text-gold-light">
                            {prazo.processo.numero || 'Sem numero'}
                          </Link>
                        </p>
                        {prazo.observacoes ? <p className="text-xs text-muted-foreground">{prazo.observacoes}</p> : null}
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 lg:items-end">
                      <div className="text-right">
                        <p className={cn('text-lg font-semibold', critico ? 'text-danger' : atencao ? 'text-warning' : 'text-foreground')}>
                          {new Date(prazo.dataFinal).toLocaleDateString('pt-BR')}
                        </p>
                        <p className={cn('text-xs font-medium', critico ? 'text-danger' : atencao ? 'text-warning' : 'text-muted-foreground')}>
                          {prazo.status === 'ABERTO'
                            ? dias < 0
                              ? 'Vencido'
                              : dias === 0
                                ? 'Hoje'
                                : `${dias} dia${dias !== 1 ? 's' : ''}`
                            : 'Concluido'}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => abrirEditar(prazo)}
                          title="Editar"
                          className="rounded-2xl border border-white/10 bg-white/5 p-2 text-muted-foreground transition-colors hover:border-gold/30 hover:bg-white/10 hover:text-gold"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => handleDeletar(prazo.id)}
                          title={confirmando ? 'Clique para confirmar exclusao' : 'Excluir'}
                          className={cn(
                            'rounded-2xl border px-3 py-2 text-xs font-semibold transition-colors',
                            confirmando
                              ? 'border-danger/40 bg-danger/15 text-danger'
                              : 'border-white/10 bg-white/5 text-muted-foreground hover:border-danger/30 hover:bg-danger/10 hover:text-danger'
                          )}
                        >
                          {confirmando ? 'Confirmar?' : <Trash2 size={14} />}
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </GlassCard>

      {editando ? (
        <motion.div
          className="modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="modal-content lg"
            initial={{ scale: 0.94, y: 16, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.94, y: 16, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
          >
            <div className="modal-header">
              <h2 className="text-base font-semibold text-white">Editar prazo</h2>
              <button onClick={() => setEditando(null)} className="text-muted-foreground hover:text-white">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSalvar} className="modal-body">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className={labelClass}>Titulo *</label>
                  <input name="titulo" value={form.titulo} onChange={handleChange} className={inputClass} required />
                </div>
                <div>
                  <label className={labelClass}>Tipo</label>
                  <select name="tipo" value={form.tipo} onChange={handleChange} className={inputClass}>
                    <option value="RECURSO">Recurso</option>
                    <option value="CONTESTACAO">Contestacao</option>
                    <option value="MANIFESTACAO">Manifestacao</option>
                    <option value="REPLICA">Replica</option>
                    <option value="APELACAO">Apelacao</option>
                    <option value="CONTRARRAZOES">Contrarrazoes</option>
                    <option value="EMBARGOS">Embargos</option>
                    <option value="OUTRO">Outro</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Status</label>
                  <select name="status" value={form.status} onChange={handleChange} className={inputClass}>
                    <option value="ABERTO">Aberto</option>
                    <option value="CUMPRIDO">Cumprido</option>
                    <option value="PERDIDO">Perdido</option>
                    <option value="SUSPENSO">Suspenso</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Data de inicio *</label>
                  <input type="date" name="dataInicio" value={form.dataInicio} onChange={handleChange} className={inputClass} required />
                </div>
                <div>
                  <label className={labelClass}>Data final *</label>
                  <input type="date" name="dataFinal" value={form.dataFinal} onChange={handleChange} className={inputClass} required />
                </div>
                <div className="col-span-2">
                  <label className={labelClass}>Observacoes</label>
                  <textarea name="observacoes" value={form.observacoes} onChange={handleChange} className={inputClass} rows={2} />
                </div>
              </div>

              {erro ? <div className="rounded-2xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger mb-4">{erro}</div> : null}

              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => setEditando(null)}
                  className="flex-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-foreground hover:bg-white/10"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 rounded-2xl bg-gold px-4 py-2.5 text-sm font-medium text-black hover:bg-gold-light disabled:opacity-50"
                >
                  {loading ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      ) : null}
    </div>
  )
}
