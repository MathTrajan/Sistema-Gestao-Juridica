'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  useDroppable,
  closestCorners,
  type DragStartEvent,
  type DragOverEvent,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  Plus,
  X,
  AlarmClock,
  AlertTriangle,
  Calendar,
  Briefcase,
  Check,
  LayoutGrid,
} from 'lucide-react'

// Cores e identidade visual por coluna — não usa PageHeader/KpiCard genéricos.
const COLUMNS = [
  { id: 'A_FAZER',            label: 'A fazer',             color: '#94A3B8', accent: 'rgba(148,163,184,0.10)', border: 'rgba(148,163,184,0.22)' },
  { id: 'EM_ANDAMENTO',       label: 'Em andamento',        color: '#3B82F6', accent: 'rgba(59,130,246,0.10)',  border: 'rgba(59,130,246,0.30)'  },
  { id: 'AGUARDANDO_REVISAO', label: 'Aguardando revisão',  color: '#F59E0B', accent: 'rgba(245,158,11,0.10)',  border: 'rgba(245,158,11,0.30)'  },
  { id: 'CONCLUIDO',          label: 'Concluído',           color: '#22C55E', accent: 'rgba(34,197,94,0.10)',   border: 'rgba(34,197,94,0.30)'   },
] as const

type ColumnId = (typeof COLUMNS)[number]['id']

const PRIO: Record<string, { label: string; color: string }> = {
  URGENTE: { label: 'Urgente', color: '#EF4444' },
  ALTA:    { label: 'Alta',    color: '#F59E0B' },
  NORMAL:  { label: 'Normal',  color: '#3B82F6' },
  BAIXA:   { label: 'Baixa',   color: '#94A3B8' },
}

interface Tarefa {
  id: string
  titulo: string
  descricao: string | null
  status: string
  prioridade: string
  dataVencimento: string | null
  createdAt: string
  responsavel: { id: string; nome: string } | null
  processo: { id: string; numero: string | null; cliente: { nomeCompleto: string } } | null
  prazo: { id: string; titulo: string } | null
}

function getInitials(nome: string) {
  const p = nome.trim().split(/\s+/).filter(Boolean)
  if (p.length === 0) return '–'
  if (p.length === 1) return p[0]!.slice(0, 2).toUpperCase()
  return (p[0]![0]! + p[p.length - 1]![0]!).toUpperCase()
}

function diasAte(iso: string): number {
  const a = new Date(iso); a.setHours(0, 0, 0, 0)
  const h = new Date();    h.setHours(0, 0, 0, 0)
  return Math.round((a.getTime() - h.getTime()) / 86_400_000)
}

function prazoBadge(d: number) {
  if (d < 0)   return { color: '#EF4444', label: `${Math.abs(d)}d atraso`, icon: AlertTriangle }
  if (d === 0) return { color: '#EF4444', label: 'Vence hoje',             icon: AlarmClock }
  if (d <= 3)  return { color: '#F59E0B', label: `Em ${d}d`,               icon: AlarmClock }
  if (d <= 7)  return { color: '#F59E0B', label: `Em ${d}d`,               icon: Calendar }
  return         { color: '#94A3B8', label: `Em ${d}d`,                    icon: Calendar }
}

