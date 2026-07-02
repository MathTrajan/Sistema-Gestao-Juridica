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
  Search, Plus, X, Flame, Snowflake, Mail, Phone, TrendingUp, Filter,
} from 'lucide-react'

// Funil estilo Pipedrive / HubSpot. Cada etapa é uma coluna, somatório de R$ no header.
const STAGES = [
  { id: 'NOVO',             label: 'Novo',             color: '#3B82F6', accent: 'rgba(59,130,246,0.10)',  border: 'rgba(59,130,246,0.28)' },
  { id: 'PRIMEIRO_CONTATO', label: '1º contato',       color: '#8B5CF6', accent: 'rgba(139,92,246,0.10)',  border: 'rgba(139,92,246,0.28)' },
  { id: 'PROPOSTA_ENVIADA', label: 'Proposta',         color: '#F59E0B', accent: 'rgba(245,158,11,0.10)',  border: 'rgba(245,158,11,0.28)' },
  { id: 'NEGOCIACAO',       label: 'Negociação',       color: '#B8962A', accent: 'rgba(184,150,42,0.10)',  border: 'rgba(184,150,42,0.30)' },
  { id: 'CONVERTIDO',       label: 'Convertido',       color: '#22C55E', accent: 'rgba(34,197,94,0.10)',   border: 'rgba(34,197,94,0.28)'  },
  { id: 'PERDIDO',          label: 'Perdido',          color: '#94A3B8', accent: 'rgba(148,163,184,0.08)', border: 'rgba(148,163,184,0.22)' },
] as const

type StageId = (typeof STAGES)[number]['id']

const TEMP: Record<string, { label: string; color: string; icon: typeof Flame }> = {
  QUENTE: { label: 'Quente', color: '#EF4444', icon: Flame },
  MORNO:  { label: 'Morno',  color: '#F59E0B', icon: Flame },
  FRIO:   { label: 'Frio',   color: '#3B82F6', icon: Snowflake },
}

const AREA_LABELS: Record<string, string> = {
  TRABALHISTA: 'Trabalhista', CIVIL: 'Cível', TRIBUTARIO: 'Tributário',
  PREVIDENCIARIO: 'Previd.', CRIMINAL: 'Criminal', FAMILIA: 'Família',
  EMPRESARIAL: 'Empresarial', CONSUMIDOR: 'Consumidor', AMBIENTAL: 'Ambiental', OUTRO: 'Outro',
}

interface Lead {
  id: string
  nome: string
  email: string | null
  telefone: string | null
  areaInteresse: string | null
  origem: string | null
  etapa: string
  temperatura: string
  observacoes: string | null
  valorEstimado: number | null
  dataContato: string | null
  clienteId: string | null
  cliente: { id: string; nomeCompleto: string } | null
  createdAt: string
}

function getInitials(nome: string) {
  const p = nome.trim().split(/\s+/).filter(Boolean)
  if (p.length === 0) return '–'
  if (p.length === 1) return p[0]!.slice(0, 2).toUpperCase()
  return (p[0]![0]! + p[p.length - 1]![0]!).toUpperCase()
}

function fmtMoeda(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
}

function diasDesde(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000)
}

