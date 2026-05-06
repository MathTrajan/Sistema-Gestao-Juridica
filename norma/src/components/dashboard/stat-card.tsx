"use client"

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface StatCardProps {
  icon: React.ReactNode
  label: string
  value: string | number
  sub: string
  trend?: 'positive' | 'negative' | 'neutral'
  iconColor: 'gold' | 'blue' | 'red' | 'green'
  index?: number
  progress?: number
  badge?: { text: string; variant: 'success' | 'warning' | 'danger' | 'gold' }
}

const iconStyles = {
  gold:  { background: 'linear-gradient(135deg, rgba(184,150,42,0.22), rgba(184,150,42,0.08))', color: '#B8962A' },
  blue:  { background: 'linear-gradient(135deg, rgba(148,163,184,0.18), rgba(148,163,184,0.06))', color: '#94a3b8' },
  red:   { background: 'linear-gradient(135deg, rgba(239,68,68,0.2), rgba(239,68,68,0.08))',    color: '#f87171' },
  green: { background: 'linear-gradient(135deg, rgba(34,197,94,0.2), rgba(34,197,94,0.08))',    color: '#4ade80' },
}

const accentGlow = {
  gold:  '0 0 30px rgba(184,150,42,0.22)',
  blue:  '0 0 30px rgba(148,163,184,0.15)',
  red:   '0 0 30px rgba(239,68,68,0.18)',
  green: '0 0 30px rgba(34,197,94,0.18)',
}

const accentColor = {
  gold:  '#B8962A',
  blue:  '#94a3b8',
  red:   '#f87171',
  green: '#4ade80',
}

const progressGradient = {
  gold:  'linear-gradient(90deg, #8B7020, #D4B86F)',
  blue:  'linear-gradient(90deg, #64748b, #94a3b8)',
  red:   'linear-gradient(90deg, #dc2626, #f87171)',
  green: 'linear-gradient(90deg, #16a34a, #4ade80)',
}

const badgeStyles = {
  success: { bg: 'rgba(34,197,94,0.14)',   color: '#4ade80',  border: 'rgba(34,197,94,0.3)'   },
  warning: { bg: 'rgba(245,158,11,0.14)',  color: '#fbbf24',  border: 'rgba(245,158,11,0.3)'  },
  danger:  { bg: 'rgba(239,68,68,0.14)',   color: '#f87171',  border: 'rgba(239,68,68,0.3)'   },
  gold:    { bg: 'rgba(184,150,42,0.14)',  color: '#B8962A',  border: 'rgba(184,150,42,0.3)'  },
}

export function StatCard({ icon, label, value, sub, trend = 'neutral', iconColor, index = 0, progress, badge }: StatCardProps) {
  return (
    <motion.div
      className="glass-card hover-lift rounded-3xl p-6 cursor-default group relative"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.09, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ boxShadow: `0 28px 60px rgba(0,0,0,0.35), ${accentGlow[iconColor]}` }}
    >
      {/* Linha superior ao hover */}
      <div
        className="absolute inset-x-0 top-0 h-[1.5px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-t-3xl"
        style={{ background: `linear-gradient(90deg, ${accentColor[iconColor]}, transparent)` }}
      />

      <div className="flex items-start justify-between mb-4">
        <motion.div
          className="flex h-12 w-12 items-center justify-center rounded-[16px]"
          style={iconStyles[iconColor]}
          whileHover={{ scale: 1.12, rotate: 8 }}
          transition={{ type: 'spring', stiffness: 380, damping: 16 }}
        >
          {icon}
        </motion.div>

        {badge && (
          <motion.span
            className="px-2.5 py-1 rounded-full text-[11px] font-semibold"
            style={{
              background: badgeStyles[badge.variant].bg,
              color: badgeStyles[badge.variant].color,
              border: `1px solid ${badgeStyles[badge.variant].border}`,
            }}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: index * 0.09 + 0.3, type: 'spring', stiffness: 400 }}
          >
            {badge.text}
          </motion.span>
        )}
      </div>

      <div className="text-[11px] font-semibold uppercase tracking-[0.28em] mb-2" style={{ color: 'var(--text3)' }}>
        {label}
      </div>

      <motion.div
        className={cn('text-[26px] font-bold tracking-tight mb-1')}
        style={{
          background: trend === 'negative'
            ? 'linear-gradient(135deg, #f87171, #ef4444)'
            : `linear-gradient(135deg, #FFFFFF, ${accentColor[iconColor]})`,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 280, delay: index * 0.09 + 0.2 }}
      >
        {value}
      </motion.div>

      <div className={cn(
        'text-[11px] mb-4',
        trend === 'positive' && 'text-emerald-400',
        trend === 'negative' && 'text-red-400',
        trend === 'neutral'  && 'text-slate-400',
      )}>
        {trend === 'positive' && '↑ '}{trend === 'negative' && '↓ '}{sub}
      </div>

      {progress !== undefined && (
        <div className="mt-auto">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-[10px]" style={{ color: 'var(--text3)' }}>Progresso</span>
            <span className="text-[10px] font-semibold" style={{ color: accentColor[iconColor] }}>{progress}%</span>
          </div>
          <div className="h-[4px] rounded-full overflow-hidden relative" style={{ background: 'rgba(255,255,255,0.07)' }}>
            <motion.div
              className="h-full rounded-full relative overflow-hidden"
              style={{ background: progressGradient[iconColor] }}
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1.2, delay: index * 0.09 + 0.4, ease: 'easeOut' }}
            >
              <motion.div
                className="absolute inset-0"
                style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.35), transparent)' }}
                animate={{ x: ['-100%', '200%'] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 2.5, ease: 'easeInOut' }}
              />
            </motion.div>
          </div>
        </div>
      )}

      <div
        className="absolute -right-4 -bottom-4 rounded-full opacity-[0.06] pointer-events-none"
        style={{ width: 100, height: 100, background: accentColor[iconColor] }}
      />
    </motion.div>
  )
}
