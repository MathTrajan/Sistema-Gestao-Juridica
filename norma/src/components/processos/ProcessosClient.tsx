'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Search } from 'lucide-react'

const areaLabels: Record<string, string> = {
  TRABALHISTA: 'Trabalhista', CIVIL: 'Cível', TRIBUTARIO: 'Tributário',
  PREVIDENCIARIO: 'Previdenciário', CRIMINAL: 'Criminal', FAMILIA: 'Família',
  EMPRESARIAL: 'Empresarial', CONSUMIDOR: 'Consumidor', AMBIENTAL: 'Ambiental', OUTRO: 'Outro',
}

const faseConfig: Record<string, { label: string; color: string }> = {
  CONHECIMENTO: { label: 'Conhecimento', color: 'bg-blue-50 text-blue-700' },
  RECURSAL: { label: 'Recursal', color: 'bg-amber-50 text-amber-700' },
  EXECUCAO: { label: 'Execução', color: 'bg-purple-50 text-purple-700' },
  ENCERRADO: { label: 'Encerrado', color: 'bg-gray-100 text-gray-500' },
}

const statusConfig: Record<string, { label: string; color: string }> = {
  EM_ANDAMENTO: { label: 'Em Andamento', color: 'bg-green-100 text-green-800' },
  AGUARDANDO_PECA: { label: 'Aguard. Peça', color: 'bg-amber-100 text-amber-800' },
  AGUARDANDO_CLIENTE: { label: 'Aguard. Cliente', color: 'bg-blue-100 text-blue-800' },
  SUSPENSO: { label: 'Suspenso', color: 'bg-gray-100 text-gray-600' },
  ENCERRADO_PROCEDENTE: { label: 'Procedente', color: 'bg-green-100 text-green-800' },
  ENCERRADO_IMPROCEDENTE: { label: 'Improcedente', color: 'bg-red-100 text-red-800' },
  ARQUIVADO: { label: 'Arquivado', color: 'bg-gray-100 text-gray-500' },
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

  const filtrados = processos.filter(p => {
    const q = busca.toLowerCase().trim()
    const matchBusca =
      !q ||
      p.numero?.toLowerCase().includes(q) ||
      p.cliente.nomeCompleto.toLowerCase().includes(q) ||
      p.tribunal?.toLowerCase().includes(q) ||
      p.tipoAcao?.toLowerCase().includes(q)
    const matchStatus = !statusFiltro || p.status === statusFiltro
    return matchBusca && matchStatus
  })

  return (
    <>
      {/* Barra de busca e filtro */}
      <div className="flex gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={busca}
            onChange={e => setBusca(e.target.value)}
            placeholder="Buscar por número, cliente, tribunal, tipo de ação..."
            className="w-full border border-gray-200 rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
          />
        </div>
        <select
          value={statusFiltro}
          onChange={e => setStatusFiltro(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-green-600 bg-white"
        >
          <option value="">Todos os status</option>
          <option value="EM_ANDAMENTO">Em Andamento</option>
          <option value="AGUARDANDO_PECA">Aguard. Peça</option>
          <option value="AGUARDANDO_CLIENTE">Aguard. Cliente</option>
          <option value="SUSPENSO">Suspenso</option>
          <option value="ENCERRADO_PROCEDENTE">Procedente</option>
          <option value="ENCERRADO_IMPROCEDENTE">Improcedente</option>
          <option value="ARQUIVADO">Arquivado</option>
        </select>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        {filtrados.length === 0 ? (
          <div className="p-16 text-center">
            <div className="text-gray-300 text-5xl mb-4">📄</div>
            <div className="text-gray-500 font-medium">
              {processos.length === 0 ? 'Nenhum processo cadastrado' : 'Nenhum resultado encontrado'}
            </div>
            <div className="text-gray-400 text-sm mt-1">
              {processos.length === 0 ? 'Clique em "Novo Processo" para começar' : 'Tente outros termos de busca'}
            </div>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-5 py-3">Número / Cliente</th>
                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-5 py-3">Área</th>
                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-5 py-3">Tribunal</th>
                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-5 py-3">Fase</th>
                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-5 py-3">Status</th>
                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-5 py-3">Responsável</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((p) => {
                const fase = faseConfig[p.fase]
                const status = statusConfig[p.status]
                return (
                  <tr key={p.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3">
                      <div className="font-medium text-sm text-green-700">{p.numero || 'Sem número'}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{p.cliente.nomeCompleto}</div>
                    </td>
                    <td className="px-5 py-3">
                      {p.areaJuridica ? (
                        <span className="text-xs font-medium bg-blue-50 text-blue-700 px-2 py-1 rounded-full">
                          {areaLabels[p.areaJuridica]}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-600">{p.tribunal || '—'}</td>
                    <td className="px-5 py-3">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${fase.color}`}>
                        {fase.label}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${status.color}`}>
                        {status.label}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-600">{p.responsavel?.nome || '—'}</td>
                    <td className="px-5 py-3">
                      <Link href={`/processos/${p.id}`} className="text-xs text-green-700 hover:underline font-medium">
                        Ver
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {busca && (
        <p className="text-xs text-gray-400 mt-3">
          {filtrados.length} resultado{filtrados.length !== 1 ? 's' : ''} de {processos.length} processo{processos.length !== 1 ? 's' : ''}
        </p>
      )}
    </>
  )
}