// ---------- Card ----------
function LeadCard({ lead, isOverlay = false }: { lead: Lead; isOverlay?: boolean }) {
  const temp = TEMP[lead.temperatura] ?? TEMP.MORNO!
  const idade = diasDesde(lead.createdAt)
  const idadeColor = idade > 30 ? '#EF4444' : idade > 14 ? '#F59E0B' : '#94A3B8'

  return (
    <div
      className={`rounded-xl border bg-[#161616] p-3 transition ${
        isOverlay ? 'shadow-2xl shadow-black/60 ring-1 ring-gold/30' : 'border-white/8 hover:border-white/20'
      }`}
      style={{ borderTopColor: temp.color, borderTopWidth: 2 }}
    >
      <div className="flex items-start gap-2">
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[11px] font-bold uppercase"
          style={{ background: `${temp.color}1A`, color: temp.color, border: `1px solid ${temp.color}40` }}
        >
          {getInitials(lead.nome)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">{lead.nome}</p>
          {lead.areaInteresse && (
            <p className="truncate text-[11px] text-muted-foreground">{AREA_LABELS[lead.areaInteresse] ?? lead.areaInteresse}</p>
          )}
        </div>
        <span
          className="inline-flex shrink-0 items-center gap-0.5 rounded-md px-1 py-0.5 text-[9px] font-bold uppercase"
          style={{ color: temp.color, background: `${temp.color}15`, border: `1px solid ${temp.color}35` }}
          title={temp.label}
        >
          <temp.icon size={9} />
        </span>
      </div>

      {lead.valorEstimado && lead.valorEstimado > 0 && (
        <div className="mt-2 flex items-baseline gap-1.5">
          <span
            className="text-lg font-bold"
            style={{
              background: 'linear-gradient(135deg, #FFFFFF, #d4af37)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            {fmtMoeda(lead.valorEstimado)}
          </span>
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground/60">estimado</span>
        </div>
      )}

      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        {lead.origem && (
          <span className="rounded-full border border-white/8 bg-white/5 px-1.5 py-0.5 text-[10px] text-muted-foreground">
            {lead.origem}
          </span>
        )}
        <span
          className="rounded-full px-1.5 py-0.5 text-[10px] font-medium"
          style={{ color: idadeColor, background: `${idadeColor}15`, border: `1px solid ${idadeColor}30` }}
          title={`Lead há ${idade} dia${idade !== 1 ? 's' : ''}`}
        >
          {idade}d
        </span>
      </div>

      <div className="mt-2 flex items-center gap-2 text-[11px] text-muted-foreground">
        {lead.email && (
          <a
            href={`mailto:${lead.email}`}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1 truncate hover:text-gold"
            title={lead.email}
          >
            <Mail size={10} /> <span className="truncate">{lead.email}</span>
          </a>
        )}
        {lead.telefone && (
          <a
            href={`tel:${lead.telefone}`}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1 hover:text-gold"
            title={lead.telefone}
          >
            <Phone size={10} />
          </a>
        )}
      </div>
    </div>
  )
}

function SortableCard({ lead }: { lead: Lead }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: lead.id,
    data: { type: 'card', etapa: lead.etapa },
  })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : 1,
  }
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <LeadCard lead={lead} />
    </div>
  )
}

