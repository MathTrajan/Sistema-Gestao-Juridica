'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Pencil, Trash2, X, Calendar, Search, Link2, LayoutGrid, AlertTriangle } from 'lucide-react'
import ComentariosSection from '@/components/tarefas/ComentariosSection'

const colunas = [
  { id: 'A_FAZER',           label: 'A Fazer',            color: 'from-white/8 to-white/4',      accent: 'text-muted-foreground' },
  { id: 'EM_ANDAMENTO',      label: 'Em Andamento',       color: 'from-info/18 to-info/5',       accent: 'text-info' },
  { id: 'AGUARDANDO_REVISAO',label: 'Aguardando Revisao', color: 'from-warning/18 to-warning/5', accent: 'text-warning' },
  { id: 'CONCLUIDO',         label: 'Concluido',          color: 'from-success/18 to-success/5', accent: 'text-success' },
  { id: 'CANCELADO',         label: 'Cancelado',          color: 'from-danger/10 to-danger/5',   accent: 'text-danger' },
]

const prioridadeConfig: Record<string, { label: string; color: string }> = {
  URGENTE: { label: 'Urgente', color: 'bg-danger-bg text-danger' },
  ALTA: { label: 'Alta', color: 'bg-warning-bg text-warning' },
  NORMAL: { label: 'Normal', color: 'bg-white/8 text-muted-foreground' },
  BAIXA: { label: 'Baixa', color: 'bg-info-bg text-info' },
}

interface Tarefa {
  id: string
  titulo: string
  descricao: string | null
  status: string
  prioridade: string
  dataVencimento: string | null
  responsavel: { id: string; nome: string } | null
  processo: { id: string; numero: string | null } | null
  prazoId: string | null
  prazo: { id: string; titulo: string } | null
}

interface PrazoOpcao {
  id: string
  titulo: string
  dataFinal: string
  status: string
}

interface UsuarioOpcao {
  id: string
  nome: string
}

const inputClass = 'w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-gold/30'
const labelClass = 'mb-1 block text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground'

