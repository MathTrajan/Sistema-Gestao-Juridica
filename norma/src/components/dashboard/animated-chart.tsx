"use client"

import { motion } from 'framer-motion'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts'

interface ChartItem {
  month: string
  value: number
}

interface AnimatedChartProps {
  data: ChartItem[]
  showBar?: boolean
  title?: string
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: Array<{ value: number; payload: ChartItem }> }) {
  if (!active || !payload || !payload.length) return null

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92, y: -6 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      className="px-4 py-3 rounded-[14px]"
      style={{
        background: 'rgba(20,20,20,0.97)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(184,150,42,0.22)',
        boxShadow: '0 16px 45px rgba(0,0,0,0.5), 0 0 20px rgba(184,150,42,0.08)',
      }}
    >
      <p className="text-[11px] uppercase tracking-[0.24em] mb-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
        {payload[0].payload.month}
      </p>
      <p
        className="text-xl font-bold"
        style={{
          background: 'linear-gradient(135deg, #B8962A, #D4B86F)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}
      >
        {payload[0].value.toLocaleString('pt-BR')}
      </p>
    </motion.div>
  )
}

export function AnimatedChart({ data, showBar = false }: AnimatedChartProps) {
  const displayData = data.length ? data : [{ month: 'Jan', value: 0 }]

  return (
    <motion.div
      className="h-56 w-full"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
    >
      <ResponsiveContainer width="100%" height="100%">
        {showBar ? (
          <BarChart data={displayData} margin={{ top: 8, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis
              dataKey="month"
              tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 11 }}
              axisLine={false} tickLine={false}
            />
            <YAxis
              tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 11 }}
              axisLine={false} tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(184,150,42,0.06)' }} />
            <Bar dataKey="value" radius={[10, 10, 0, 0]} animationDuration={1000}>
              {displayData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={index === displayData.length - 1 ? '#B8962A' : 'rgba(184,150,42,0.35)'}
                />
              ))}
            </Bar>
          </BarChart>
        ) : (
          <AreaChart data={displayData} margin={{ top: 8, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="goldGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#B8962A" stopOpacity={0.40} />
                <stop offset="95%" stopColor="#B8962A" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="strokeGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%"   stopColor="#8B7020" />
                <stop offset="100%" stopColor="#D4B86F" />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis
              dataKey="month"
              tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 11 }}
              axisLine={false} tickLine={false}
            />
            <YAxis
              tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 11 }}
              axisLine={false} tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(212,175,55,0.2)', strokeWidth: 1 }} />
            <Area
              type="monotone"
              dataKey="value"
              stroke="url(#strokeGradient)"
              strokeWidth={2.5}
              fill="url(#goldGradient)"
              animationDuration={1200}
              dot={{ fill: '#B8962A', r: 3, strokeWidth: 0 }}
              activeDot={{ fill: '#D4B86F', r: 5, stroke: 'rgba(184,150,42,0.3)', strokeWidth: 4 }}
            />
          </AreaChart>
        )}
      </ResponsiveContainer>
    </motion.div>
  )
}
