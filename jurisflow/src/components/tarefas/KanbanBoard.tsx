'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'

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
}

export default function KanbanBoard({ tarefasIniciais }: { tarefasIniciais: Tarefa[] }) {
  const [tarefas, setTarefas] = useState<Tarefa[]>(tarefasIniciais)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [overColuna, setOverColuna] = useState<string | null>(null)
  const [salvando, setSalvando] = useState<string | null>(null)
  const dragItem = useRef<string | null>(null)
  const statusAnterior = useRef<string | null>(null)

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

    // Atualiza só o card movido
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
      // Reverte só o card que falhou
      setTarefas(prev =>
        prev.map(t => t.id === id ? { ...t, status: anterior } : t)
      )
    } finally {
      setSalvando(null)
    }
  }

  return (
    <div className="flex gap-5 overflow-x-auto pb-4 min-h-96">
      {colunas.map(coluna => {
        const tarefasColuna = tarefas.filter(t => t.status === coluna.id)
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
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${prioridade.color}`}>
                        {prioridade.label}
                      </span>
                    </div>

                    {tarefa.descricao && (
                      <p className="text-xs text-gray-400 mb-2 line-clamp-2 leading-relaxed">
                        {tarefa.descricao}
                      </p>
                    )}

                    {tarefa.processo && (
                      <div className="text-xs mb-2">
                        <Link
                          href={`/processos/${tarefa.processo.id}`}
                          className="text-green-700 hover:underline"
                          onClick={e => e.stopPropagation()}
                        >
                          {tarefa.processo.numero || 'Processo sem número'}
                        </Link>
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
  )
}