export default function KanbanBoard({ tarefasIniciais, usuarios }: { tarefasIniciais: Tarefa[]; usuarios: UsuarioOpcao[] }) {
  const router = useRouter()
  const [tarefas, setTarefas] = useState<Tarefa[]>(tarefasIniciais)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [overColuna, setOverColuna] = useState<string | null>(null)
  const [salvando, setSalvando] = useState<string | null>(null)
  const [aba, setAba] = useState<'kanban' | 'comPrazo'>('kanban')
  const [busca, setBusca] = useState('')
  const [editando, setEditando] = useState<Tarefa | null>(null)
  const [editLoading, setEditLoading] = useState(false)
  const [editErro, setEditErro] = useState('')
  const [prazosDisponiveis, setPrazosDisponiveis] = useState<PrazoOpcao[]>([])
  const [editForm, setEditForm] = useState({
    titulo: '',
    descricao: '',
    prioridade: 'NORMAL',
    status: 'A_FAZER',
    dataVencimento: '',
    prazoId: '',
    responsavelId: '',
  })
  const [confirmandoDeletar, setConfirmandoDeletar] = useState<Record<string, boolean>>({})
  const dragItem = useRef<string | null>(null)
  const statusAnterior = useRef<string | null>(null)

  useEffect(() => {
    if (!editando?.processo?.id) {
      setPrazosDisponiveis([])
      return
    }

    fetch(`/api/prazos?processoId=${editando.processo.id}`)
      .then((r) => r.json())
      .then((data: PrazoOpcao[]) => setPrazosDisponiveis(Array.isArray(data) ? data : []))
      .catch(() => setPrazosDisponiveis([]))
  }, [editando?.processo?.id])

  function abrirEditar(tarefa: Tarefa) {
    setEditForm({
      titulo: tarefa.titulo,
      descricao: tarefa.descricao ?? '',
      prioridade: tarefa.prioridade,
      status: tarefa.status,
      dataVencimento: tarefa.dataVencimento ? tarefa.dataVencimento.slice(0, 10) : '',
      prazoId: tarefa.prazoId ?? '',
      responsavelId: tarefa.responsavel?.id ?? '',
    })
    setEditando(tarefa)
    setEditErro('')
  }

  async function handleDeletar(id: string) {
    if (!confirmandoDeletar[id]) {
      setConfirmandoDeletar(prev => ({ ...prev, [id]: true }))
      setTimeout(() => {
        setConfirmandoDeletar(prev => {
          const next = { ...prev }
          delete next[id]
          return next
        })
      }, 3000)
      return
    }

    setConfirmandoDeletar(prev => {
      const next = { ...prev }
      delete next[id]
      return next
    })

    const res = await fetch(`/api/tarefas/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setTarefas(prev => prev.filter(t => t.id !== id))
      router.refresh()
    }
  }

  function handleEditChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    setEditForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleEditSalvar(e: React.FormEvent) {
    e.preventDefault()
    if (!editando) return
    setEditLoading(true)
    setEditErro('')

    try {
      const res = await fetch(`/api/tarefas/${editando.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titulo: editForm.titulo,
          descricao: editForm.descricao || null,
          prioridade: editForm.prioridade,
          status: editForm.status,
          dataVencimento: editForm.dataVencimento || null,
          prazoId: editForm.prazoId || null,
          responsavelId: editForm.responsavelId || null,
        }),
      })

      if (!res.ok) throw new Error()

      const prazoSelecionado = prazosDisponiveis.find((prazo) => prazo.id === editForm.prazoId) ?? null
      const responsavelSelecionado = usuarios.find(u => u.id === editForm.responsavelId) ?? null

      setTarefas((prev) =>
        prev.map((tarefa) =>
          tarefa.id === editando.id
            ? {
                ...tarefa,
                titulo: editForm.titulo,
                descricao: editForm.descricao || null,
                prioridade: editForm.prioridade,
                status: editForm.status,
                dataVencimento: editForm.dataVencimento ? new Date(editForm.dataVencimento).toISOString() : null,
                prazoId: editForm.prazoId || null,
                prazo: prazoSelecionado ? { id: prazoSelecionado.id, titulo: prazoSelecionado.titulo } : null,
                responsavel: responsavelSelecionado ? { id: responsavelSelecionado.id, nome: responsavelSelecionado.nome } : null,
              }
            : tarefa
        )
      )

      setEditando(null)
      router.refresh()
    } catch {
      setEditErro('Erro ao salvar. Tente novamente.')
    } finally {
      setEditLoading(false)
    }
  }

  function handleDragStart(id: string) {
    dragItem.current = id
    setDraggingId(id)
    const tarefa = tarefas.find((item) => item.id === id)
    statusAnterior.current = tarefa?.status ?? null
  }

  function handleDragEnd() {
    setDraggingId(null)
    setOverColuna(null)
    dragItem.current = null
  }

  function handleDragOver(e: React.DragEvent, colunaId: string) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setOverColuna(colunaId)
  }

  async function handleDrop(colunaId: string) {
    const id = dragItem.current
    const anterior = statusAnterior.current

    setDraggingId(null)
    setOverColuna(null)
    dragItem.current = null
    statusAnterior.current = null

    if (!id || !anterior || anterior === colunaId) return

    setTarefas((prev) => prev.map((tarefa) => (tarefa.id === id ? { ...tarefa, status: colunaId } : tarefa)))
    setSalvando(id)

    try {
      const res = await fetch(`/api/tarefas/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: colunaId }),
      })

      if (!res.ok) throw new Error()
    } catch {
      setTarefas((prev) => prev.map((tarefa) => (tarefa.id === id ? { ...tarefa, status: anterior } : tarefa)))
    } finally {
      setSalvando(null)
    }
  }

  const normalizedBusca = busca.trim().toLowerCase()

  const tarefasFiltradas = useMemo(() => (
    normalizedBusca
      ? tarefas.filter((tarefa) => (
          tarefa.titulo.toLowerCase().includes(normalizedBusca) ||
          tarefa.descricao?.toLowerCase().includes(normalizedBusca) ||
          tarefa.responsavel?.nome.toLowerCase().includes(normalizedBusca) ||
          tarefa.processo?.numero?.toLowerCase().includes(normalizedBusca) ||
          tarefa.prazo?.titulo.toLowerCase().includes(normalizedBusca)
        ))
      : tarefas
  ), [normalizedBusca, tarefas])

  const tarefasComPrazo = useMemo(() => (
    tarefasFiltradas
      .filter((tarefa) => tarefa.dataVencimento && tarefa.status !== 'CONCLUIDO')
      .sort((a, b) => new Date(a.dataVencimento!).getTime() - new Date(b.dataVencimento!).getTime())
  ), [tarefasFiltradas])

  const urgentes = useMemo(
    () => tarefas.filter((tarefa) => tarefa.prioridade === 'URGENTE' && tarefa.status !== 'CONCLUIDO').length,
    [tarefas]
  )

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="glass-card rounded-3xl p-5">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gold/12 text-gold">
              <LayoutGrid size={20} />
            </div>
            <div>
              <p className="text-2xl font-semibold text-foreground">{tarefas.length}</p>
              <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Total</p>
            </div>
          </div>
        </div>

        <div className="glass-card rounded-3xl p-5">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-warning-bg text-warning">
              <Calendar size={20} />
            </div>
            <div>
              <p className="text-2xl font-semibold text-foreground">{tarefasComPrazo.length}</p>
              <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Com vencimento</p>
            </div>
          </div>
        </div>

        <div className="glass-card rounded-3xl p-5">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-danger-bg text-danger">
              <AlertTriangle size={20} />
            </div>
            <div>
              <p className="text-2xl font-semibold text-foreground">{urgentes}</p>
              <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Urgentes abertas</p>
            </div>
          </div>
        </div>
      </div>

      <div className="relative">
        <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por titulo, responsavel, processo, prazo..."
          className="w-full rounded-2xl border border-white/10 bg-white/5 py-3 pl-11 pr-4 text-sm text-foreground outline-none transition focus:border-gold/35 focus:bg-white/8"
        />
      </div>

      <div className="flex gap-1">
        <button
          onClick={() => setAba('kanban')}
          className={`rounded-2xl px-4 py-2.5 text-sm font-medium transition-colors ${
            aba === 'kanban' ? 'bg-gold text-black' : 'bg-white/5 text-muted-foreground hover:bg-white/10'
          }`}
        >
          Kanban
        </button>
        <button
          onClick={() => setAba('comPrazo')}
          className={`flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-medium transition-colors ${
            aba === 'comPrazo' ? 'bg-gold text-black' : 'bg-white/5 text-muted-foreground hover:bg-white/10'
          }`}
        >
          <Calendar size={14} />
          Com prazo
          {tarefasComPrazo.length > 0 ? (
            <span className={`rounded-full px-1.5 py-0.5 text-xs font-semibold ${aba === 'comPrazo' ? 'bg-black/15' : 'bg-warning-bg text-warning'}`}>
              {tarefasComPrazo.length}
            </span>
          ) : null}
        </button>
      </div>

      {aba === 'kanban' ? (
        <div className="flex min-h-96 gap-5 overflow-x-auto pb-4">
          {colunas.map((coluna) => {
            const tarefasColuna = tarefasFiltradas.filter((tarefa) => tarefa.status === coluna.id)
            const isOver = overColuna === coluna.id

            return (
              <motion.div
                key={coluna.id}
                onDragOver={(e) => handleDragOver(e, coluna.id)}
                onDrop={() => handleDrop(coluna.id)}
                onDragLeave={() => setOverColuna(null)}
                className={`glass-card w-72 flex-shrink-0 rounded-[1.75rem] border p-4 transition-all ${
                  isOver ? 'border-gold/35 bg-gold/10 scale-[1.01]' : 'border-white/10 bg-transparent'
                }`}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className={`mb-4 rounded-2xl bg-gradient-to-r ${coluna.color} px-4 py-3`}>
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-semibold ${coluna.accent}`}>{coluna.label}</span>
                    <span className="rounded-full border border-white/10 bg-black/10 px-2 py-0.5 text-xs font-semibold text-foreground">
                      {tarefasColuna.length}
                    </span>
                  </div>
                </div>

                <div className="flex min-h-16 flex-col gap-3">
                  {tarefasColuna.length === 0 ? (
                    <div className={`rounded-2xl border-2 border-dashed py-8 text-center text-xs transition-colors ${
                      isOver ? 'border-gold/40 text-gold' : 'border-white/10 text-muted-foreground'
                    }`}>
                      {isOver ? 'Solte aqui' : 'Nenhuma tarefa'}
                    </div>
                  ) : null}

                  {tarefasColuna.map((tarefa) => {
                    const prioridade = prioridadeConfig[tarefa.prioridade]
                    const isDragging = draggingId === tarefa.id
                    const isSalvando = salvando === tarefa.id
                    const vencida = tarefa.dataVencimento && new Date(tarefa.dataVencimento) < new Date() && tarefa.status !== 'CONCLUIDO'

                    return (
                      <motion.div
                        key={tarefa.id}
                        draggable
                        onDragStart={() => handleDragStart(tarefa.id)}
                        onDragEnd={handleDragEnd}
                        className={`glass-card select-none rounded-2xl border border-white/10 p-4 transition-all ${
                          isDragging ? 'scale-95 cursor-grabbing opacity-30' : isSalvando ? 'cursor-wait opacity-70' : 'cursor-grab hover:-translate-y-0.5'
                        }`}
                        whileHover={{ y: -2 }}
                      >
                        <div className="mb-2 flex items-start justify-between gap-2">
                          <span className="text-sm font-medium leading-snug text-foreground">{tarefa.titulo}</span>
                          <div className="flex flex-shrink-0 items-center gap-1">
                            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${prioridade.color}`}>{prioridade.label}</span>
                            <button
                              onMouseDown={(e) => e.stopPropagation()}
                              onClick={(e) => { e.stopPropagation(); abrirEditar(tarefa) }}
                              className="rounded p-1 text-muted-foreground transition-colors hover:bg-white/8 hover:text-gold"
                              title="Editar"
                            >
                              <Pencil size={12} />
                            </button>
                            <button
                              onMouseDown={(e) => e.stopPropagation()}
                              onClick={(e) => { e.stopPropagation(); handleDeletar(tarefa.id) }}
                              className={`rounded px-1.5 py-1 text-xs font-medium transition-colors ${
                                confirmandoDeletar[tarefa.id]
                                  ? 'bg-danger/15 text-danger'
                                  : 'text-muted-foreground hover:bg-danger/10 hover:text-danger'
                              }`}
                              title={confirmandoDeletar[tarefa.id] ? 'Confirmar exclusão' : 'Excluir'}
                            >
                              {confirmandoDeletar[tarefa.id] ? '?' : <Trash2 size={12} />}
                            </button>
                          </div>
                        </div>

                        {tarefa.descricao ? <p className="mb-2 line-clamp-2 text-xs leading-relaxed text-muted-foreground">{tarefa.descricao}</p> : null}

                        {tarefa.processo ? (
                          <div className="mb-1 text-xs">
                            <Link
                              href={`/processos/${tarefa.processo.id}`}
                              className="text-gold hover:text-gold-light"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {tarefa.processo.numero || 'Processo sem numero'}
                            </Link>
                          </div>
                        ) : null}

                        {tarefa.prazo ? (
                          <div className="mb-1 flex items-center gap-1 text-xs text-info">
                            <Link2 size={10} />
                            <span className="truncate">{tarefa.prazo.titulo}</span>
                          </div>
                        ) : null}

                        <div className="mt-3 flex items-center justify-between border-t border-white/8 pt-3">
                          <div className="flex items-center gap-2">
                            {tarefa.responsavel ? (
                              <div
                                className="flex h-6 w-6 items-center justify-center rounded-full bg-gold text-xs font-bold text-black"
                                title={tarefa.responsavel.nome}
                              >
                                {tarefa.responsavel.nome.charAt(0).toUpperCase()}
                              </div>
                            ) : null}
                            {tarefa.dataVencimento ? (
                              <span className={`text-xs ${vencida ? 'font-medium text-danger' : 'text-muted-foreground'}`}>
                                {new Date(tarefa.dataVencimento).toLocaleDateString('pt-BR')}
                                {vencida ? ' !' : ''}
                              </span>
                            ) : null}
                          </div>

                          {isSalvando ? (
                            <span className="text-xs text-gold">Salvando...</span>
                          ) : (
                            <span className="select-none text-xs text-muted-foreground">arrastar</span>
                          )}
                        </div>
                      </motion.div>
                    )
                  })}

                  {isOver && tarefasColuna.length > 0 ? (
                    <div className="flex h-12 items-center justify-center rounded-2xl border-2 border-dashed border-gold/35 text-xs text-gold">
                      Solte aqui
                    </div>
                  ) : null}
                </div>
              </motion.div>
            )
          })}
        </div>
      ) : (
        <div className="glass-card overflow-hidden rounded-3xl border border-white/10">
          {tarefasComPrazo.length === 0 ? (
            <div className="p-16 text-center">
              <div className="mb-4 text-gold">
                <Calendar className="mx-auto" size={32} />
              </div>
              <div className="font-medium text-foreground">Nenhuma tarefa com prazo em aberto</div>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10 bg-white/3">
                  <th className="px-5 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">Tarefa</th>
                  <th className="px-5 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">Prioridade</th>
                  <th className="px-5 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">Status</th>
                  <th className="px-5 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">Responsavel</th>
                  <th className="px-5 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">Vencimento</th>
                  <th className="px-5 py-4" />
                </tr>
              </thead>
              <tbody>
                {tarefasComPrazo.map((tarefa) => {
                  const prioridade = prioridadeConfig[tarefa.prioridade]
                  const vencida = new Date(tarefa.dataVencimento!).getTime() < Date.now()
                  const statusLabel: Record<string, string> = {
                    A_FAZER: 'A Fazer',
                    EM_ANDAMENTO: 'Em andamento',
                    AGUARDANDO_REVISAO: 'Aguard. revisao',
                    CONCLUIDO: 'Concluido',
                    CANCELADO: 'Cancelado',
                  }

                  return (
                    <tr key={tarefa.id} className={`border-b border-white/6 transition-colors ${vencida ? 'bg-danger/10' : 'hover:bg-white/4'}`}>
                      <td className="px-5 py-3">
                        <div className="text-sm font-medium text-foreground">{tarefa.titulo}</div>
                        {tarefa.processo ? (
                          <div className="mt-0.5 text-xs text-muted-foreground">
                            <Link href={`/processos/${tarefa.processo.id}`} className="text-gold hover:text-gold-light">
                              {tarefa.processo.numero || 'Processo sem n'}
                            </Link>
                          </div>
                        ) : null}
                        {tarefa.prazo ? (
                          <div className="mt-0.5 flex items-center gap-1 text-xs text-info">
                            <Link2 size={10} />
                            <span>{tarefa.prazo.titulo}</span>
                          </div>
                        ) : null}
                      </td>
                      <td className="px-5 py-3">
                        <span className={`rounded-full px-2 py-1 text-xs font-medium ${prioridade.color}`}>{prioridade.label}</span>
                      </td>
                      <td className="px-5 py-3 text-sm text-muted-foreground">{statusLabel[tarefa.status] ?? tarefa.status}</td>
                      <td className="px-5 py-3 text-sm text-muted-foreground">{tarefa.responsavel?.nome || '-'}</td>
                      <td className={`px-5 py-3 text-sm font-medium ${vencida ? 'text-danger' : 'text-foreground'}`}>
                        {new Date(tarefa.dataVencimento!).toLocaleDateString('pt-BR')}
                        {vencida ? ' !' : ''}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => abrirEditar(tarefa)}
                            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-white/10 hover:text-gold"
                            title="Editar"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => handleDeletar(tarefa.id)}
                            className={`rounded-lg px-2 py-1.5 text-xs font-medium transition-colors ${
                              confirmandoDeletar[tarefa.id]
                                ? 'bg-danger/15 text-danger'
                                : 'text-muted-foreground hover:bg-danger/10 hover:text-danger'
                            }`}
                            title={confirmandoDeletar[tarefa.id] ? 'Confirmar exclusão' : 'Excluir'}
                          >
                            {confirmandoDeletar[tarefa.id] ? 'Confirmar?' : <Trash2 size={14} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {editando ? (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '28rem' }}>
            <div className="modal-header">
              <h2 className="text-base font-semibold text-white">Editar tarefa</h2>
              <button onClick={() => setEditando(null)} className="text-muted-foreground hover:text-white">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleEditSalvar} className="modal-body">
              <div className="flex flex-col gap-4">
                <div>
                  <label className={labelClass}>Titulo *</label>
                  <input name="titulo" value={editForm.titulo} onChange={handleEditChange} className={inputClass} required />
                </div>
                <div>
                  <label className={labelClass}>Descricao</label>
                  <textarea name="descricao" value={editForm.descricao} onChange={handleEditChange} className={inputClass} rows={2} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Prioridade</label>
                    <select name="prioridade" value={editForm.prioridade} onChange={handleEditChange} className={inputClass}>
                      <option value="BAIXA">Baixa</option>
                      <option value="NORMAL">Normal</option>
                      <option value="ALTA">Alta</option>
                      <option value="URGENTE">Urgente</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Status</label>
                    <select name="status" value={editForm.status} onChange={handleEditChange} className={inputClass}>
                      <option value="A_FAZER">A Fazer</option>
                      <option value="EM_ANDAMENTO">Em andamento</option>
                      <option value="AGUARDANDO_REVISAO">Aguard. revisao</option>
                      <option value="CONCLUIDO">Concluido</option>
                      <option value="CANCELADO">Cancelado</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Data de vencimento</label>
                    <input type="date" name="dataVencimento" value={editForm.dataVencimento} onChange={handleEditChange} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Responsável</label>
                    <select name="responsavelId" value={editForm.responsavelId} onChange={handleEditChange} className={inputClass}>
                      <option value="">Sem responsável</option>
                      {usuarios.map(u => (
                        <option key={u.id} value={u.id}>{u.nome}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {editando.processo ? (
                  <div>
                    <label className={labelClass}>Prazo vinculado</label>
                    <select name="prazoId" value={editForm.prazoId} onChange={handleEditChange} className={inputClass}>
                      <option value="">Nenhum</option>
                      {prazosDisponiveis.map((prazo) => (
                        <option key={prazo.id} value={prazo.id}>
                          {prazo.titulo} - {new Date(prazo.dataFinal).toLocaleDateString('pt-BR')}
                        </option>
                      ))}
                    </select>
                    {prazosDisponiveis.length === 0 ? (
                      <p className="mt-1 text-xs text-muted-foreground">Nenhum prazo cadastrado para este processo.</p>
                    ) : null}
                  </div>
                ) : null}
              </div>

              {editErro ? <div className="rounded-2xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger mb-4">{editErro}</div> : null}

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
                  disabled={editLoading}
                  className="flex-1 rounded-2xl bg-gold px-4 py-2.5 text-sm font-medium text-black hover:bg-gold-light disabled:opacity-50"
                >
                  {editLoading ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </form>
            <div className="px-5 pb-5">
              <ComentariosSection tarefaId={editando.id} />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
