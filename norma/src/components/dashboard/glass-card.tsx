"use client"

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface GlassCardProps {
  title: string
  action?: React.ReactNode
  children: React.ReactNode
  className?: string
  badge?: {
    text: string
    variant: 'gold' | 'red' | 'green' | 'blue' | 'amber' | 'gray'
  }
}

const badgeStyles = {
  gold:  { background: 'rgba(184,150,42,0.14)',  color: '#B8962A',  border: '1px solid rgba(184,150,42,0.3)'  },
  red:   { background: 'rgba(239,68,68,0.14)',   color: '#f87171',  border: '1px solid rgba(239,68,68,0.3)'   },
  green: { background: 'rgba(34,197,94,0.14)',   color: '#4ade80',  border: '1px solid rgba(34,197,94,0.3)'   },
  blue:  { background: 'rgba(148,163,184,0.12)', color: '#94a3b8',  border: '1px solid rgba(148,163,184,0.25)'  },
  amber: { background: 'rgba(245,158,11,0.14)',  color: '#fbbf24',  border: '1px solid rgba(245,158,11,0.3)'  },
  gray:  { background: 'rgba(255,255,255,0.06)', color: 'var(--text3)', border: '1px solid rgba(255,255,255,0.1)' },
}

export function GlassCard({ title, action, children, className, badge }: GlassCardProps) {
  return (
    <motion.div
      className={cn('glass-card rounded-3xl overflow-hidden', className)}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      <div
        className="px-6 py-5 flex items-center justify-between gap-4"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <div className="flex items-center gap-3">
          <h3 className="text-[14px] font-semibold" style={{ color: 'var(--text)' }}>{title}</h3>
          {badge && (
            <motion.span
              className="px-2.5 py-1 rounded-full text-[11px] font-semibold flex items-center gap-1.5"
              style={badgeStyles[badge.variant]}
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 450, damping: 24, delay: 0.15 }}
            >
              {badge.variant === 'red' && (
                <motion.span
                  className="w-1.5 h-1.5 rounded-full bg-current"
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ duration: 1.2, repeat: Infinity }}
                />
              )}
              {badge.text}
            </motion.span>
          )}
        </div>
        {action}
      </div>
      <div className="relative px-6 py-5">{children}</div>
    </motion.div>
  )
}
