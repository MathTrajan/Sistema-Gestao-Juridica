"use client"

import { motion } from 'framer-motion'

interface AnimatedProgressProps {
  value: number
  max?: number
  label?: string
  showPercentage?: boolean
  size?: 'sm' | 'md' | 'lg'
  variant?: 'gold' | 'success' | 'danger' | 'warning' | 'info'
  animate?: boolean
}

const sizeClasses = {
  sm: 'h-1.5',
  md: 'h-2',
  lg: 'h-3',
}

const variantGradients: Record<NonNullable<AnimatedProgressProps['variant']>, string> = {
  gold: 'linear-gradient(90deg, var(--gold), var(--gold-light))',
  success: 'linear-gradient(90deg, var(--success), rgba(124, 211, 96, 0.8))',
  danger: 'linear-gradient(90deg, var(--danger), rgba(215, 105, 105, 0.85))',
  warning: 'linear-gradient(90deg, var(--warning), rgba(245, 158, 11, 0.8))',
  info: 'linear-gradient(90deg, var(--info), rgba(96, 165, 250, 0.8))',
}

export function AnimatedProgress({
  value,
  max = 100,
  label,
  showPercentage = false,
  size = 'md',
  variant = 'gold',
  animate = true,
}: AnimatedProgressProps) {
  const percentage = Math.min((value / max) * 100, 100)

  return (
    <div className="w-full">
      {(label || showPercentage) && (
        <div className="flex justify-between items-center mb-2">
          {label && <span className="text-xs text-muted-foreground">{label}</span>}
          {showPercentage && (
            <motion.span
              className="text-xs font-semibold text-foreground"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {Math.round(percentage)}%
            </motion.span>
          )}
        </div>
      )}

      <div className={`w-full rounded-full bg-white/5 overflow-hidden relative ${sizeClasses[size]}`}>
        <motion.div
          className="h-full rounded-full relative overflow-hidden"
          style={{ background: variantGradients[variant] }}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: animate ? 1 : 0, ease: 'easeOut', delay: 0.2 }}
        >
          {animate && (
            <motion.div
              className="absolute inset-0"
              style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.35) 50%, transparent 100%)' }}
              animate={{ x: ['-100%', '200%'] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3, ease: 'easeInOut' }}
            />
          )}
        </motion.div>
      </div>
    </div>
  )
}

interface FunnelBarProps {
  label: string
  count: number
  total: number
}

export function FunnelBar({ label, count, total }: FunnelBarProps) {
  const percentage = total > 0 ? (count / total) * 100 : 0

  return (
    <div className="flex items-center gap-4 mb-4">
      <span className="text-xs text-muted-foreground w-32 text-right flex-shrink-0">{label}</span>
      <div className="flex-1 h-9 bg-white/5 rounded-xl overflow-hidden relative">
        <motion.div
          className="h-full rounded-xl relative overflow-hidden"
          style={{ background: 'linear-gradient(90deg, var(--gold), var(--gold-light))' }}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.9, ease: 'easeOut', delay: 0.2 }}
        >
          <motion.div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 45%, transparent 100%)' }}
            animate={{ x: ['-100%', '200%'] }}
            transition={{ duration: 2.2, repeat: Infinity, repeatDelay: 3, ease: 'easeInOut' }}
          />
          <span className="relative z-10 ml-3 text-xs font-semibold text-foreground">{count}</span>
        </motion.div>
      </div>
      <span className="text-xs text-muted-foreground w-12 text-right font-semibold">{Math.round(percentage)}%</span>
    </div>
  )
}
