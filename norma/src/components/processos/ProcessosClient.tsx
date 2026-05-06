'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Search, Filter, FileText, Clock3, Scale, ExternalLink } from 'lucide-react'
import { GlassCard } from '@/components/dashboard/glass-card'

const areaLabels: Record<string, string> = {
  TRABALHISTA: 'Trabalhista',
  CIVIL: 'Civel',
  TRIBUTARIO: 'Tributario',
  PREVIDENCIARIO: 'Previdenciario',
  CRIMINAL: 'Criminal',
  FAMILIA: 'Familia',
  EMPRESARIAL: 'Empresarial',
  CONSUMIDOR: 'Consumidor',
  AMBIENTAL: 'Ambiental',
  OUTRO: 'Outro',
}

const faseConfig: Record<string, { label: string; color: string }> = {
  CONHECIMENTO: { label: 'Conhecimento', color: 'bg-info-bg text-info' },
  RECURSAL: { label: 'Recursal', color: 'bg-warning-bg text-warning' },
  EXECUCAO: { label: 'Execucao', color: 'bg-gold/12 text-gold' },
  ENCERRADO: { label: 'Encerrado', color: 'bg-white/8 text-muted-foreground' },
}

const statusConfig: Record<string, { label: string; color: string }> = {
  EM_ANDAMENTO: { label: 'Em andamento', color: 'bg-success-bg text-success' },
  AGUARDANDO_PECA: { label: 'Aguard. peca', color: 'bg-warning-bg text-warning' },
  AGUARDANDO_CLIENTE: { label: 'Aguard. cliente', color: 'bg-info-bg text-info' },
  SUSPENSO: { label: 'Suspenso', color: 'bg-white/8 text-muted-foreground' },
  ENCERRADO_PROCEDENTE: { label: 'Procedente', color: 'bg-success-bg text-success' },
  ENCERRADO_IMPROCEDENTE: { label: 'Improcedente', color: 'bg-danger-bg text-danger' },
  ARQUIVADO: { label: 'Arquivado', color: 'bg-white/8 text-muted-foreground' },
}

interface Processo {
  id: string
  numero: string | null
  tipoAcao: string | null
  areaJuridica: string | null
  tribunal: string | null
  fase: string
  status: string
  cliente: { id: string; nomeCompleto: string }
  responsavel: { nome: string } | null
  _count: { prazos: number; tarefas: number }
}