// ---------- Coluna ----------
function Coluna({
  stage,
  leads,
  totalValor,
}: {
  stage: (typeof STAGES)[number]
  leads: Lead[]
  totalValor: number
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.id, data: { type: 'column', etapa: stage.id } })

  return (
    <div
      className="flex w-72 shrink-0 flex-col rounded-2xl border"
      style={{ background: stage.accent, borderColor: stage.border }}
    >
      <div className="border-b px-3 py-3" style={{ borderColor: stage.border }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full" style={{ background: stage.color }} />
            <span
              className="text-[11px] font-semibold uppercase tracking-[0.18em]"
              style={{ color: stage.color }}
            >
              {stage.label}
            </span>
            <span className="rounded-full bg-white/8 px-1.5 py-0.5 text-[10px] font-bold text-muted-foreground">
              {leads.length}
            </span>
          </div>
        </div>
        {totalValor > 0 && (
          <div className="mt-2 flex items-center gap-1 text-[11px]">
            <TrendingUp size={11} style={{ color: stage.color }} />
            <span className="font-semibold" style={{ color: stage.color }}>
              {fmtMoeda(totalValor)}
            </span>
            <span className="text-muted-foreground/60">total estimado</span>
          </div>
        )}
      </div>

      <SortableContext items={leads.map((l) => l.id)} strategy={verticalListSortingStrategy}>
        <div
          ref={setNodeRef}
          className={`flex flex-1 flex-col gap-2 overflow-y-auto p-2 transition ${isOver ? 'bg-white/[0.03]' : ''}`}
          style={{ minHeight: 140 }}
        >
          <AnimatePresence>
            {leads.map((l) => (
              <motion.div
                key={l.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.18 }}
              >
                <SortableCard lead={l} />
              </motion.div>
            ))}
          </AnimatePresence>

          {leads.length === 0 && (
            <div className="flex flex-col items-center justify-center py-10 text-center text-[11px] text-muted-foreground/60">
              <p>Sem leads</p>
              <p className="mt-0.5">Arraste cards para cá</p>
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  )
}

// ---------- Board ----------
export default function ComercialClientV2({ leads: leadsIniciais }: { leads: Lead[] }) {
  const router = useRouter()
  const [leads, setLeads] = useState<Lead[]>(leadsIniciais)
  const [busca, setBusca] = useState('')
  const [tempFiltro, setTempFiltro] = useState('')
  const [areaFiltro, setAreaFiltro] = useState('')
  const [activeLead, setActiveLead] = useState<Lead | null>(null)

  useEffect(() => {
    setLeads(leadsIniciais)
  }, [leadsIniciais])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const filtrados = useMemo(() => {
    const q = busca.toLowerCase().trim()
    return leads.filter((l) => {
      if (q) {
        const ok =
          l.nome.toLowerCase().includes(q) ||
          l.email?.toLowerCase().includes(q) ||
          l.telefone?.includes(q)
        if (!ok) return false
      }
      if (tempFiltro && l.temperatura !== tempFiltro) return false
      if (areaFiltro && l.areaInteresse !== areaFiltro) return false
      return true
    })
  }, [leads, busca, tempFiltro, areaFiltro])

  const porEtapa = useMemo(() => {
    const acc: Record<StageId, Lead[]> = {
      NOVO: [], PRIMEIRO_CONTATO: [], PROPOSTA_ENVIADA: [],
      NEGOCIACAO: [], CONVERTIDO: [], PERDIDO: [],
    }
    for (const l of filtrados) {
      const k = (acc[l.etapa as StageId] ?? acc.NOVO) as Lead[]
      k.push(l)
    }
    return acc
  }, [filtrados])

  const totalsEtapa = useMemo(() => {
    const t: Record<StageId, number> = {
      NOVO: 0, PRIMEIRO_CONTATO: 0, PROPOSTA_ENVIADA: 0,
      NEGOCIACAO: 0, CONVERTIDO: 0, PERDIDO: 0,
    }
    for (const l of filtrados) {
      if (l.valorEstimado) t[l.etapa as StageId] = (t[l.etapa as StageId] ?? 0) + l.valorEstimado
    }
    return t
  }, [filtrados])

  const pipeline = useMemo(() => {
    const ativo = filtrados.filter((l) => !['CONVERTIDO', 'PERDIDO'].includes(l.etapa))
    const valorAtivo = ativo.reduce((s, l) => s + (l.valorEstimado ?? 0), 0)
    const valorGanho = filtrados.filter((l) => l.etapa === 'CONVERTIDO').reduce((s, l) => s + (l.valorEstimado ?? 0), 0)
    const total = filtrados.length
    const convertidos = filtrados.filter((l) => l.etapa === 'CONVERTIDO').length
    const taxa = total > 0 ? Math.round((convertidos / total) * 100) : 0
    return { valorAtivo, valorGanho, taxa, ativo: ativo.length }
  }, [filtrados])

  const findColumn = (id: string): StageId | null => {
    if (STAGES.find((s) => s.id === id)) return id as StageId
    const l = leads.find((x) => x.id === id)
    return (l?.etapa as StageId) ?? null
  }

  const handleDragStart = (e: DragStartEvent) => {
    const l = leads.find((x) => x.id === e.active.id)
    if (l) setActiveLead(l)
  }

  const handleDragOver = (e: DragOverEvent) => {
    const { active, over } = e
    if (!over) return
    const fromCol = findColumn(active.id as string)
    const toCol = findColumn(over.id as string)
    if (!fromCol || !toCol || fromCol === toCol) return
    setLeads((prev) => {
      const idx = prev.findIndex((l) => l.id === active.id)
      if (idx < 0) return prev
      const next = [...prev]
      next[idx] = { ...next[idx]!, etapa: toCol }
      return next
    })
  }

  const handleDragEnd = async (e: DragEndEvent) => {
    const { active, over } = e
    setActiveLead(null)
    if (!over) return

    const fromCol = findColumn(active.id as string)
    const toCol = findColumn(over.id as string)
    if (!fromCol || !toCol) return

    if (active.id !== over.id && fromCol === toCol) {
      setLeads((prev) => {
        const a = prev.findIndex((l) => l.id === active.id)
        const b = prev.findIndex((l) => l.id === over.id)
        if (a < 0 || b < 0) return prev
        return arrayMove(prev, a, b)
      })
    }

    const lead = leads.find((l) => l.id === active.id)
    const original = leadsIniciais.find((l) => l.id === active.id)
    if (!lead || lead.etapa === original?.etapa) return

    try {
      const res = await fetch(`/api/leads/${active.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ etapa: toCol }),
      })
      if (!res.ok) throw new Error()
      router.refresh()
    } catch {
      if (original) setLeads((prev) => prev.map((l) => (l.id === active.id ? original : l)))
    }
  }

  const filtrosAtivos = (busca ? 1 : 0) + (tempFiltro ? 1 : 0) + (areaFiltro ? 1 : 0)
  const limparFiltros = () => {
    setBusca('')
    setTempFiltro('')
    setAreaFiltro('')
  }

  return (
    <div className="space-y-5">
      {/* Header com identidade Funil */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.3em]">
            <span
              className="inline-flex items-center gap-1 rounded-md border px-2 py-0.5 font-semibold"
              style={{ background: 'rgba(184,150,42,0.12)', color: '#B8962A', borderColor: 'rgba(184,150,42,0.35)' }}
            >
              <TrendingUp size={10} /> Funil
            </span>
            <span className="text-slate-500">Pipedrive-style · arraste leads entre etapas</span>
          </div>
          <h1 className="mt-2 text-3xl font-bold text-foreground">Comercial</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Pipeline de leads. Mover entre colunas atualiza a etapa direto no banco.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/comercial"
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground transition hover:bg-white/10"
          >
            Voltar à v1
          </Link>
          <Link
            href="/comercial/novo"
            style={{ background: 'linear-gradient(135deg, #d4af37, #B8962A)' }}
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-black shadow-lg shadow-gold/20"
          >
            <Plus size={16} /> Novo lead
          </Link>
        </div>
      </div>

      {/* Métricas do funil */}
      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <div className="glass-card rounded-2xl px-4 py-3">
          <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Pipeline ativo</p>
          <p
            className="mt-1 text-xl font-bold"
            style={{
              background: 'linear-gradient(135deg, #FFFFFF, #d4af37)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            {fmtMoeda(pipeline.valorAtivo)}
          </p>
          <p className="text-[10px] text-muted-foreground/60">{pipeline.ativo} leads em jogo</p>
        </div>
        <div className="glass-card rounded-2xl px-4 py-3">
          <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Convertido</p>
          <p className="mt-1 text-xl font-bold text-emerald-400">{fmtMoeda(pipeline.valorGanho)}</p>
          <p className="text-[10px] text-muted-foreground/60">ganhos no período</p>
        </div>
        <div className="glass-card rounded-2xl px-4 py-3">
          <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Taxa de conversão</p>
          <p className="mt-1 text-xl font-bold" style={{ color: pipeline.taxa >= 30 ? '#22C55E' : pipeline.taxa >= 15 ? '#F59E0B' : '#94A3B8' }}>
            {pipeline.taxa}%
          </p>
          <p className="text-[10px] text-muted-foreground/60">geral do funil</p>
        </div>
        <div className="glass-card rounded-2xl px-4 py-3">
          <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Total de leads</p>
          <p className="mt-1 text-xl font-bold text-foreground">{leads.length}</p>
          <p className="text-[10px] text-muted-foreground/60">cadastrados</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="glass-card flex flex-wrap items-center gap-2 rounded-2xl p-3">
        <div className="relative min-w-[220px] flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nome, email ou telefone…"
            className="w-full rounded-lg border border-white/10 bg-white/5 py-2 pl-9 pr-9 text-sm outline-none focus:border-[rgba(184,150,42,0.4)] focus:bg-white/[0.08]"
          />
          {busca && (
            <button
              onClick={() => setBusca('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X size={13} />
            </button>
          )}
        </div>
        <select
          value={tempFiltro}
          onChange={(e) => setTempFiltro(e.target.value)}
          className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-foreground outline-none focus:border-[rgba(184,150,42,0.4)]"
        >
          <option value="">Todas temperaturas</option>
          {Object.entries(TEMP).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
        <select
          value={areaFiltro}
          onChange={(e) => setAreaFiltro(e.target.value)}
          className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-foreground outline-none focus:border-[rgba(184,150,42,0.4)]"
        >
          <option value="">Todas áreas</option>
          {Object.entries(AREA_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        {filtrosAtivos > 0 && (
          <button
            onClick={limparFiltros}
            className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-white/10 hover:text-foreground"
          >
            <Filter size={12} /> Limpar
          </button>
        )}
        <span className="ml-auto text-xs text-muted-foreground">
          {filtrados.length} de {leads.length}
        </span>
      </div>

      {/* Funil */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-2">
          {STAGES.map((s) => (
            <Coluna
              key={s.id}
              stage={s}
              leads={porEtapa[s.id] ?? []}
              totalValor={totalsEtapa[s.id] ?? 0}
            />
          ))}
        </div>

        <DragOverlay dropAnimation={null}>
          {activeLead ? (
            <div className="w-72 rotate-2 cursor-grabbing">
              <LeadCard lead={activeLead} isOverlay />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  )
}
