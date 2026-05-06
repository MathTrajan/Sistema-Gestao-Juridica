'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Pencil, X, Calendar, Search, Link2 } from 'lucide-react'

const colunas = [
  { id: 'A_FAZER', label: 'A Fazer', color: 'bg-gray-100 border-gray-200' },
  { id: 'EM_ANDAMENTO', label: 'Em Andamento', color: 'bg-blue-50 border-blue-200' },
  { id: 'AGUARDANDO_REVISAO', label: 'Aguardando Revisão', color: 'bg-amber-50 border-amber-200' },
  { id: 'CONCLUIDO', label: 'Concluído', color: 'bg-green-50 border-green-200' },
]

const prioridadeConfig: Record<string, { label: string; color: string }> = {
  URGENTE: { label: 'Urgente', color: 'bg-red-100 text-red-800' },
  ALTA: { label: 'Alta', color: 'bg-amber-100 text-amber-800' },
  NORMAL: { label: 'Normal', color: 'bg-gray-100 text-gray-600' },
  BAIXA: { label: 'Baixa', color: 'bg-blue-100 text-blue-800' },
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

const inputClass = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent"
const labelClass = "block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1"

export default function KanbanBoard({ tarefasIniciais }: { tarefasIniciais: Tarefa[] }) {
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
    titulo: '', descricao: '', prioridade: 'NORMAL', status: 'A_FAZER', dataVencimento: '', prazoId: '',
  })
  const dragItem = useRef<string | null>(null)
  const statusAnterior = useRef<string | null>(null)

  // Busca prazos quando processo estiver definido na tarefa em edição
  useEffect(() => {
    if (!editando?.processo?.id) {
      setPrazosDisponiveis([])
      return
    }
    fetch(`/api/prazos?processoId=${editando.processo.id}`)
      .then(r => r.json())
      .then((data: PrazoOpcao[]) => setPrazosDisponiveis(Array.isArray(data) ? data : []))
      .catch(() => setPrazosDisponiveis([]))
  }, [editando?.processo?.id])

  function abrirEditar(t: Tarefa) {
    setEditForm({
      titulo: t.titulo,
      descricao: t.descricao ?? '',
      prioridade: t.prioridade,
      status: t.status,
      dataVencimento: t.dataVencimento ? t.dataVencimento.slice(0, 10) : '',
      prazoId: t.prazoId ?? '',
    })
    setEditando(t)
    setEditErro('')
  }

  function handleEditChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    setEditForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
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
        }),
      })
      if (!res.ok) throw new Error()
      const prazoSelecionado = prazosDisponiveis.find(p => p.id === editForm.prazoId) ?? null
      setTarefas(prev => prev.map(t =>
        t.id === editando.id
          ? {
              ...t,
              titulo: editForm.titulo,
              descricao: editForm.descricao || null,
              prioridade: editForm.prioridade,
              status: editForm.status,
              dataVencimento: editForm.dataVencimento ? new Date(editForm.dataVencimento).toISOString() : null,
              prazoId: editForm.prazoId || null,
              prazo: prazoSelecionado ? { id: prazoSelecionado.id, titulo: prazoSelecionado.titulo } : null,
            }
          : t
      ))
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
    const tarefa = tarefas.find(t => t.id === id)
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

    setTarefas(prev =>
      prev.map(t => t.id === id ? { ...t, status: colunaId } : t)
    )

    setSalvando(id)

    try {
      const res = await fetch(`/api/tarefas/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: colunaId }),
      })
      if (!res.ok) throw new Error()
    } catch {
      setTarefas(prev =>
        prev.map(t => t.id === id ? { ...t, status: anterior } : t)
      )
    } finally {
      setSalvando(null)
    }
  }

  // Filtra tarefas pela busca (título, descrição, responsável, processo)
  const tarefasFiltradas = busca.trim()
    ? tarefas.filter(t => {
        const q = busca.toLowerCase()
        return (
          t.titulo.toLowerCase().includes(q) ||
          t.descricao?.toLowerCase().includes(q) ||
          t.responsavel?.nome.toLowerCase().includes(q) ||
          t.processo?.numero?.toLowerCase().includes(q) ||
          t.prazo?.titulo.toLowerCase().includes(q)
        )
      })
    : tarefas

  const tarefasComPrazo = tarefasFiltradas
    .filter(t => t.dataVencimento && t.status !== 'CONCLUIDO')
    .sort((a, b) => new Date(a.dataVencimento!).getTime() - new Date(b.dataVencimento!).getTime())

  return (
    <>
      {/* Busca */}
      <div className="relative mb-5">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={busca}
          onChange={e => setBusca(e.target.value)}
          placeholder="Buscar por título, responsável, processo, prazo..."
          className="w-full border border-gray-200 rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
        />
      </div>

      {/* Abas */}
      <div className="flex gap-1 mb-6">
        <button
          onClick={() => setAba('kanban')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            aba === 'kanban' ? 'bg-green-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Kanban
        </button>
        <button
          onClick={() => setAba('comPrazo')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            aba === 'comPrazo' ? 'bg-green-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <Calendar size={14} />
          Com Prazo
          {tarefasComPrazo.length > 0 && (
            <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${aba === 'comPrazo' ? 'bg-white/20' : 'bg-amber-100 text-amber-700'}`}>
              {tarefasComPrazo.length}
            </span>
          )}
        </button>
      </div>

      {/* Aba Kanban */}
      {aba === 'kanban' && (
        <div className="flex gap-5 overflow-x-auto pb-4 min-h-96">
          {colunas.map(coluna => {
            const tarefasColuna = tarefasFiltradas.filter(t => t.status === coluna.id)
            const isOver = overColuna === coluna.id

            return (
              <div
                key={coluna.id}
                onDragOver={e => handleDragOver(e, coluna.id)}
                onDrop={() => handleDrop(coluna.id)}
                onDragLeave={() => setOverColuna(null)}
                className={`flex-shrink-0 w-72 rounded-xl border-2 p-4 transition-all ${
                  isOver ? 'border-green-400 bg-green-50 scale-[1.01]' : coluna.color
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-semibold text-gray-700">{coluna.label}</span>
                  <span className="text-xs font-semibold bg-white border border-gray-200 text-gray-500 px-2 py-0.5 rounded-full">
                    {tarefasColuna.length}
                  </span>
                </div>

                <div className="flex flex-col gap-3 min-h-16">
                  {tarefasColuna.length === 0 && (
                    <div className={`text-center text-xs py-8 border-2 border-dashed rounded-xl transition-colors ${
                      isOver ? 'border-green-400 text-green-600' : 'border-gray-200 text-gray-400'
                    }`}>
                      {isOver ? '↓ Solte aqui' : 'Nenhuma tarefa'}
                    </div>
                  )}

                  {tarefasColuna.map(tarefa => {
                    const prioridade = prioridadeConfig[tarefa.prioridade]
                    const isDragging = draggingId === tarefa.id
                    const isSalvando = salvando === tarefa.id
                    const vencida =
                      tarefa.dataVencimento &&
                      new Date(tarefa.dataVencimento) < new Date() &&
                      tarefa.status !== 'CONCLUIDO'

                    return (
                      <div
                        key={tarefa.id}
                        draggable
                        onDragStart={() => handleDragStart(tarefa.id)}
                        onDragEnd={handleDragEnd}
                        className={`bg-white border border-gray-200 rounded-xl p-4 shadow-sm select-none transition-all ${
                          isDragging
                            ? 'opacity-30 scale-95 cursor-grabbing'
                            : isSalvando
                            ? 'opacity-70 cursor-wait'
                            : 'cursor-grab hover:shadow-md hover:-translate-y-0.5'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <span className="text-sm font-medium text-gray-900 leading-snug">
                            {tarefa.titulo}
                          </span>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${prioridade.color}`}>
                              {prioridade.label}
                            </span>
                            <button
                              onMouseDown={e => e.stopPropagation()}
                              onClick={e => { e.stopPropagation(); abrirEditar(tarefa) }}
                              className="p-1 rounded text-gray-300 hover:text-green-700 hover:bg-green-50 transition-colors"
                              title="Editar"
                            >
                              <Pencil size={12} />
                            </button>
                          </div>
                        </div>

                        {tarefa.descricao && (
                          <p className="text-xs text-gray-400 mb-2 line-clamp-2 leading-relaxed">
                            {tarefa.descricao}
                          </p>
                        )}

                        {tarefa.processo && (
                          <div className="text-xs mb-1">
                            <Link
                              href={`/processos/${tarefa.processo.id}`}
                              className="text-green-700 hover:underline"
                              onClick={e => e.stopPropagation()}
                            >
                              {tarefa.processo.numero || 'Processo sem número'}
                            </Link>
                          </div>
                        )}

                        {tarefa.prazo && (
                          <div className="flex items-center gap-1 text-xs text-purple-700 mb-1">
                            <Link2 size={10} />
                            <span className="truncate">{tarefa.prazo.titulo}</span>
                          </div>
                        )}

                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
                          <div className="flex items-center gap-2">
                            {tarefa.responsavel && (
                              <div
                                className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-xs font-bold text-green-800"
                                title={tarefa.responsavel.nome}
                              >
                                {tarefa.responsavel.nome.charAt(0).toUpperCase()}
                              </div>
                            )}
                            {tarefa.dataVencimento && (
                              <span className={`text-xs ${vencida ? 'text-red-600 font-medium' : 'text-gray-400'}`}>
                                {new Date(tarefa.dataVencimento).toLocaleDateString('pt-BR')}
                                {vencida && ' ⚠️'}
                              </span>
                            )}
                          </div>
                          {isSalvando ? (
                            <span className="text-xs text-green-600">Salvando...</span>
                          ) : (
                            <span className="text-gray-300 text-xs select-none">⠿ arrastar</span>
                          )}
                        </div>
                      </div>
                    )
                  })}

                  {isOver && tarefasColuna.length > 0 && (
                    <div className="border-2 border-dashed border-green-300 rounded-xl h-12 flex items-center justify-center text-xs text-green-500">
                      ↓ Solte aqui
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Aba Com Prazo */}
      {aba === 'comPrazo' && (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          {tarefasComPrazo.length === 0 ? (
            <div className="p-16 text-center">
              <div className="text-gray-300 text-5xl mb-4">📅</div>
              <div className="text-gray-500 font-medium">Nenhuma tarefa com prazo em aberto</div>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-5 py-3">Tarefa</th>
                  <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-5 py-3">Prioridade</th>
                  <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-5 py-3">Status</th>
                  <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-5 py-3">Responsável</th>
                  <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-5 py-3">Vencimento</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {tarefasComPrazo.map(t => {
                  const p = prioridadeConfig[t.prioridade]
                  const vencida = new Date(t.dataVencimento!) < new Date()
                  const statusLabel: Record<string, string> = {
                    A_FAZER: 'A Fazer', EM_ANDAMENTO: 'Em Andamento',
                    AGUARDANDO_REVISAO: 'Aguard. Revisão', CONCLUIDO: 'Concluído', CANCELADO: 'Cancelado',
                  }
                  return (
                    <tr key={t.id} className={`border-b border-gray-50 last:border-0 transition-colors ${vencida ? 'bg-red-50' : 'hover:bg-gray-50'}`}>
                      <td className="px-5 py-3">
                        <div className="text-sm font-medium text-gray-900">{t.titulo}</div>
                        {t.processo && (
                          <div className="text-xs text-gray-400 mt-0.5">
                            <Link href={`/processos/${t.processo.id}`} className="text-green-700 hover:underline">
                              {t.processo.numero || 'Processo sem nº'}
                            </Link>
                          </div>
                        )}
                        {t.prazo && (
                          <div className="flex items-center gap-1 text-xs text-purple-700 mt-0.5">
                            <Link2 size={10} />
                            <span>{t.prazo.titulo}</span>
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${p.color}`}>{p.label}</span>
                      </td>
                      <td className="px-5 py-3 text-sm text-gray-600">{statusLabel[t.status] ?? t.status}</td>
                      <td className="px-5 py-3 text-sm text-gray-600">{t.responsavel?.nome || '—'}</td>
                      <td className={`px-5 py-3 text-sm font-medium ${vencida ? 'text-red-700' : 'text-gray-700'}`}>
                        {new Date(t.dataVencimento!).toLocaleDateString('pt-BR')}
                        {vencida && ' ⚠️'}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <button
                          onClick={() => abrirEditar(t)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-green-700 hover:bg-green-50 transition-colors"
                          title="Editar"
                        >
                          <Pencil size={14} />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Modal de edição */}
      {editando && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-base font-semibold text-gray-900">Editar Tarefa</h2>
              <button onClick={() => setEditando(null)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleEditSalvar} className="p-6">
              <div className="flex flex-col gap-4">
                <div>
                  <label className={labelClass}>Título *</label>
                  <input name="titulo" value={editForm.titulo} onChange={handleEditChange} className={inputClass} required />
                </div>
                <div>
                  <label className={labelClass}>Descrição</label>
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
                      <option value="EM_ANDAMENTO">Em Andamento</option>
                      <option value="AGUARDANDO_REVISAO">Aguard. Revisão</option>
                      <option value="CONCLUIDO">Concluído</option>
                      <option value="CANCELADO">Cancelado</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Data de Vencimento</label>
                  <input type="date" name="dataVencimento" value={editForm.dataVencimento} onChange={handleEditChange} className={inputClass} />
                </div>
                {editando.processo && (
                  <div>
                    <label className={labelClass}>Prazo Vinculado</label>
                    <select name="prazoId" value={editForm.prazoId} onChange={handleEditChange} className={inputClass}>
                      <option value="">Nenhum</option>
                      {prazosDisponiveis.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.titulo} — {new Date(p.dataFinal).toLocaleDateString('pt-BR')}
                        </option>
                      ))}
                    </select>
                    {prazosDisponiveis.length === 0 && (
                      <p className="text-xs text-gray-400 mt-1">Nenhum prazo cadastrado para este processo.</p>
                    )}
                  </div>
                )}
              </div>
              {editErro && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mt-4">{editErro}</div>}
              <div className="flex gap-3 mt-6">
                <button type="button" onClick={() => setEditando(null)} className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                  Cancelar
                </button>
                <button type="submit" disabled={editLoading} className="flex-1 px-4 py-2 text-sm font-medium text-white bg-green-800 rounded-lg hover:bg-green-700 disabled:opacity-50">
                  {editLoading ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
