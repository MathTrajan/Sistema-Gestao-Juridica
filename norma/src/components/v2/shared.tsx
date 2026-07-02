'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowUpDown, AlarmClock, AlertTriangle, Calendar, Sparkles } from 'lucide-react'

export function getInitials(nome: string) {
  const parts = nome.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '–'
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase()
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase()
}

export function diasAte(iso: string): number {
  const alvo = new Date(iso)
  const hoje = new Date()
  alvo.setHours(0, 0, 0, 0)
  hoje.setHours(0, 0, 0, 0)
  return Math.round((alvo.getTime() - hoje.getTime()) / 86_400_000)
}

export function isNovo(iso: string): boolean {
  return Date.now() - new Date(iso).getTime() < 86_400_000
}

export function fmtData(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })
}

export function fmtMoeda(valor: number): string {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export type Urgencia = { label: string; color: string; bg: string; border: string; icon: typeof AlarmClock }

export function prazoBadge(d: number): Urgencia {
  if (d < 0) return { label: `${Math.abs(d)}d vencido`, color: '#EF4444', bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.35)', icon: AlertTriangle }
  if (d === 0) return { label: 'Hoje', color: '#EF4444', bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.35)', icon: AlarmClock }
  if (d <= 3) return { label: `Em ${d}d`, color: '#F59E0B', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.35)', icon: AlarmClock }
  if (d <= 7) return { label: `Em ${d}d`, color: '#F59E0B', bg: 'rgba(245,158,11,0.10)', border: 'rgba(245,158,11,0.30)', icon: Calendar }
  return { label: `Em ${d}d`, color: '#9CA3AF', bg: 'rgba(156,163,175,0.10)', border: 'rgba(156,163,175,0.25)', icon: Calendar }
}

export function useDensidade(key: string): ['confortavel' | 'compacto', (v: 'confortavel' | 'compacto') => void] {
  const [d, setD] = useState<'confortavel' | 'compacto'>('confortavel')
  useEffect(() => {
    const saved = localStorage.getItem(key)
    if (saved === 'compacto' || saved === 'confortavel') setD(saved)
  }, [key])
  useEffect(() => { localStorage.setItem(key, d) }, [key, d])
  return [d, setD]
}

export function useEscape(callback: () => void, enabled: boolean) {
  useEffect(() => {
    if (!enabled) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') callback() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [callback, enabled])
}

export function PageHeader({
  badge,
  title,
  subtitle,
  actions,
}: {
  badge?: string
  title: string
  subtitle?: string
  actions?: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.36em] text-slate-500">
          <Sparkles size={11} className="text-gold" />
          <span>{badge || 'Pré-visualização · v2'}</span>
        </div>
        <h1 className="mt-2 text-3xl font-bold text-foreground">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  )
}

export type KpiCardProps = {
  icon: React.ComponentType<{ size?: number }>
  value: number | string
  label: string
  hint?: string
  color: string
  bg: string
  progress?: number
  delay?: number
}

export function KpiCard({ icon: Icon, value, label, hint, color, bg, progress, delay = 0 }: KpiCardProps) {
  return (
    <motion.div
      className="glass-card hover-lift relative overflow-hidden rounded-3xl p-5"
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="flex items-start justify-between">
        <div
          className="flex h-11 w-11 items-center justify-center rounded-2xl"
          style={{ background: bg, color, border: `1px solid ${color}40` }}
        >
          <Icon size={18} />
        </div>
        {hint && (
          <span className="text-[10px] font-semibold uppercase tracking-[0.22em]" style={{ color }}>
            {hint}
          </span>
        )}
      </div>
      <div className="mt-4">
        <p
          className="text-3xl font-bold"
          style={{
            background: `linear-gradient(135deg, currentColor, ${color})`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          {value}
        </p>
        <p className="mt-1 text-[11px] uppercase tracking-[0.22em] text-muted-foreground">{label}</p>
      </div>
      {typeof progress === 'number' && (
        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/5">
          <motion.div
            className="h-full rounded-full"
            style={{ background: `linear-gradient(90deg, ${color}66, ${color})` }}
            initial={{ width: 0 }}
            animate={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
            transition={{ duration: 0.9, delay: 0.2 + delay, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>
      )}
    </motion.div>
  )
}

export function Th({ label, hide = '' }: { label: string; hide?: string }) {
  return (
    <th className={`px-5 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground ${hide}`}>
      {label}
    </th>
  )
}

export function ThSort<K extends string>({
  label, k, sortKey, sortDir, onClick, hide = '',
}: {
  label: string; k: K; sortKey: K; sortDir: 'asc' | 'desc'; onClick: (k: K) => void; hide?: string
}) {
  const active = sortKey === k
  return (
    <th className={`px-5 py-4 text-left ${hide}`}>
      <button
        onClick={() => onClick(k)}
        className={`inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.24em] transition ${
          active ? 'text-gold' : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        {label}
        <ArrowUpDown size={11} className={active ? '' : 'opacity-50'} />
        {active && <span className="text-[9px]">{sortDir === 'asc' ? '↑' : '↓'}</span>}
      </button>
    </th>
  )
}

export function StatusDotPill({ color, bg, border, label }: { color: string; bg: string; border?: string; label: string }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
      style={{ background: bg, color, border: border ? `1px solid ${border}` : undefined }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
      {label}
    </span>
  )
}

export function AvatarInicial({ nome, color = '#d4af37', bg = 'rgba(184,150,42,0.12)', border = 'rgba(184,150,42,0.25)' }: { nome: string; color?: string; bg?: string; border?: string }) {
  return (
    <div
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[11px] font-bold uppercase"
      style={{ background: bg, color, border: `1px solid ${border}` }}
    >
      {getInitials(nome)}
    </div>
  )
}

export function NovoBadge() {
  return (
    <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-400">
      Novo
    </span>
  )
}

export function DrawerShell({
  open,
  onClose,
  title,
  children,
  footer,
}: {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  footer?: React.ReactNode
}) {
  useEscape(onClose, open)
  if (!open) return null
  return (
    <>
      <motion.div
        className="fixed inset-0 z-40"
        style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />
      <motion.aside
        className="fixed right-0 top-0 z-50 flex h-full w-full max-w-[480px] flex-col overflow-hidden border-l border-white/10"
        style={{ background: '#0F0F0F' }}
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', stiffness: 400, damping: 36 }}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/8 px-6 py-4" style={{ background: '#0F0F0F' }}>
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.32em] text-muted-foreground">
            <Sparkles size={11} className="text-gold" />
            {title || 'Detalhe rápido'}
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground" aria-label="Fechar">×</button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">{children}</div>
        {footer && <div className="border-t border-white/8 px-6 py-4">{footer}</div>}
      </motion.aside>
    </>
  )
}

export function DrawerInfo({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5">
      <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">{label}</p>
      <p className="mt-1 truncate text-sm text-foreground">{value}</p>
    </div>
  )
}