// ---------- Card ----------
function TarefaCard({
  tarefa,
  isOverlay = false,
  onToggle,
}: {
  tarefa: Tarefa
  isOverlay?: boolean
  onToggle?: (id: string) => void
}) {
  const prio = PRIO[tarefa.prioridade] ?? PRIO.NORMAL!
  const prz = tarefa.dataVencimento ? prazoBadge(diasAte(tarefa.dataVencimento)) : null
  const concluido = tarefa.status === 'CONCLUIDO'

  return (
    <div
      className={`relative rounded-xl border bg-[#161616] p-3 transition ${
        isOverlay ? 'shadow-2xl shadow-black/60 ring-1 ring-gold/30' : 'border-white/8 hover:border-white/20'
      }`}
      style={{ borderLeftColor: prio.color, borderLeftWidth: 3 }}
    >
      <div className="flex items-start gap-2">
        <button
          onClick={(e) => {
            e.stopPropagation()
            onToggle?.(tarefa.id)
          }}
          onPointerDown={(e) => e.stopPropagation()}
          className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition ${
            concluido
              ? 'border-emerald-400/60 bg-emerald-400/20 text-emerald-400'
              : 'border-white/20 hover:border-white/50'
          }`}
          aria-label={concluido ? 'Reabrir tarefa' : 'Marcar concluída'}
        >
          {concluido && <Check size={11} />}
        </button>

        <div className="min-w-0 flex-1">
          <p
            className={`text-sm font-medium leading-snug ${
              concluido ? 'text-muted-foreground line-through' : 'text-foreground'
            }`}
          >
            {tarefa.titulo}
          </p>
          {tarefa.descricao && (
            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground/80">{tarefa.descricao}</p>
          )}
        </div>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        {prz && (
          <span
            className="inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px] font-medium"
            style={{ color: prz.color, borderColor: `${prz.color}40`, background: `${prz.color}10` }}
          >
            <prz.icon size={9} /> {prz.label}
          </span>
        )}
        {tarefa.processo?.numero && (
          <span
            className="inline-flex items-center gap-1 rounded-full border border-gold/25 bg-gold/8 px-1.5 py-0.5 font-mono text-[10px] text-gold"
            title={`Processo ${tarefa.processo.numero} — ${tarefa.processo.cliente.nomeCompleto}`}
          >
            <Briefcase size={9} /> {tarefa.processo.numero.slice(-7)}
          </span>
        )}
      </div>

      <div className="mt-2 flex items-center justify-between">
        <span className="text-[9px] uppercase tracking-[0.18em] text-muted-foreground/60">
          {prio.label}
        </span>
        {tarefa.responsavel ? (
          <div
            className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold uppercase"
            style={{
              background: 'rgba(184,150,42,0.15)',
              color: '#d4af37',
              border: '1px solid rgba(184,150,42,0.30)',
            }}
            title={tarefa.responsavel.nome}
          >
            {getInitials(tarefa.responsavel.nome)}
          </div>
        ) : (
          <div className="h-6 w-6 rounded-full border border-dashed border-white/15" title="Sem responsável" />
        )}
      </div>
    </div>
  )
}

function SortableCard({
  tarefa,
  onToggle,
}: {
  tarefa: Tarefa
  onToggle: (id: string) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: tarefa.id,
    data: { type: 'card', status: tarefa.status },
  })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : 1,
  }
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TarefaCard tarefa={tarefa} onToggle={onToggle} />
    </div>
  )
}

// ---------- Coluna ----------
function Coluna({
  col,
  tarefas,
  onToggle,
  onQuickAdd,
}: {
  col: (typeof COLUMNS)[number]
  tarefas: Tarefa[]
  onToggle: (id: string) => void
  onQuickAdd: (status: ColumnId, titulo: string) => void
}) {
  const [adding, setAdding] = useState(false)
  const [titulo, setTitulo] = useState('')
  const { setNodeRef, isOver } = useDroppable({ id: col.id, data: { type: 'column', status: col.id } })

  const submit = () => {
    const t = titulo.trim()
    if (t) onQuickAdd(col.id, t)
    setTitulo('')
    setAdding(false)
  }

  return (
    <div
      className="flex w-72 shrink-0 flex-col rounded-2xl border"
      style={{ background: col.accent, borderColor: col.border }}
    >
      <div
        className="flex items-center justify-between border-b px-3 py-3"
        style={{ borderColor: col.border }}
      >
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ background: col.color }} />
          <span className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: col.color }}>
            {col.label}
          </span>
          <span className="rounded-full bg-white/8 px-1.5 py-0.5 text-[10px] font-bold text-muted-foreground">
            {tarefas.length}
          </span>
        </div>
        <button
          onClick={() => setAdding(true)}
          className="rounded-md p-1 text-muted-foreground transition hover:bg-white/10 hover:text-foreground"
          aria-label="Adicionar tarefa"
          title="Quick add"
        >
          <Plus size={14} />
        </button>
      </div>

      <SortableContext items={tarefas.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <div
          ref={setNodeRef}
          className={`flex flex-1 flex-col gap-2 overflow-y-auto p-2 transition ${
            isOver ? 'bg-white/[0.03]' : ''
          }`}
          style={{ minHeight: 120 }}
        >
          <AnimatePresence>
            {tarefas.map((t) => (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.18 }}
              >
                <SortableCard tarefa={t} onToggle={onToggle} />
              </motion.div>
            ))}
          </AnimatePresence>

          {tarefas.length === 0 && !adding && (
            <div className="flex flex-col items-center justify-center py-10 text-center text-[11px] text-muted-foreground/60">
              <p>Sem tarefas</p>
              <p className="mt-0.5">Arraste ou clique em +</p>
            </div>
          )}
        </div>
      </SortableContext>

      {adding && (
        <div className="border-t p-2" style={{ borderColor: col.border }}>
          <input
            autoFocus
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submit()
              if (e.key === 'Escape') {
                setAdding(false)
                setTitulo('')
              }
            }}
            placeholder="Título da tarefa…"
            className="w-full rounded-lg border border-white/10 bg-[#0F0F0F] px-2 py-1.5 text-sm text-foreground outline-none focus:border-gold/30"
          />
          <div className="mt-2 flex items-center gap-1.5">
            <button
              onClick={submit}
              style={{ background: 'linear-gradient(135deg, #d4af37, #B8962A)' }}
              className="rounded-md px-2.5 py-1 text-xs font-semibold text-black"
            >
              Adicionar
            </button>
            <button
              onClick={() => {
                setAdding(false)
                setTitulo('')
              }}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ---------- Board ----------
export default function TarefasClientV2({ tarefas: tarefasIniciais }: { tarefas: Tarefa[] }) {
  const router = useRouter()
  const [tarefas, setTarefas] = useState<Tarefa[]>(tarefasIniciais)
  const [busca, setBusca] = useState('')
  const [prioFiltro, setPrioFiltro] = useState('')
  const [responsavelFiltro, setResponsavelFiltro] = useState('')
  const [activeTarefa, setActiveTarefa] = useState<Tarefa | null>(null)

  useEffect(() => {
    setTarefas(tarefasIniciais)
  }, [tarefasIniciais])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const filtradas = useMemo(() => {
    const q = busca.toLowerCase().trim()
    return tarefas.filter((t) => {
      if (q) {
        const matches =
          t.titulo.toLowerCase().includes(q) ||
          t.descricao?.toLowerCase().includes(q) ||
          t.processo?.numero?.toLowerCase().includes(q) ||
          t.responsavel?.nome.toLowerCase().includes(q)
        if (!matches) return false
      }
      if (prioFiltro && t.prioridade !== prioFiltro) return false
      if (responsavelFiltro && t.responsavel?.id !== responsavelFiltro) return false
      return true
    })
  }, [tarefas, busca, prioFiltro, responsavelFiltro])

  const porColuna = useMemo(() => {
    const acc: Record<ColumnId, Tarefa[]> = {
      A_FAZER: [], EM_ANDAMENTO: [], AGUARDANDO_REVISAO: [], CONCLUIDO: [],
    }
    for (const t of filtradas) {
      const k = (acc[t.status as ColumnId] ?? acc.A_FAZER) as Tarefa[]
      k.push(t)
    }
    return acc
  }, [filtradas])

  const responsaveis = useMemo(() => {
    const m = new Map<string, string>()
    for (const t of tarefas) if (t.responsavel) m.set(t.responsavel.id, t.responsavel.nome)
    return Array.from(m.entries()).map(([id, nome]) => ({ id, nome }))
  }, [tarefas])

  // Resolve a coluna de um id (de card ou da própria coluna)
  const findColumn = (id: string): ColumnId | null => {
    if (COLUMNS.find((c) => c.id === id)) return id as ColumnId
    const t = tarefas.find((x) => x.id === id)
    return (t?.status as ColumnId) ?? null
  }

  const handleDragStart = (e: DragStartEvent) => {
    const t = tarefas.find((x) => x.id === e.active.id)
    if (t) setActiveTarefa(t)
  }

  // Move otimisticamente entre colunas enquanto arrasta
  const handleDragOver = (e: DragOverEvent) => {
    const { active, over } = e
    if (!over) return
    const fromCol = findColumn(active.id as string)
    const toCol = findColumn(over.id as string)
    if (!fromCol || !toCol || fromCol === toCol) return

    setTarefas((prev) => {
      const idx = prev.findIndex((t) => t.id === active.id)
      if (idx < 0) return prev
      const next = [...prev]
      next[idx] = { ...next[idx]!, status: toCol }
      return next
    })
  }

  const handleDragEnd = async (e: DragEndEvent) => {
    const { active, over } = e
    setActiveTarefa(null)
    if (!over) return

    const fromCol = findColumn(active.id as string)
    const toCol = findColumn(over.id as string)
    if (!fromCol || !toCol) return

    // Reordenação dentro da mesma coluna
    if (active.id !== over.id && fromCol === toCol) {
      setTarefas((prev) => {
        const oldIdx = prev.findIndex((t) => t.id === active.id)
        const newIdx = prev.findIndex((t) => t.id === over.id)
        if (oldIdx < 0 || newIdx < 0) return prev
        return arrayMove(prev, oldIdx, newIdx)
      })
    }

    // Persiste mudança de status (se houve)
    const tarefa = tarefas.find((t) => t.id === active.id)
    const original = tarefasIniciais.find((t) => t.id === active.id)
    if (!tarefa || tarefa.status === original?.status) return

    try {
      const res = await fetch(`/api/tarefas/${active.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titulo: tarefa.titulo,
          descricao: tarefa.descricao,
          prioridade: tarefa.prioridade,
          status: toCol,
          dataVencimento: tarefa.dataVencimento,
        }),
      })
      if (!res.ok) throw new Error()
      router.refresh()
    } catch {
      if (original) {
        setTarefas((prev) => prev.map((t) => (t.id === active.id ? original : t)))
      }
    }
  }

  const handleToggle = async (id: string) => {
    const t = tarefas.find((x) => x.id === id)
    if (!t) return
    const novoStatus = t.status === 'CONCLUIDO' ? 'A_FAZER' : 'CONCLUIDO'
    const original = { ...t }

    setTarefas((prev) => prev.map((x) => (x.id === id ? { ...x, status: novoStatus } : x)))

    try {
      const res = await fetch(`/api/tarefas/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titulo: t.titulo,
          descricao: t.descricao,
          prioridade: t.prioridade,
          status: novoStatus,
          dataVencimento: t.dataVencimento,
        }),
      })
      if (!res.ok) throw new Error()
      router.refresh()
    } catch {
      setTarefas((prev) => prev.map((x) => (x.id === id ? original : x)))
    }
  }

  const handleQuickAdd = async (status: ColumnId, titulo: string) => {
    try {
      const res = await fetch('/api/tarefas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ titulo, status, prioridade: 'NORMAL' }),
      })
      if (res.ok) router.refresh()
    } catch {
      // silencioso — usuário pode reentrar
    }
  }

  const filtrosAtivos = (busca ? 1 : 0) + (prioFiltro ? 1 : 0) + (responsavelFiltro ? 1 : 0)
  const limparFiltros = () => {
    setBusca('')
    setPrioFiltro('')
    setResponsavelFiltro('')
  }

  return (
    <div className="space-y-5">
      {/* Header com identidade Kanban — não usa PageHeader genérico */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.3em]">
            <span
              className="inline-flex items-center gap-1 rounded-md border px-2 py-0.5 font-semibold"
              style={{ background: 'rgba(59,130,246,0.10)', color: '#3B82F6', borderColor: 'rgba(59,130,246,0.30)' }}
            >
              <LayoutGrid size={10} /> Kanban
            </span>
            <span className="text-slate-500">Trello-style · drag entre colunas</span>
          </div>
          <h1 className="mt-2 text-3xl font-bold text-foreground">Tarefas</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Arraste cards entre colunas. Atualizações vão direto pro banco.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/tarefas"
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground transition hover:bg-white/10"
          >
            Voltar à v1
          </Link>
          <Link
            href="/tarefas/novo"
            style={{ background: 'linear-gradient(135deg, #d4af37, #B8962A)' }}
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-black shadow-lg shadow-gold/20 transition hover:shadow-gold/30"
          >
            <Plus size={16} /> Nova tarefa
          </Link>
        </div>
      </div>

      {/* Toolbar */}
      <div className="glass-card flex flex-wrap items-center gap-2 rounded-2xl p-3">
        <div className="relative min-w-[220px] flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por título, descrição, processo ou responsável…"
            className="w-full rounded-lg border border-white/10 bg-white/5 py-2 pl-9 pr-9 text-sm outline-none focus:border-[rgba(184,150,42,0.4)] focus:bg-white/[0.08]"
          />
          {busca && (
            <button
              onClick={() => setBusca('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="Limpar busca"
            >
              <X size={13} />
            </button>
          )}
        </div>
        <select
          value={prioFiltro}
          onChange={(e) => setPrioFiltro(e.target.value)}
          className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-foreground outline-none focus:border-[rgba(184,150,42,0.4)]"
        >
          <option value="">Todas prioridades</option>
          {Object.entries(PRIO).map(([k, v]) => (
            <option key={k} value={k}>
              {v.label}
            </option>
          ))}
        </select>
        <select
          value={responsavelFiltro}
          onChange={(e) => setResponsavelFiltro(e.target.value)}
          className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-foreground outline-none focus:border-[rgba(184,150,42,0.4)]"
        >
          <option value="">Todos responsáveis</option>
          {responsaveis.map((r) => (
            <option key={r.id} value={r.id}>
              {r.nome}
            </option>
          ))}
        </select>
        {filtrosAtivos > 0 && (
          <button
            onClick={limparFiltros}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-white/10 hover:text-foreground"
          >
            Limpar
          </button>
        )}
        <span className="ml-auto text-xs text-muted-foreground">
          {filtradas.length} de {tarefas.length}
        </span>
      </div>

      {/* Board */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-2">
          {COLUMNS.map((col) => (
            <Coluna
              key={col.id}
              col={col}
              tarefas={porColuna[col.id] ?? []}
              onToggle={handleToggle}
              onQuickAdd={handleQuickAdd}
            />
          ))}
        </div>

        <DragOverlay dropAnimation={null}>
          {activeTarefa ? (
            <div className="w-72 rotate-2 cursor-grabbing">
              <TarefaCard tarefa={activeTarefa} isOverlay />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  )
}