export default function ProcessosClient({ processos }: { processos: Processo[] }) {
  const [busca, setBusca] = useState('')
  const [statusFiltro, setStatusFiltro] = useState('')

  const filteredQuery = busca.toLowerCase().trim()

  const filtrados = useMemo(() => processos.filter((processo) => {
    const matchBusca =
      !filteredQuery ||
      processo.numero?.toLowerCase().includes(filteredQuery) ||
      processo.cliente.nomeCompleto.toLowerCase().includes(filteredQuery) ||
      processo.tribunal?.toLowerCase().includes(filteredQuery) ||
      processo.tipoAcao?.toLowerCase().includes(filteredQuery)

    const matchStatus = !statusFiltro || processo.status === statusFiltro
    return matchBusca && matchStatus
  }), [filteredQuery, processos, statusFiltro])

  const { emAndamento, aguardando, encerrados } = useMemo(() => ({
    emAndamento: processos.filter((processo) => processo.status === 'EM_ANDAMENTO').length,
    aguardando: processos.filter((processo) => ['AGUARDANDO_PECA', 'AGUARDANDO_CLIENTE'].includes(processo.status)).length,
    encerrados: processos.filter((processo) => processo.status.includes('ENCERRADO') || processo.status === 'ARQUIVADO').length,
  }), [processos])

  const miniCards = [
    { icon: FileText, value: processos.length, label: 'Base total',    bg: 'rgba(184,150,42,0.15)', color: '#B8962A', glow: 'rgba(184,150,42,0.2)', delay: 0    },
    { icon: Scale,    value: emAndamento,       label: 'Em andamento', bg: 'rgba(34,197,94,0.12)',  color: '#4ade80', glow: 'rgba(34,197,94,0.18)', delay: 0.07 },
    { icon: Clock3,   value: aguardando,         label: `${encerrados} encerrados`, bg: 'rgba(245,158,11,0.15)', color: '#fbbf24', glow: 'rgba(245,158,11,0.2)', delay: 0.14 },
  ]

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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

      <div className="flex flex-col gap-3 lg:flex-row">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por numero, cliente, tribunal, tipo de acao..."
            className="w-full rounded-2xl border border-white/10 bg-white/5 py-3 pl-11 pr-4 text-sm text-foreground outline-none transition focus:border-gold/35 focus:bg-white/8"
          />
        </div>

        <div className="flex items-center gap-3">
          <span className="inline-flex h-12 items-center rounded-2xl border border-white/10 bg-white/5 px-4 text-muted-foreground">
            <Filter size={14} />
          </span>

          <select
            value={statusFiltro}
            onChange={(e) => setStatusFiltro(e.target.value)}
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-foreground outline-none transition focus:border-gold/35"
          >
            <option value="">Todos os status</option>
            <option value="EM_ANDAMENTO">Em andamento</option>
            <option value="AGUARDANDO_PECA">Aguard. peca</option>
            <option value="AGUARDANDO_CLIENTE">Aguard. cliente</option>
            <option value="SUSPENSO">Suspenso</option>
            <option value="ENCERRADO_PROCEDENTE">Procedente</option>
            <option value="ENCERRADO_IMPROCEDENTE">Improcedente</option>
            <option value="ARQUIVADO">Arquivado</option>
          </select>
        </div>
      </div>

      <GlassCard title="Pipeline processual" badge={{ text: `${filtrados.length} processos`, variant: 'gold' }}>
        {filtrados.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-16 text-center">
            <div className="mb-4 text-gold">
              <FileText className="mx-auto" size={32} />
            </div>
            <div className="font-medium text-foreground">
              {processos.length === 0 ? 'Nenhum processo cadastrado' : 'Nenhum resultado encontrado'}
            </div>
            <div className="mt-1 text-sm text-muted-foreground">
              {processos.length === 0 ? 'Clique em "Novo Processo" para comecar' : 'Tente outros termos de busca'}
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px]">
              <thead>
                <tr className="border-b border-white/10 bg-white/3">
                  <th className="px-5 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">Numero / Cliente</th>
                  <th className="px-5 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground hidden sm:table-cell">Area</th>
                  <th className="px-5 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground hidden lg:table-cell">Tribunal</th>
                  <th className="px-5 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground hidden md:table-cell">Fase</th>
                  <th className="px-5 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">Status</th>
                  <th className="px-5 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground hidden lg:table-cell">Responsavel</th>
                  <th className="px-5 py-4" />
                </tr>
              </thead>
              <tbody>
                {filtrados.map((processo, index) => {
                  const fase = faseConfig[processo.fase]
                  const status = statusConfig[processo.status]

                  return (
                    <motion.tr
                      key={processo.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className="border-b border-white/6 transition-colors hover:bg-white/4"
                    >
                      <td className="px-5 py-3">
                        <div className="text-sm font-medium text-gold">{processo.numero || 'Sem numero'}</div>
                        <div className="mt-0.5 text-xs text-muted-foreground">{processo.cliente.nomeCompleto}</div>
                      </td>
                      <td className="px-5 py-3 hidden sm:table-cell">
                        {processo.areaJuridica ? (
                          <span className="rounded-full bg-info-bg px-2.5 py-1 text-xs font-medium text-info">
                            {areaLabels[processo.areaJuridica]}
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="px-5 py-3 text-sm text-muted-foreground hidden lg:table-cell">{processo.tribunal || '-'}</td>
                      <td className="px-5 py-3 hidden md:table-cell">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${fase.color}`}>{fase.label}</span>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${status.color}`}>{status.label}</span>
                      </td>
                      <td className="px-5 py-3 text-sm text-muted-foreground hidden lg:table-cell">{processo.responsavel?.nome || '-'}</td>
                      <td className="px-5 py-3">
                        <Link
                          href={`/processos/${processo.id}`}
                          className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.24em] text-gold hover:text-gold-light"
                        >
                          Ver
                          <ExternalLink size={12} />
                        </Link>
                      </td>
                    </motion.tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>

      {busca ? (
        <p className="text-xs text-muted-foreground">
          {filtrados.length} resultado{filtrados.length !== 1 ? 's' : ''} de {processos.length} processo{processos.length !== 1 ? 's' : ''}
        </p>
      ) : null}
    </div>
  )
}
