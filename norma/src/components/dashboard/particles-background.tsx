"use client"

import { motion } from 'framer-motion'

const particles = Array.from({ length: 32 }, (_, i) => ({
  id: i,
  x: (i * 17 + 5) % 100,
  y: (i * 29 + 3) % 100,
  size: 1.5 + (i % 4) * 0.7,
  duration: 16 + (i % 8) * 2.2,
  delay: (i % 7) * 1.1,
  xOffset: 40 + (i % 5) * 20,
}))

export function ParticlesBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            background: 'radial-gradient(circle, rgba(212,175,55,0.55), transparent)',
          }}
          animate={{
            y: [0, -(60 + p.xOffset), 0],
            x: [0, p.xOffset * 0.5, 0],
            opacity: [0, 0.38, 0],
            scale: [0.8, 1.4, 0.8],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  )
}
